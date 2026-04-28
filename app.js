    // ══════ SPA ROUTER ══════
    const FM_PAGE_META = {
      home:             { title: 'FreeDoMind — Life, Mindset & Business Coaching by Christine Borg', description: 'Life, mindset and business coaching with Christine Borg. Empowering minds to break through limits and live with purpose, freedom and clarity.' },
      about:            { title: 'About Christine Borg — FreeDoMind',               description: 'Meet Christine Borg — life coach, speaker and trainer on a mission to transform minds and lives, one breakthrough at a time.' },
      freedom:          { title: 'The Freedom Hub — FreeDoMind',                    description: 'Explore the Freedom Hub — every way Christine Borg helps you unlock potential, personally and professionally.' },
      'one-on-one':     { title: 'One-On-One Coaching — FreeDoMind',                description: 'One-on-one coaching with Christine Borg. Break through limiting beliefs and create lasting transformation in every area of life.' },
      'team-coaching':  { title: 'Team Coaching & Workshops — FreeDoMind',          description: 'Team coaching and workshops with Christine Borg. Transform how your team thinks, leads and achieves — build a culture of excellence.' },
      speaking:         { title: 'Speaking & Keynotes — FreeDoMind',                description: 'Book Christine Borg to speak. Electrifying, heart-centred keynotes with practical tools to live and lead with freedom and purpose.' },
      contact:          { title: 'Contact Christine — FreeDoMind',                  description: "Get in touch with Christine Borg. Book a discovery call, request a talk, or say hello — let's start your journey." }
    };
    function fmApplyPageMeta(id) {
      const meta = FM_PAGE_META[id];
      if (!meta) return;
      document.title = meta.title;
      const pairs = [
        ['meta[name="description"]',         'content', meta.description],
        ['meta[property="og:title"]',        'content', meta.title],
        ['meta[property="og:description"]',  'content', meta.description],
        ['meta[name="twitter:title"]',       'content', meta.title],
        ['meta[name="twitter:description"]', 'content', meta.description]
      ];
      pairs.forEach(([sel, attr, val]) => {
        const el = document.querySelector(sel);
        if (el) el.setAttribute(attr, val);
      });
    }

    function showPage(id, skipPush) {
      const target = document.getElementById('page-' + id);
      // Already on this page → just scroll up, skip the heavy swap (saves ~190ms+)
      if (target && target.classList.contains('active') && !skipPush) {
        window.scrollTo({ top: 0, behavior: 'auto' });
        return;
      }
      const prevActive = document.querySelector('.page.active');
      const prevId = prevActive ? prevActive.id.replace(/^page-/, '') : null;
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      if (target) target.classList.add('active');
      fmApplyPageMeta(id);
      if (!skipPush) history.pushState({ page: id }, '', '#' + id);
      window.scrollTo({ top: 0, behavior: 'instant' });

      // Update nav active state
      document.querySelectorAll('.nav-links a[data-page]').forEach(a => {
        a.classList.toggle('active-page', a.dataset.page === id);
      });

      // Re-trigger coaching hero image animation on each visit
      if (id === 'one-on-one') {
        const heroImg = document.querySelector('#page-one-on-one .coaching-hero-image img');
        if (heroImg) {
          heroImg.classList.remove('hero-loaded');
          heroImg.style.animation = 'none';
          heroImg.offsetHeight; // reflow
          heroImg.style.animation = '';
          if (heroImg.complete) {
            setTimeout(() => heroImg.classList.add('hero-loaded'), 1260);
          } else {
            heroImg.addEventListener('load', () => {
              setTimeout(() => heroImg.classList.add('hero-loaded'), 1260);
            }, { once: true });
          }
        }
      }

      // Toggle transparent nav for full-bleed photo hero pages
      const nav = document.getElementById('main-nav');
      if (nav) {
        const photoHeroPages = ['home', 'about', 'one-on-one', 'team-coaching', 'speaking', 'contact'];
        nav.classList.toggle('nav-photo-hero', photoHeroPages.includes(id));
        // Reset inline nav styles immediately so lerpNav recalculates from scrollY=0
        nav.style.background = '';
        nav.style.backdropFilter = '';
        nav.style.webkitBackdropFilter = '';
        nav.style.boxShadow = '';
        const _navLinks = nav.querySelector('.nav-links');
        if (_navLinks) _navLinks.style.background = id === 'freedom' ? 'transparent' : '';
        if (typeof lerpNav === 'function') lerpNav();
      }

      // Re-run reveal for new page content (rAF over setTimeout — runs in same frame as paint)
      requestAnimationFrame(() => initReveal());

      // Notify motion system
      window.dispatchEvent(new CustomEvent('fm-page-changed', { detail: { page: id } }));

      // ScrollTrigger.refresh recalculates ALL trigger positions (expensive). Only home has triggers.
      // Skip refresh entirely when navigating between non-home pages — pure waste otherwise.
      if (typeof ScrollTrigger !== 'undefined' && (id === 'home' || prevId === 'home')) {
        setTimeout(() => ScrollTrigger.refresh(), 120);
      }
    }

    // ══════ NAV SCROLL STATE (smooth rAF lerp) ══════
    const nav = document.getElementById('main-nav');
    let _rafNav = null;
    function lerpNav() {
      _rafNav = null;
      const isPhotoHero = nav.classList.contains('nav-photo-hero');
      if (isPhotoHero) {
        // Determine when the active page's hero ends so the nav pill can fade in past it
        const activePage = document.querySelector('.page.active');
        const heroEl = activePage && (activePage.querySelector('.fm-cinema-hero') || activePage.querySelector('.page-hero'));
        const heroBottom = heroEl ? heroEl.offsetTop + heroEl.offsetHeight : 600;
        const rampStart = heroBottom - 80;
        const rampEnd   = heroBottom + 220;
        const raw = (window.scrollY - rampStart) / (rampEnd - rampStart);
        const p   = Math.max(0, Math.min(1, raw));
        const e   = p * p * (3 - 2 * p); // smoothstep
        const navAlpha = (0.92 * e).toFixed(3);
        const blurV    = (18 * e).toFixed(1);
        const pink     = (0.12 * e).toFixed(3);
        const blk      = (0.5 * e).toFixed(3);
        nav.style.background           = `rgba(61,8,16,${navAlpha})`;
        nav.style.backdropFilter       = e > 0.01 ? `blur(${blurV}px)` : 'none';
        nav.style.webkitBackdropFilter = e > 0.01 ? `blur(${blurV}px)` : 'none';
        nav.style.boxShadow            = `0 1px 0 rgba(248,189,206,${pink}),0 8px 40px rgba(0,0,0,${blk})`;
        const navLinks = nav.querySelector('.nav-links');
        if (navLinks) navLinks.style.background = 'transparent';
      } else {
        const p     = Math.min(window.scrollY / 80, 1);
        const alpha = (0.45 + 0.52 * p).toFixed(3);
        const blurV = (14   + 6    * p).toFixed(1);
        const padV  = (1.625 - 0.5 * p).toFixed(4);
        const pink  = (0.12  * p).toFixed(3);
        const blk   = (0.5   * p).toFixed(3);
        nav.style.background           = `rgba(61,8,16,${alpha})`;
        nav.style.backdropFilter       = `blur(${blurV}px)`;
        nav.style.webkitBackdropFilter = `blur(${blurV}px)`;
        nav.style.paddingTop           = `${padV}rem`;
        nav.style.paddingBottom        = `${padV}rem`;
        nav.style.boxShadow            = `0 1px 0 rgba(248,189,206,${pink}),0 8px 40px rgba(0,0,0,${blk})`;
      }
    }
    window.addEventListener('scroll', () => {
      if (!_rafNav) _rafNav = requestAnimationFrame(lerpNav);
    }, { passive: true });
    lerpNav();

    // ══════ HASH ROUTING ══════
    window.addEventListener('popstate', function(e) {
      var page = (e.state && e.state.page) || location.hash.replace('#', '') || 'home';
      showPage(page, true);
    });
    // On first load, pick up hash if present (e.g. #about)
    (function() {
      var hash = location.hash.replace('#', '');
      if (hash && document.getElementById('page-' + hash)) {
        showPage(hash, true);
      } else {
        history.replaceState({ page: 'home' }, '', '#home');
      }
    })();

    // ══════ SCROLL REVEAL ══════
    let revealObserver;
    function initReveal() {
      if (revealObserver) revealObserver.disconnect();
      revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('visible');
            revealObserver.unobserve(e.target);
          }
        });
      }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
      document.querySelectorAll('.page.active .reveal, .page.active .reveal-left').forEach(el => {
        el.classList.remove('visible');
        revealObserver.observe(el);
      });
    }

    // ══════ ANIMATED COUNTERS (home only) ══════
    function initCounters() {
      const statsSection = document.querySelector('#page-home .stats');
      if (!statsSection) return;
      new IntersectionObserver((entries) => {
        if (!entries[0].isIntersecting) return;
        document.querySelectorAll('.stat-num').forEach(el => {
          const html = el.innerHTML;
          const match = html.match(/^([\d.]+)(.*)$/);
          if (!match) return;
          const target = parseFloat(match[1]);
          const suffix = match[2];
          let cur = 0;
          const step = target / 55;
          const timer = setInterval(() => {
            cur = Math.min(cur + step, target);
            const display = Number.isInteger(target) ? Math.round(cur) : cur.toFixed(1);
            el.innerHTML = display + suffix;
            if (cur >= target) clearInterval(timer);
          }, 16);
        });
      }, { threshold: 0.3 }).observe(statsSection);
    }

    // ══════ MOBILE DRAWER ══════
    const hamburger = document.getElementById('nav-hamburger');
    const drawer    = document.getElementById('mobile-drawer');
    const backdrop  = document.getElementById('drawer-backdrop');

    function openDrawer() {
      hamburger.classList.add('is-open');
      hamburger.setAttribute('aria-expanded', 'true');
      drawer.classList.add('is-open');
      backdrop.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    }
    function closeDrawer() {
      hamburger.classList.remove('is-open');
      hamburger.setAttribute('aria-expanded', 'false');
      drawer.classList.remove('is-open');
      backdrop.classList.remove('is-open');
      document.body.style.overflow = '';
      // Reset Freedom accordion
      const ft = document.getElementById('drawer-freedom-trigger');
      const fc = document.getElementById('drawer-freedom-content');
      if (ft && fc) {
        ft.classList.remove('is-open');
        ft.setAttribute('aria-expanded', 'false');
        fc.classList.remove('is-open');
      }
    }
    hamburger.addEventListener('click', () => {
      drawer.classList.contains('is-open') ? closeDrawer() : openDrawer();
    });

    // ══════ DRAWER ACCORDION ══════
    const freedomTrigger = document.getElementById('drawer-freedom-trigger');
    const freedomContent = document.getElementById('drawer-freedom-content');
    if (freedomTrigger && freedomContent) {
      freedomTrigger.addEventListener('click', () => {
        const open = freedomContent.classList.contains('is-open');
        freedomContent.classList.toggle('is-open', !open);
        freedomTrigger.classList.toggle('is-open', !open);
        freedomTrigger.setAttribute('aria-expanded', String(!open));
      });
    }
    backdrop.addEventListener('click', closeDrawer);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawer(); });

    // ══════ INTRO OVERLAY ══════
    (function() {
      var overlay = document.getElementById('intro-overlay');
      if (!overlay) return;
      var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReduced) { overlay.style.display = 'none'; return; }
      var done = false;
      var CYCLE = 3000; // ms, must match animation-duration in CSS

      function exitIntro() {
        if (done) return;
        done = true;
        overlay.style.pointerEvents = 'none';

        // Phase 1: fade only the pink background over 0.5s
        // The word animations keep running, floating over the revealed hero page
        var bg = overlay.querySelector('.intro-bg');
        bg.style.transition = 'opacity 0.5s cubic-bezier(0.4,0,0.2,1)';
        bg.style.opacity = '0';

        // Phase 2: once bg is gone, fade out the remaining text
        setTimeout(function() {
          overlay.style.transition = 'opacity 0.3s ease';
          overlay.style.opacity = '0';
          setTimeout(function() { overlay.style.display = 'none'; }, 320);
        }, 550);
      }

      overlay.addEventListener('click', exitIntro);
      // Start CSS animations and the exit timer in the same frame so they stay in sync
      requestAnimationFrame(function() {
        overlay.classList.add('is-playing');
        setTimeout(exitIntro, CYCLE + 200);
      });
    }());

    // ══════ INIT ══════
    initReveal();
    initCounters();

    // ══════ CHRISTINE VIDEO CAROUSEL ══════
    (function() {
      var root = document.getElementById('christine-carousel');
      if (!root) return;
      var slides   = Array.prototype.slice.call(root.querySelectorAll('.video-slide'));
      var videos   = slides.map(function(s) { return s.querySelector('video'); });
      var prevBtn  = root.querySelector('.video-arrow.prev');
      var nextBtn  = root.querySelector('.video-arrow.next');
      var muteBtn  = root.querySelector('.video-mute');
      var dotsWrap = root.querySelector('.video-dots');
      if (!slides.length) return;

      var current = 0;
      var muted   = true;

      // Build dots
      slides.forEach(function(_, i) {
        var b = document.createElement('button');
        b.className = 'video-dot' + (i === 0 ? ' is-active' : '');
        b.setAttribute('aria-label', 'Show video ' + (i + 1));
        b.addEventListener('click', function() { goTo(i); });
        dotsWrap.appendChild(b);
      });
      var dots = Array.prototype.slice.call(dotsWrap.children);

      var volumeOnSVG  = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>';
      var volumeOffSVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>';

      function applyMute() {
        videos.forEach(function(v, i) {
          v.muted = muted ? true : (i !== current);
        });
        muteBtn.innerHTML = muted ? volumeOffSVG : volumeOnSVG;
        muteBtn.setAttribute('aria-label', muted ? 'Unmute video' : 'Mute video');
        muteBtn.setAttribute('data-muted', muted ? 'true' : 'false');
      }

      function render() {
        var n = slides.length;
        var prevIdx = (current - 1 + n) % n;
        var nextIdx = (current + 1) % n;
        slides.forEach(function(slide, i) {
          slide.classList.remove('is-active', 'is-prev', 'is-next');
          if (i === current) slide.classList.add('is-active');
          else if (i === prevIdx) slide.classList.add('is-prev');
          else if (i === nextIdx) slide.classList.add('is-next');
        });
        dots.forEach(function(d, i) {
          d.classList.toggle('is-active', i === current);
        });
        videos.forEach(function(v, i) {
          if (i === current) {
            try { v.currentTime = 0; } catch (e) {}
            var p = v.play();
            if (p && typeof p.catch === 'function') p.catch(function() {});
          } else {
            try { v.pause(); } catch (e) {}
            try { v.currentTime = 0; } catch (e) {}
          }
        });
      }

      function goTo(i) {
        var n = slides.length;
        var next = ((i % n) + n) % n;
        if (next === current) return;
        current = next;
        render();
        applyMute();
      }

      prevBtn.addEventListener('click', function() { goTo(current - 1); });
      nextBtn.addEventListener('click', function() { goTo(current + 1); });
      muteBtn.addEventListener('click', function() { muted = !muted; applyMute(); });

      // Swipe (mobile)
      var touchX = null;
      root.addEventListener('touchstart', function(e) {
        touchX = e.touches[0].clientX;
      }, { passive: true });
      root.addEventListener('touchend', function(e) {
        if (touchX == null) return;
        var dx = e.changedTouches[0].clientX - touchX;
        if (Math.abs(dx) > 40) goTo(current + (dx < 0 ? 1 : -1));
        touchX = null;
      }, { passive: true });

      // Kick off
      applyMute();
      render();
    })();


    // ══════════════════════════════════════════════════════
    // FREEDOMIND MOTION SYSTEM, Lenis smooth scroll + GSAP ScrollTrigger
    // Phase 1: smooth scroll, opt-in reveals, parallax, giant-text scale.
    // Enable by adding: data-fm-reveal / data-fm-reveal-word /
    // data-fm-parallax="0.3" / data-fm-scale-text to any element.
    // ══════════════════════════════════════════════════════
    (function initFreedomindMotion() {
      var ready = function() {
        if (!window.Lenis || !window.gsap || !window.ScrollTrigger) {
          // Graceful fallback, reveal everything so no element stays hidden.
          document.documentElement.classList.add('fm-no-js');
          return;
        }

        gsap.registerPlugin(ScrollTrigger);

        //,Lenis smooth scroll, luxury easing, ~1.1s of glide
        var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        var lenis = new Lenis({
          duration: 1.1,
          easing: function(t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
          smoothWheel: !prefersReduced,
          smoothTouch: false, // keep native feel on mobile
        });
        if (prefersReduced) lenis.destroy();
        window.fmLenis = prefersReduced ? null : lenis;

        // Keep ScrollTrigger in sync with Lenis
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add(function(time) { lenis.raf(time * 1000); });
        gsap.ticker.lagSmoothing(0);

        // Proxy: make ScrollTrigger read Lenis scroll instead of native
        ScrollTrigger.scrollerProxy(document.documentElement, {
          scrollTop: function(value) {
            if (arguments.length) lenis.scrollTo(value, { immediate: true });
            return lenis.animatedScroll || 0;
          },
          getBoundingClientRect: function() {
            return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
          }
        });

        //,Anchor links: route through Lenis so we get the smooth feel.
        document.querySelectorAll('a[href^="#"]').forEach(function(link) {
          link.addEventListener('click', function(e) {
            var href = link.getAttribute('href');
            if (!href || href === '#') return;
            var target = document.querySelector(href);
            if (!target) return;
            e.preventDefault();
            lenis.scrollTo(target, { offset: -80 });
          });
        });

        //,Generic reveals: opacity + rise on enter
        gsap.utils.toArray('[data-fm-reveal]').forEach(function(el) {
          var delay = parseFloat(el.getAttribute('data-fm-delay')) || 0;
          gsap.to(el, {
            opacity: 1,
            y: 0,
            duration: 1.1,
            delay: delay,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: el,
              start: 'top 85%',
              toggleActions: 'play none none none',
            }
          });
        });

        //,Word-by-word reveals. Walks text nodes so inline markup (e.g. <em>) is preserved.
        gsap.utils.toArray('[data-fm-reveal-word]').forEach(function(container) {
          if (!container.querySelector('[data-fm-word]')) {
            var walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
            var textNodes = [];
            while (walker.nextNode()) textNodes.push(walker.currentNode);
            textNodes.forEach(function(tn) {
              var raw = tn.textContent;
              if (!raw || !raw.trim()) return;
              var words = raw.split(/\s+/).filter(Boolean);
              var frag = document.createDocumentFragment();
              // Bake a non-breaking space into each word to guarantee spacing,
              // since text-node whitespace between inline-block siblings can be
              // eaten by the DOM during fragment insertion next to other elements.
              words.forEach(function(w) {
                var span = document.createElement('span');
                span.setAttribute('data-fm-word', '');
                span.textContent = w + '\u00A0';
                frag.appendChild(span);
              });
              tn.parentNode.replaceChild(frag, tn);
            });
          }
          var wordEls = container.querySelectorAll('[data-fm-word]');
          if (!wordEls.length) return;
          gsap.to(wordEls, {
            opacity: 1,
            y: 0,
            duration: 1.0,
            ease: 'power3.out',
            stagger: 0.08,
            scrollTrigger: {
              trigger: container,
              start: 'top 85%',
              toggleActions: 'play none none none',
            }
          });
        });

        //,Parallax: data-fm-parallax="0.3" means element drifts at 30% of scroll speed
        gsap.utils.toArray('[data-fm-parallax]').forEach(function(el) {
          var speed = parseFloat(el.getAttribute('data-fm-parallax')) || 0.2;
          gsap.to(el, {
            yPercent: -speed * 100,
            ease: 'none',
            scrollTrigger: {
              trigger: el,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true,
            }
          });
        });

        //,Giant-text scroll-scale (Coach "DISCOVER OUR LATEST COLLECTION" moment)
        gsap.utils.toArray('[data-fm-scale-text]').forEach(function(el) {
          var from = parseFloat(el.getAttribute('data-fm-scale-from')) || 0.7;
          var to   = parseFloat(el.getAttribute('data-fm-scale-to'))   || 1.35;
          gsap.fromTo(el,
            { scale: from, opacity: 0.55 },
            {
              scale: to,
              opacity: 1,
              ease: 'none',
              scrollTrigger: {
                trigger: el,
                start: 'top 85%',
                end: 'bottom 20%',
                scrub: 0.8,
              }
            }
          );
        });

        // ─────────────────────────────────────────────────────────────
        // CINEMA HERO TIMELINE, pinned 4-stage scrollytelling.
        // Wings orbit center → left → right → center while M drops away.
        // Palette journey: bordeaux → deep red → pink-cream → bordeaux.
        // ─────────────────────────────────────────────────────────────
        (function buildCinemaHero() {
          var hero = document.getElementById('fm-cinema-hero');
          if (!hero) return;

          // Skip on mobile, CSS already gives a static fallback.
          if (window.matchMedia('(max-width: 900px)').matches) return;

          var stage     = hero.querySelector('.fm-cinema-stage');
          var logo      = document.getElementById('fm-logo');
          var letterM   = document.getElementById('fm-letter-m');
          var panels    = [0,1,2,3].map(function(i){ return document.getElementById('fm-panel-'+i); });
          var stageItems = document.querySelectorAll('#fm-stage-rail .fm-stage-item');
          var scrollCue = document.getElementById('fm-scroll-cue');

          // Per-stage palette, wing fills + indicator copy. Mesh handled by class toggles.
          var palette = [
            { wingL: '#f995b3', wingR: '#e61e2e', vP: '#f995b3', vR: '#e61e2e', tag: 'Welcome',     stageNum: '01' },
            { wingL: '#e61e2e', wingR: '#7a1525', vP: '#c8193a', vR: '#5b0c17', tag: 'Inner self',  stageNum: '02' },
            { wingL: '#fdf6f0', wingR: '#f995b3', vP: '#eda8bc', vR: '#e61e2e', tag: 'Daily flow',  stageNum: '03' },
            { wingL: '#f995b3', wingR: '#e61e2e', vP: '#f995b3', vR: '#e61e2e', tag: 'Take flight', stageNum: '04' }
          ];
          var meshLayers = stage.querySelectorAll('.fm-mesh');

          // Initial state, xPercent/yPercent handles the -50% centering since GSAP
          // owns the transform string after this point.
          gsap.set(letterM,   { y: 0, opacity: 1 });
          gsap.set(logo,      { xPercent: -50, yPercent: -50, x: 0, y: -150, rotation: 0, scale: 0.62 });
          gsap.set(panels[0], { opacity: 1 });
          gsap.set([panels[1], panels[2], panels[3]], { opacity: 0 });

          var heroTrust = stage.querySelector('.hero-welcome');
          function tintTo(idx) {
            meshLayers.forEach(function(m, i) { m.classList.toggle('is-on', i === idx); });
            stageItems.forEach(function(it, i) { it.classList.toggle('is-active', i === idx); });
            document.body.classList.remove('fm-stage-0','fm-stage-1','fm-stage-2','fm-stage-3');
            document.body.classList.add('fm-stage-' + idx);
            panels.forEach(function(panel, i) {
              panel.classList.toggle('is-active', i === idx);
            });
            if (heroTrust) heroTrust.classList.toggle('is-hidden', idx !== 0);
          }

          // Master scrub timeline — drives panel crossfades and stage tint with scroll.
          var lastStage = -1;
          var pinTL = gsap.timeline({
            scrollTrigger: {
              trigger: hero,
              start: 'top top',
              end: 'bottom bottom',
              scrub: 0.3,
              onUpdate: function(self) {
                var p = self.progress;
                var newStage = p < 0.28 ? 0 : p < 0.55 ? 1 : p < 0.80 ? 2 : 3;
                if (newStage !== lastStage) {
                  lastStage = newStage;
                  tintTo(newStage);
                }
                if (scrollCue) {
                  scrollCue.classList.toggle('is-hidden', p > 0.02);
                }
              }
            }
          });

          // Panel crossfades — sharp opacity flips at stage boundaries
          pinTL.to(panels[0], { opacity: 0, duration: 0.06, ease: 'none' }, 0.22);
          pinTL.fromTo(panels[1], { opacity: 0 }, { opacity: 1, duration: 0.06, ease: 'none' }, 0.28);
          pinTL.to(panels[1], { opacity: 0, duration: 0.06, ease: 'none' }, 0.49);
          pinTL.fromTo(panels[2], { opacity: 0 }, { opacity: 1, duration: 0.06, ease: 'none' }, 0.55);
          pinTL.to(panels[2], { opacity: 0, duration: 0.06, ease: 'none' }, 0.74);
          pinTL.fromTo(panels[3], { opacity: 0 }, { opacity: 1, duration: 0.06, ease: 'none' }, 0.80);
          pinTL.to({}, { duration: 0.001 }, 1);

          // Reset hero to stage 0 when returning to home via SPA navigation
          window.addEventListener('fm-page-changed', function(e) {
            if (e.detail && e.detail.page === 'home') {
              lastStage = -1;
              tintTo(0);
              pinTL.progress(0);
            }
          });

          // ── 3D LOGO: Three.js extruded mesh ──────────────────────────
          // Canvas is full-stage so the mesh can orbit without being clipped by a small wrapper.
          // Three.js is lazy-loaded (see index.html) — try now, retry when ready event fires.
          if (typeof THREE !== 'undefined' && THREE.SVGLoader) {
            initLogo3D(hero, stage);
          } else {
            window.addEventListener('fm-three-ready', function() { initLogo3D(hero, stage); }, { once: true });
          }
        })();

        function initLogo3D(hero, stage) {
          if (typeof THREE === 'undefined' || !THREE.SVGLoader) return;

          var canvas = document.getElementById('fm-3d-canvas');
          if (!canvas) return;

          var scene    = new THREE.Scene();
          var camera   = new THREE.PerspectiveCamera(35, 1, 1, 5000);
          // z is recalculated in sizeRenderer so that 1 world unit ≈ 1 CSS pixel at z=0.
          camera.position.set(0, 0, 900);

          var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
          renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
          renderer.outputEncoding = THREE.sRGBEncoding;

          // Near-neutral lighting so the SVG colors read accurately.
          scene.add(new THREE.AmbientLight(0xffffff, 0.85));
          var keyLight = new THREE.DirectionalLight(0xffffff, 0.9);
          keyLight.position.set(6, 10, 9);
          scene.add(keyLight);
          var fillLight = new THREE.DirectionalLight(0xffffff, 0.35);
          fillLight.position.set(-8, -3, 6);
          scene.add(fillLight);

          var group = new THREE.Group();
          scene.add(group);

          function sizeRenderer() {
            var rect = stage.getBoundingClientRect();
            var w = Math.max(2, Math.floor(rect.width));
            var h = Math.max(2, Math.floor(rect.height));
            renderer.setSize(w, h, false);
            camera.aspect = w / h;
            // Auto-calibrate camera distance so the frustum height at z=0 equals the canvas height.
            // This makes 1 Three.js world unit == 1 CSS pixel, so our px-based animation values
            // (x: -420 etc.) translate directly to world coordinates.
            var fovRad = camera.fov * Math.PI / 180;
            camera.position.z = h / (2 * Math.tan(fovRad / 2));
            camera.updateProjectionMatrix();
          }
          sizeRenderer();
          new ResizeObserver(function() { sizeRenderer(); if (window._fmDirty3D) window._fmDirty3D(); }).observe(stage);

          var loader = new THREE.SVGLoader();
          loader.load('brand_assets/freedomind-logo-vector.svg', function(data) {
            var paths = data.paths;
            paths.forEach(function(p) {
              // SVG fills are sRGB; convert to linear so lighting doesn't darken/shift them.
              var color = p.color.clone().convertSRGBToLinear();
              var material = new THREE.MeshStandardMaterial({
                color: color,
                metalness: 0.0,
                roughness: 0.55,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 1
              });
              var shapes = THREE.SVGLoader.createShapes(p);
              shapes.forEach(function(shape) {
                var geom = new THREE.ExtrudeGeometry(shape, {
                  depth: 60,
                  bevelEnabled: true,
                  bevelSegments: 2,
                  bevelSize: 2.5,
                  bevelThickness: 2.5,
                  curveSegments: 8
                });
                geom.computeVertexNormals();
                var mesh = new THREE.Mesh(geom, material);
                group.add(mesh);
              });
            });

            // SVG Y-axis is inverted vs Three.js world Y, origin is top-left.
            // Re-center group on its own bounding box so rotations pivot the middle,
            // then flip Y via negative scale so the logo reads right-side up.
            var bbox = new THREE.Box3().setFromObject(group);
            var size = new THREE.Vector3();
            bbox.getSize(size);
            var center = new THREE.Vector3();
            bbox.getCenter(center);
            group.children.forEach(function(m) {
              m.geometry.translate(-center.x, -center.y, -size.z / 2);
            });

            // Fit: target width ≈ 820 CSS px at rest (scale 1.0), so the existing
            // scale keyframes (0.55 → 1.45) swing the logo between ~450 and ~1190 px.
            var maxDim = Math.max(size.x, size.y);
            var FIT = 820 / maxDim;
            function setScale(s) {
              group.scale.set(FIT * s, -FIT * s, FIT * s);
            }
            setScale(1);

            stage.classList.add('is-3d-ready');

            // Render loop — dirty-flag pattern. Only renders when something changed.
            // Skips ~95% of frames when scroll is idle. Marked dirty by mesh updates + resize.
            var needsRender = true;
            window._fmDirty3D = function() { needsRender = true; };
            (function tick() {
              if (needsRender) { renderer.render(scene, camera); needsRender = false; }
              requestAnimationFrame(tick);
            })();

            // ── Full mesh timeline: position + scale + rotation in world space ──
            // Same beats as the previous div-level animation, now rendered in true 3D.
            var TWO_PI = Math.PI * 2;
            // Scale is applied via a proxy object so one tween updates x/y/z together
            // (keeping the Y-flip sign). group.userData.s tracks the unitless scale factor.
            group.userData.s = 1;
            function applyScale() { setScale(group.userData.s); needsRender = true; }

            var meshTL = gsap.timeline({
              scrollTrigger: {
                trigger: hero,
                start: 'top top',
                end: 'bottom bottom',
                scrub: 0.3,
                onUpdate: function() { needsRender = true; }
              }
            });

            // 0 → 0.28 : intro drift left + first Y revolution
            meshTL.fromTo(group.position,
              { x: 0, y: 150, z: 0 },
              { x: -420, y: 0, ease: 'power3.inOut', duration: 0.28 }, 0);
            meshTL.fromTo(group.userData, { s: 0.55 },
              { s: 1.1, ease: 'power3.inOut', duration: 0.28, onUpdate: applyScale }, 0);
            meshTL.fromTo(group.rotation, { x: 0, y: 0 },
              { y: -TWO_PI, ease: 'power3.inOut', duration: 0.28 }, 0);

            // 0.28 → 0.55 : left → right sweep + second revolution
            meshTL.to(group.position,   { x: 420, y: 0, ease: 'power3.inOut', duration: 0.27 }, 0.28);
            meshTL.to(group.userData,   { s: 1.15, ease: 'power3.inOut', duration: 0.27, onUpdate: applyScale }, 0.28);
            meshTL.to(group.rotation,   { y: -TWO_PI * 2, ease: 'power3.inOut', duration: 0.27 }, 0.28);

            // 0.55 → 0.72 : climax, big push to center + barrel roll + third revolution
            meshTL.to(group.position, { x: 0, ease: 'power3.inOut', duration: 0.17 }, 0.55);
            meshTL.to(group.userData, { s: 1.45, ease: 'power3.inOut', duration: 0.17, onUpdate: applyScale }, 0.55);
            meshTL.to(group.rotation, { x: -TWO_PI, y: -TWO_PI * 3, ease: 'power3.inOut', duration: 0.17 }, 0.55);

            // 0.72 → 0.80 : quick settle back to a smaller size before the final stage
            meshTL.to(group.userData, { s: 0.6, ease: 'power2.out', duration: 0.08, onUpdate: applyScale }, 0.72);

            // Stage 4 (0.80 → 1.00): scale up dramatically as the viewer scrolls, then fade to reveal the next section.
            group.userData.opacity = 1;
            function applyOpacity() {
              group.traverse(function(n) { if (n.material) n.material.opacity = group.userData.opacity; });
            }

            // 0.80 → 1.00 : grow big
            meshTL.to(group.userData, { s: 2.4, ease: 'power2.in', duration: 0.20, onUpdate: applyScale }, 0.80);
            meshTL.to(group.rotation, { y: -TWO_PI * 3 - 0.25, ease: 'power2.out', duration: 0.20 }, 0.80);
            // 0.88 → 1.00 : fade away while it's still growing
            meshTL.to(group.userData, { opacity: 0, ease: 'power2.in', duration: 0.12, onUpdate: applyOpacity }, 0.88);

            meshTL.to({}, { duration: 0.001 }, 1);

            // Reset 3D logo timeline when returning to home via SPA navigation
            window.addEventListener('fm-page-changed', function(e) {
              if (e.detail && e.detail.page === 'home') {
                meshTL.progress(0);
                group.userData.opacity = 1;
                applyOpacity();
                group.userData.s = 0.55;
                applyScale();
                group.position.set(0, 150, 0);
                group.rotation.set(0, 0, 0);
                setTimeout(sizeRenderer, 60);
              }
            });
          }, undefined, function(err) {
            console.warn('3D logo SVG failed to load, keeping PNG fallback', err);
          });
        }

        // Refresh ScrollTrigger after any SPA page change so new sections get hooks.
        window.addEventListener('fm-page-changed', function() {
          ScrollTrigger.refresh();
        });
      };

      // Wait for Lenis + GSAP CDN scripts (they're deferred)
      if (document.readyState === 'complete') {
        ready();
      } else {
        window.addEventListener('load', ready, { once: true });
      }
    })();

    // ══════ CONTACT FORM (FormSubmit AJAX) ══════
    (function initContactForm() {
      const form = document.getElementById('contact-form');
      if (!form) return;
      const status = document.getElementById('contact-status');
      const submitLabel = form.querySelector('.contact-submit-label');
      const honey = form.querySelector('input[name="_honey"]');

      function setStatus(kind, message) {
        status.classList.remove('is-success', 'is-error');
        if (kind) status.classList.add('is-' + kind);
        status.textContent = message;
      }

      form.addEventListener('submit', async function(e) {
        e.preventDefault();
        if (honey && honey.value) return;
        if (!form.reportValidity()) return;

        form.classList.add('is-sending');
        setStatus(null, '');
        if (submitLabel) submitLabel.textContent = 'Sending…';

        const payload = Object.fromEntries(new FormData(form).entries());

        try {
          const res = await fetch(form.action, {
            method: 'POST',
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          const data = await res.json().catch(() => ({}));
          const ok = res.ok && (data.success === true || data.success === 'true');

          form.classList.remove('is-sending');
          if (ok) {
            form.classList.add('is-sent');
            setStatus('success', "Thank you — your message has been sent. Christine will be in touch shortly.");
          } else {
            if (submitLabel) submitLabel.textContent = 'Submit Form';
            setStatus('error', (data && data.message) || 'Something went wrong. Please try again or email info.christineborg@gmail.com directly.');
          }
        } catch (err) {
          form.classList.remove('is-sending');
          if (submitLabel) submitLabel.textContent = 'Submit Form';
          setStatus('error', 'Network error. Please try again or email info.christineborg@gmail.com directly.');
        }
      });
    })();
