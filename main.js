/* =============================================================
   Court Marriage Delhi — main.js
   Handles: mobile nav · slider · popup · FAQ · bg canvas · reveal
   ============================================================= */
(function(){
  'use strict';

  /* -------- helpers -------- */
  var $  = function(sel, root){ return (root||document).querySelector(sel); };
  var $$ = function(sel, root){ return Array.prototype.slice.call((root||document).querySelectorAll(sel)); };

  function on(el, evt, fn){ if(el) el.addEventListener(evt, fn, {passive:true}); }
  function onC(el, evt, fn){ if(el) el.addEventListener(evt, fn); } // cancelable

  /* ================= 1. MOBILE NAV ================= */
  function initMobileNav(){
    var btn      = $('#navMobileBtn');
    var closeBtn = $('#navMobileClose');
    var drawer   = $('#navMobileDrawer');
    var overlay  = $('#navMobileOverlay');
    if(!drawer || !overlay) return;

    function open(){ drawer.classList.add('open'); overlay.classList.add('open'); document.body.style.overflow='hidden'; }
    function close(){ drawer.classList.remove('open'); overlay.classList.remove('open'); document.body.style.overflow=''; }

    on(btn,'click',open);
    on(closeBtn,'click',close);
    on(overlay,'click',close);

    // close when clicking any link inside the drawer
    $$('a', drawer).forEach(function(a){ on(a,'click',close); });

    // ESC to close
    onC(document,'keydown', function(e){ if(e.key==='Escape') close(); });
  }

  /* ================= 2. SLIDER ================= */
  var sliderState = { index:0, count:0, track:null, dotsEl:null, timer:null };

  function goSlide(i){
    var s = sliderState;
    if(!s.track || s.count===0) return;
    s.index = ((i % s.count) + s.count) % s.count;
    s.track.style.transform = 'translateX(-'+ (s.index*100) +'%)';
    if(s.dotsEl){
      $$('button', s.dotsEl).forEach(function(d,di){
        d.classList.toggle('active', di===s.index);
      });
    }
  }
  window.nextSlide = function(){ goSlide(sliderState.index+1); resetTimer(); };
  window.prevSlide = function(){ goSlide(sliderState.index-1); resetTimer(); };

  function resetTimer(){
    if(sliderState.timer) clearInterval(sliderState.timer);
    if(sliderState.count>1){
      sliderState.timer = setInterval(function(){ window.nextSlide(); }, 5000);
    }
  }

  function initSlider(){
    var track = $('#sliderTrack');
    var dots  = $('#sliderDots');
    if(!track) return;
    var slides = $$('.slide', track);
    sliderState.track = track;
    sliderState.count = slides.length;
    sliderState.dotsEl = dots;
    if(slides.length===0) return;

    if(dots){
      dots.innerHTML='';
      slides.forEach(function(_,i){
        var b = document.createElement('button');
        b.type='button';
        b.setAttribute('aria-label','Go to slide '+(i+1));
        if(i===0) b.classList.add('active');
        b.addEventListener('click', function(){ goSlide(i); resetTimer(); });
        dots.appendChild(b);
      });
    }

    // touch swipe
    var startX=0, endX=0, dragging=false;
    track.addEventListener('touchstart', function(e){ startX = e.touches[0].clientX; dragging=true; }, {passive:true});
    track.addEventListener('touchmove',  function(e){ endX   = e.touches[0].clientX; }, {passive:true});
    track.addEventListener('touchend',   function(){
      if(!dragging) return;
      var d = endX - startX;
      if(Math.abs(d)>40){ if(d<0) window.nextSlide(); else window.prevSlide(); }
      dragging=false; startX=0; endX=0;
    });

    // pause on hover
    var wrap = track.parentElement;
    if(wrap){
      wrap.addEventListener('mouseenter', function(){ if(sliderState.timer) clearInterval(sliderState.timer); });
      wrap.addEventListener('mouseleave', resetTimer);
    }

    resetTimer();
  }

  /* ================= 3. POPUP ================= */
  var popupState = { shown:false, timer:null, barTimer:null };
  window.closePopup = function(){
    var p = $('#popup'); if(!p) return;
    p.classList.remove('open');
    if(popupState.timer){ clearInterval(popupState.timer); popupState.timer=null; }
    if(popupState.barTimer){ clearTimeout(popupState.barTimer); popupState.barTimer=null; }
    try{ sessionStorage.setItem('cm_popup_shown','1'); }catch(e){}
  };

  function openPopup(){
    var p = $('#popup'); if(!p || popupState.shown) return;
    // Don't show again same session
    try{ if(sessionStorage.getItem('cm_popup_shown')==='1') return; }catch(e){}
    popupState.shown = true;
    p.classList.add('open');

    var secEl = $('#popup-sec');
    var barEl = $('#popup-bar');
    var total = 15, remaining = total;
    if(secEl) secEl.textContent = remaining;

    if(barEl){
      // trigger CSS transition after paint
      barEl.style.transition='none'; barEl.style.width='100%';
      popupState.barTimer = setTimeout(function(){
        barEl.style.transition='width '+total+'s linear';
        barEl.style.width='0%';
      }, 50);
    }
    popupState.timer = setInterval(function(){
      remaining--;
      if(secEl) secEl.textContent = remaining;
      if(remaining<=0){ window.closePopup(); }
    }, 1000);
  }

  function initPopup(){
    if(!$('#popup')) return;
    // Show after 6 seconds on first visit of session
    setTimeout(openPopup, 6000);
  }

  /* ================= 4. FAQ ================= */
  function initFAQ(){
    $$('.faq-item').forEach(function(item){
      var q = $('.faq-q', item);
      if(!q) return;
      q.addEventListener('click', function(){
        var wasOpen = item.classList.contains('open');
        // close siblings
        $$('.faq-item').forEach(function(x){ x.classList.remove('open'); });
        if(!wasOpen) item.classList.add('open');
      });
    });
  }

  /* ================= 5. SCROLL REVEAL ================= */
  function initReveal(){
    var items = $$('.reveal');
    if(items.length===0) return;
    if(!('IntersectionObserver' in window)){
      items.forEach(function(el){ el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if(en.isIntersecting){
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      });
    }, { threshold:0.1, rootMargin:'0px 0px -60px 0px' });
    items.forEach(function(el){ io.observe(el); });
  }

  /* ================= 6. BG CANVAS (subtle particles) ================= */
  function initCanvas(){
    var c = $('#bgCanvas'); if(!c) return;
    // respect reduced motion
    if(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches){ return; }

    var ctx = c.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio||1, 2);
    var w, h, particles=[];

    function resize(){
      w = c.clientWidth = window.innerWidth;
      h = c.clientHeight = window.innerHeight;
      c.width  = Math.floor(w * dpr);
      c.height = Math.floor(h * dpr);
      ctx.setTransform(dpr,0,0,dpr,0,0);
    }

    function spawn(){
      var count = window.innerWidth < 700 ? 30 : 60;
      particles = [];
      for(var i=0;i<count;i++){
        particles.push({
          x: Math.random()*w,
          y: Math.random()*h,
          r: Math.random()*1.6 + 0.4,
          vx:(Math.random()-0.5)*0.18,
          vy:(Math.random()-0.5)*0.18,
          a: Math.random()*0.5 + 0.2
        });
      }
    }

    function draw(){
      ctx.clearRect(0,0,w,h);
      for(var i=0;i<particles.length;i++){
        var p = particles[i];
        p.x += p.vx; p.y += p.vy;
        if(p.x<0) p.x = w; else if(p.x>w) p.x = 0;
        if(p.y<0) p.y = h; else if(p.y>h) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
        ctx.fillStyle = 'rgba(242,207,107,'+p.a+')';
        ctx.fill();
      }
      requestAnimationFrame(draw);
    }

    resize(); spawn(); draw();
    var rT; window.addEventListener('resize', function(){
      clearTimeout(rT);
      rT = setTimeout(function(){ resize(); spawn(); }, 120);
    });
  }

  /* ================= 7. INIT ================= */
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
  function boot(){
    try{ initMobileNav(); }catch(e){ console.warn('nav',e); }
    try{ initSlider();    }catch(e){ console.warn('slider',e); }
    try{ initPopup();     }catch(e){ console.warn('popup',e); }
    try{ initFAQ();       }catch(e){ console.warn('faq',e); }
    try{ initReveal();    }catch(e){ console.warn('reveal',e); }
    try{ initCanvas();    }catch(e){ console.warn('canvas',e); }
  }
})();
