# Real-Time AI SEO Project Management SaaS Blueprint (Hostinger-Ready)

## 1) Recommended Architecture

- **Frontend:** React + Vite + Tailwind CSS (fast dashboard UX).
- **Backend API:** Node.js + Express + TypeScript.
- **Realtime Layer:** Socket.IO (task updates, status changes, crawl progress).
- **DB:** MySQL 8 (Hostinger managed DB).
- **Queue/Scheduler:** Node Cron + BullMQ (optional Redis) or pure `node-cron` for simple daily automation.
- **Storage:** Hostinger object storage or local `/uploads` + signed URLs.
- **Deployment shape on Hostinger:**
  - Frontend static build served from `public_html`.
  - Backend deployed as Node app/subdomain (e.g., `api.yourdomain.com`).

---

## 2) Project Folder Structure

```txt
seo-pm-app/
  apps/
    api/
      src/
        config/
        modules/
          auth/
          users/
          websites/
          competitors/
          seo-data/
          tasks/
          uploads/
          ai-manager/
          reports/
        jobs/
          midnight-task-generator.ts
          crawl-refresh.ts
        realtime/
          socket.ts
        middleware/
        app.ts
        server.ts
      prisma/
        schema.prisma
      package.json
    web/
      src/
        pages/
          OwnerDashboard.tsx
          TeamDashboard.tsx
          Login.tsx
        components/
          TaskCard.tsx
          WebsiteHealthTable.tsx
          DailySummaryPanel.tsx
        lib/
          api.ts
          socket.ts
      index.html
      package.json
  docker-compose.yml
  README.md
```

---

## 3) Database Schema (MySQL)

```sql
CREATE TABLE users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(160) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('OWNER','TEAM_MEMBER','ADMIN') NOT NULL,
  team_specialty ENUM('CONTENT','BACKLINKS','TECHNICAL','COMPETITOR_TRACKING','ON_PAGE','REPORTING') NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE websites (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  owner_id BIGINT NOT NULL,
  name VARCHAR(160) NOT NULL,
  domain VARCHAR(255) UNIQUE NOT NULL,
  industry VARCHAR(100),
  timezone VARCHAR(64) DEFAULT 'Asia/Kolkata',
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id)
);

CREATE TABLE competitors (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  website_id BIGINT NOT NULL,
  competitor_name VARCHAR(160) NOT NULL,
  competitor_domain VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_competitor_per_site (website_id, competitor_domain),
  FOREIGN KEY (website_id) REFERENCES websites(id)
);

CREATE TABLE seo_snapshots (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  website_id BIGINT NOT NULL,
  source ENUM('CLIENT','COMPETITOR') NOT NULL,
  competitor_id BIGINT NULL,
  snapshot_date DATE NOT NULL,
  page_speed_score INT,
  indexed_pages INT,
  avg_position DECIMAL(6,2),
  organic_traffic_est INT,
  meta_issues_count INT,
  technical_issues_count INT,
  backlinks_count INT,
  json_payload JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_snapshot_daily (website_id, source, competitor_id, snapshot_date),
  FOREIGN KEY (website_id) REFERENCES websites(id),
  FOREIGN KEY (competitor_id) REFERENCES competitors(id)
);

CREATE TABLE daily_tasks (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  website_id BIGINT NOT NULL,
  assignee_id BIGINT NOT NULL,
  assigned_by_ai TINYINT(1) DEFAULT 1,
  task_date DATE NOT NULL,
  category ENUM('CONTENT','BACKLINKS','TECHNICAL','ON_PAGE','COMPETITOR_TRACKING') NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  priority ENUM('LOW','MEDIUM','HIGH','CRITICAL') DEFAULT 'MEDIUM',
  status ENUM('PENDING','IN_PROGRESS','SUBMITTED','VERIFIED','REJECTED') DEFAULT 'PENDING',
  verification_notes TEXT,
  started_at DATETIME NULL,
  completed_at DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_assignee_daily_task (assignee_id, website_id, task_date, category),
  FOREIGN KEY (website_id) REFERENCES websites(id),
  FOREIGN KEY (assignee_id) REFERENCES users(id)
);

CREATE TABLE task_attachments (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  task_id BIGINT NOT NULL,
  uploaded_by BIGINT NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100),
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES daily_tasks(id),
  FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

CREATE TABLE keyword_movements (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  website_id BIGINT NOT NULL,
  keyword VARCHAR(255) NOT NULL,
  tracked_date DATE NOT NULL,
  rank_position INT,
  previous_rank_position INT,
  movement INT,
  url VARCHAR(500),
  source VARCHAR(80),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_keyword_daily (website_id, keyword, tracked_date),
  FOREIGN KEY (website_id) REFERENCES websites(id)
);

CREATE TABLE ai_daily_summaries (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  website_id BIGINT NOT NULL,
  summary_date DATE NOT NULL,
  generated_for_owner_id BIGINT NOT NULL,
  completion_rate DECIMAL(5,2),
  overall_seo_health_score DECIMAL(5,2),
  blockers TEXT,
  wins TEXT,
  next_actions TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_summary_daily (website_id, summary_date),
  FOREIGN KEY (website_id) REFERENCES websites(id),
  FOREIGN KEY (generated_for_owner_id) REFERENCES users(id)
);
```

---

## 4) Backend Daily Task Generation Logic (Express + TypeScript)

```ts
// apps/api/src/jobs/midnight-task-generator.ts
import cron from 'node-cron';
import { db } from '../config/db';
import { buildTasksFromDiff } from '../modules/ai-manager/task-engine';
import { io } from '../realtime/socket';

// Every day at 00:00 in Asia/Kolkata
cron.schedule('0 0 * * *', async () => {
  const today = new Date().toISOString().slice(0, 10);

  const websites = await db.website.findMany({
    where: { isActive: true },
    include: { competitors: true }
  });

  for (const site of websites) {
    // 1) Pull latest client + competitor snapshots (from APIs or previous crawler job)
    const clientSnapshot = await db.seoSnapshot.findFirst({
      where: { websiteId: site.id, source: 'CLIENT', snapshotDate: today }
    });

    const competitorSnapshots = await db.seoSnapshot.findMany({
      where: {
        websiteId: site.id,
        source: 'COMPETITOR',
        snapshotDate: today
      }
    });

    if (!clientSnapshot || competitorSnapshots.length === 0) continue;

    // 2) Build SEO deficiency diff
    const generated = buildTasksFromDiff({
      website: site,
      client: clientSnapshot,
      competitors: competitorSnapshots
    });

    // 3) Avoid repeats based on yesterday + unresolved tasks
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const recentTasks = await db.dailyTask.findMany({
      where: {
        websiteId: site.id,
        taskDate: { in: [today, yesterday] }
      }
    });

    const deduped = generated.filter(t =>
      !recentTasks.some(r => r.category === t.category && r.title === t.title && r.status !== 'VERIFIED')
    );

    // 4) Assign to team by specialty
    for (const task of deduped.slice(0, 5)) {
      const assignee = await db.user.findFirst({
        where: {
          role: 'TEAM_MEMBER',
          teamSpecialty: task.category,
          isActive: true
        }
      });
      if (!assignee) continue;

      await db.dailyTask.upsert({
        where: {
          assigneeId_websiteId_taskDate_category: {
            assigneeId: assignee.id,
            websiteId: site.id,
            taskDate: today,
            category: task.category
          }
        },
        update: {
          title: task.title,
          description: task.description,
          priority: task.priority,
          status: 'PENDING'
        },
        create: {
          websiteId: site.id,
          assigneeId: assignee.id,
          taskDate: today,
          category: task.category,
          title: task.title,
          description: task.description,
          priority: task.priority,
          assignedByAi: true
        }
      });

      io.to(`user:${assignee.id}`).emit('task:assigned', {
        websiteId: site.id,
        date: today,
        category: task.category,
        title: task.title
      });
    }
  }

  io.to('role:OWNER').emit('dashboard:refresh', { date: today });
}, {
  timezone: 'Asia/Kolkata'
});
```

### Task Engine Sketch

```ts
// apps/api/src/modules/ai-manager/task-engine.ts
export function buildTasksFromDiff(input: any) {
  const tasks = [];

  if (input.client.pageSpeedScore < 75) {
    tasks.push({
      category: 'TECHNICAL',
      title: 'Improve Core Web Vitals on top 5 landing pages',
      description: 'Compress hero images, defer non-critical JS, and optimize LCP for pages with highest traffic.',
      priority: 'HIGH'
    });
  }

  if (input.client.metaIssuesCount > 0) {
    tasks.push({
      category: 'ON_PAGE',
      title: 'Fix missing/duplicate meta tags',
      description: 'Resolve duplicate titles and missing meta descriptions from crawl report.',
      priority: 'MEDIUM'
    });
  }

  // Add competitor-gap based rules + optional LLM enrichment
  return tasks;
}
```

---

## 5) API Contract (Key Endpoints)

- `POST /auth/login`
- `GET /owner/websites`
- `POST /owner/websites`
- `POST /owner/websites/:id/competitors`
- `GET /owner/tasks?date=YYYY-MM-DD`
- `GET /team/me/tasks?date=YYYY-MM-DD`
- `PATCH /team/tasks/:id/start`
- `PATCH /team/tasks/:id/complete`
- `POST /team/tasks/:id/upload`
- `PATCH /ai/tasks/:id/verify`
- `GET /owner/daily-summary?date=YYYY-MM-DD`

---

## 6) Security + Production Hardening

- JWT access + refresh tokens (HTTP-only cookies).
- RBAC middleware by role (`OWNER`, `TEAM_MEMBER`, `ADMIN`).
- Passwords hashed with Argon2/bcrypt.
- Rate-limit login/API routes.
- Input validation with Zod/Joi.
- Audit log table for critical actions.
- Signed upload URLs + MIME/size validation.
- Use HTTPS, CORS allowlist, Helmet headers.
- Daily DB backups + retention policy.

---

## 7) Owner + Team Dashboard UI Template (HTML/CSS/JS)

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AI SEO Project Manager</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen">
  <div class="max-w-7xl mx-auto p-4 md:p-8">
    <header class="flex items-center justify-between mb-6">
      <h1 class="text-2xl md:text-3xl font-bold">AI SEO Manager Dashboard</h1>
      <span id="today" class="text-slate-300"></span>
    </header>

    <section class="grid md:grid-cols-3 gap-4 mb-6">
      <div class="rounded-2xl bg-slate-900 border border-slate-800 p-4">
        <p class="text-slate-400 text-sm">Active Websites</p>
        <p id="activeSites" class="text-3xl font-semibold">0</p>
      </div>
      <div class="rounded-2xl bg-slate-900 border border-slate-800 p-4">
        <p class="text-slate-400 text-sm">Tasks Assigned Today</p>
        <p id="taskCount" class="text-3xl font-semibold">0</p>
      </div>
      <div class="rounded-2xl bg-slate-900 border border-slate-800 p-4">
        <p class="text-slate-400 text-sm">Completion Rate</p>
        <p id="completionRate" class="text-3xl font-semibold">0%</p>
      </div>
    </section>

    <section class="grid lg:grid-cols-2 gap-6">
      <div class="rounded-2xl bg-slate-900 border border-slate-800 p-4">
        <h2 class="text-xl font-semibold mb-3">Owner View: Master Task Plan</h2>
        <div id="ownerTaskList" class="space-y-3"></div>
      </div>

      <div class="rounded-2xl bg-slate-900 border border-slate-800 p-4">
        <h2 class="text-xl font-semibold mb-3">Team View: My Tasks</h2>
        <div id="teamTaskList" class="space-y-3"></div>
      </div>
    </section>
  </div>

<script>
  const today = new Date().toISOString().slice(0,10);
  document.getElementById('today').textContent = `Date: ${today}`;

  // Mock API data
  const tasks = [
    { id: 1, website: 'site-a.com', assignee: 'Ravi', role: 'TECHNICAL', title: 'Fix LCP on homepage', status: 'PENDING' },
    { id: 2, website: 'site-a.com', assignee: 'Neha', role: 'CONTENT', title: 'Publish cluster page: Court Marriage Fees', status: 'IN_PROGRESS' },
    { id: 3, website: 'site-b.com', assignee: 'Aman', role: 'BACKLINKS', title: 'Acquire 3 legal niche backlinks', status: 'PENDING' }
  ];

  document.getElementById('activeSites').textContent = '2';
  document.getElementById('taskCount').textContent = tasks.length;
  document.getElementById('completionRate').textContent = '33%';

  const ownerTaskList = document.getElementById('ownerTaskList');
  tasks.forEach(t => {
    ownerTaskList.innerHTML += `
      <div class="p-3 rounded-xl border border-slate-700">
        <p class="font-medium">${t.title}</p>
        <p class="text-sm text-slate-400">${t.website} • ${t.assignee} • ${t.role}</p>
        <p class="text-xs mt-1">Status: <span class="text-cyan-300">${t.status}</span></p>
      </div>`;
  });

  const myTasks = tasks.filter(t => t.assignee === 'Neha');
  const teamTaskList = document.getElementById('teamTaskList');
  myTasks.forEach(t => {
    teamTaskList.innerHTML += `
      <div class="p-3 rounded-xl border border-slate-700">
        <p class="font-medium">${t.title}</p>
        <p class="text-sm text-slate-400">${t.website}</p>
        <div class="mt-2 flex gap-2">
          <button onclick="markComplete(${t.id})" class="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-sm">Mark as Complete</button>
          <input type="file" class="text-xs" />
        </div>
      </div>`;
  });

  function markComplete(taskId) {
    alert(`Task ${taskId} marked complete (wire to PATCH /team/tasks/:id/complete)`);
  }
</script>
</body>
</html>
```

---

## 8) Implementation Milestones

1. **Phase 1 (MVP):** Auth, roles, websites, competitors, daily tasks, owner/team dashboards.
2. **Phase 2:** Automated crawling integrations (PageSpeed, meta crawler, rank tracker).
3. **Phase 3:** AI task quality scoring + verification workflow + daily summary PDF/email.
4. **Phase 4:** Advanced analytics, anomaly alerts, and predictive SEO planning.

This blueprint gives you a production-grade baseline that can run on Hostinger with MySQL and Node.js while staying modular enough to scale later.
