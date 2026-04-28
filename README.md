# Court Marriage Delhi — Official Website

Delhi's trusted legal marriage consultancy website.
**Phone:** +91 98913 43962
**Offices:** Rohini Court Sec-14 (Near Sector-18 Metro) · Tis Hazari Court, Delhi

---

## Live Pages

| Page | File |
|---|---|
| Home | `index.html` |
| About Us | `about.html` |
| All Services | `services.html` |
| Court Marriage | `court-marriage.html` |
| Arya Samaj Marriage | `arya-samaj-marriage.html` |
| Muslim Nikah | `muslim-nikah.html` |
| Inter-Caste / SMA | `inter-caste-marriage.html` |
| Pricing & Packages | `pricing.html` |
| Contact Us | `contact.html` |
| 404 (custom) | `404.html` |

Shared assets: `css/style.css` and `js/main.js`.

---

## Deploy on GitHub Pages — Step-by-Step

### Method 1 — GitHub Website (Easiest, No Terminal)

1. **Create a GitHub account** at https://github.com (if you don't already have one).
2. On the top-right, click **+** → **New repository**.
3. Repository name: `courtmarriagedelhi` (or anything you prefer).
   - Choose **Public**.
   - **Do NOT** check "Add a README" (we already have one).
4. Click **Create repository**.
5. On the next screen click **"uploading an existing file"** link.
6. **Drag and drop ALL files** from this folder (including `css/` and `js/` folders) into the upload area.
   > Important: Upload files/folders — keep the folder structure intact.
7. Scroll down → click **Commit changes**.
8. Go to repo **Settings** → **Pages** (in left sidebar).
9. Under **Source**, select branch **`main`** and folder **`/ (root)`** → click **Save**.
10. Wait 1–2 minutes. GitHub will show:
    > Your site is live at `https://YOUR-USERNAME.github.io/courtmarriagedelhi/`
11. Done! ✅

### Method 2 — Git Terminal (Advanced)

```bash
# 1. Navigate to this folder
cd /path/to/this/folder

# 2. Initialize git
git init
git branch -M main

# 3. Create repo on GitHub first, then:
git remote add origin https://github.com/YOUR-USERNAME/courtmarriagedelhi.git

# 4. Stage and push
git add .
git commit -m "Initial commit — Court Marriage Delhi website"
git push -u origin main

# 5. Enable Pages: Settings → Pages → Source: main / root
```

---

## Connect Your Own Domain (e.g., courtmarriagedelhi.in)

1. Buy domain from GoDaddy / Namecheap / Hostinger.
2. In your domain's DNS settings, add these A records pointing to GitHub Pages:
   ```
   185.199.108.153
   185.199.109.153
   185.199.110.153
   185.199.111.153
   ```
3. Add a CNAME record for `www`:
   ```
   Type: CNAME | Host: www | Target: YOUR-USERNAME.github.io
   ```
4. In this repo, go to **Settings** → **Pages** → **Custom domain**.
5. Type your domain (e.g., `courtmarriagedelhi.in`) → **Save**.
6. Check the box **Enforce HTTPS** (wait 5–10 min if greyed out).
7. Done! Your site will be live at your own domain.

---

## Testing Locally (Optional)

Open `index.html` directly in your browser — it will work. For best results (so all links work like a real site), run a tiny local server:

```bash
# Python (already installed on Mac/Linux)
cd /path/to/this/folder
python3 -m http.server 8080
# Visit: http://localhost:8080
```

or

```bash
# Node.js
npx serve .
```

---

## Updating Content

All content is plain HTML. To change phone, pricing, addresses — just open any `.html` file in a text editor (VS Code, Notepad++) and use Find-and-Replace.

**Key things you might want to change:**
- Phone number: search for `9891343962`
- Main price: `₹6,100`, `₹3,100`, `₹7,000`, `₹12,000`
- Domain in canonical/sitemap: `courtmarriagedelhi.in`
- Addresses: `Rohini Court Sec-14` and `Tis Hazari`

After editing — push changes to GitHub (drag-drop upload again, or `git push`). Site updates automatically in 1–2 minutes.

---

## Files & Structure

```
/
├── index.html                   (Home — main landing)
├── about.html
├── services.html                (Services hub)
├── court-marriage.html
├── arya-samaj-marriage.html
├── muslim-nikah.html
├── inter-caste-marriage.html
├── pricing.html
├── contact.html
├── 404.html                     (Custom not-found page)
├── css/
│   └── style.css                (All styling)
├── js/
│   └── main.js                  (All interactions)
├── sitemap.xml                  (For Google indexing)
├── robots.txt                   (For search engine crawlers)
├── .nojekyll                    (Tells GitHub: don't process with Jekyll)
├── .gitignore
└── README.md                    (This file)
```

---

## Features Built-In

- ✅ Mobile-first responsive design
- ✅ Click-to-Call `tel:` buttons on every page (floating + sticky bar + inline)
- ✅ WhatsApp deep-links with pre-filled text
- ✅ Unique SEO meta tags per page (title, description, keywords)
- ✅ JSON-LD Schema.org markup (LegalService, Service, Offer)
- ✅ Canonical URLs + Open Graph tags
- ✅ Local SEO: Rohini Sec-18 Metro, Rohini Court, Tis Hazari prominently mentioned
- ✅ Internal multi-linking between service pages
- ✅ Contact form that sends inquiry via WhatsApp
- ✅ Google Maps embed on Contact page
- ✅ FAQ accordions on service pages
- ✅ Sitemap.xml + robots.txt for Google

---

## Submit to Google (After Going Live)

1. Go to https://search.google.com/search-console
2. Add your site as a property (URL prefix: `https://courtmarriagedelhi.in/`)
3. Verify ownership (upload the verification HTML file to this repo)
4. Submit sitemap: `https://courtmarriagedelhi.in/sitemap.xml`
5. Also submit on Bing Webmaster Tools: https://www.bing.com/webmasters

---

## Support

For any website edits / issues → update the HTML files and redeploy. Code is clean and well-commented — a freelancer can take it from here easily.

**Site built:** April 2026
**Phone:** +91 98913 43962 (Deepu)

---

© 2026 Court Marriage Consultants Delhi. All Rights Reserved.
