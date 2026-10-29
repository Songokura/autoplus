/* AUTO+ Атырау - скрипт лэндинга */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var narrowMQ = window.matchMedia('(max-width: 860px)');
  /* порог бургера и оверлея меню - одно число с CSS (--nav-break в styles.css) */
  var NAV_BREAK = 1240;

  /* ---------- i18n: русский в разметке, казахский - только из assets/lang/kk.js ---------- */
  var ASSET_V = ((document.currentScript && document.currentScript.src.match(/[?&]v=([^&]+)/)) || [])[1] || '';
  var I18N = { ru: null, kk: null };
  var RU = {};        /* снимок русских строк из разметки, чтобы вернуться обратно */
  var curLang = 'ru';

  function snapshotRu() {
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var k = el.getAttribute('data-i18n');
      if (!(k in RU)) RU[k] = el.textContent;
    });
    document.querySelectorAll('[data-i18n-ph]').forEach(function (el) {
      var k = el.getAttribute('data-i18n-ph');
      if (!(k in RU)) RU[k] = el.getAttribute('placeholder') || '';
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
      var k = el.getAttribute('data-i18n-aria');
      if (!(k in RU)) RU[k] = el.getAttribute('aria-label') || '';
    });
    document.querySelectorAll('[data-i18n-alt]').forEach(function (el) {
      var k = el.getAttribute('data-i18n-alt');
      if (!(k in RU)) RU[k] = el.getAttribute('alt') || '';
    });
    RU['meta.title'] = document.title;
    var d = document.querySelector('meta[name="description"]');
    RU['meta.description'] = d ? d.getAttribute('content') : '';
    RU['hdr.close'] = 'Закрыть меню';
    RU['hdr.open'] = 'Открыть меню';
    RU['form.msg'] = 'Здравствуйте! Хочу записаться: ';
    RU['form.msg_car'] = 'Авто: ';
    RU['form.msg_name'] = 'Имя: ';
    RU['form.msg_phone'] = 'Телефон: ';
    I18N.ru = RU;
  }

  function t(key) {
    var dict = I18N[curLang] || RU;
    return (dict && key in dict) ? dict[key] : (key in RU ? RU[key] : '');
  }

  function loadLang(lang, done) {
    if (I18N[lang] || lang !== 'kk') return done();
    var s = document.createElement('script');
    s.src = 'assets/lang/kk.js' + (ASSET_V ? '?v=' + ASSET_V : '');
    s.onload = function () { if (window.SITE_KK) I18N.kk = window.SITE_KK; done(); };
    s.onerror = function () { done(); };
    document.head.appendChild(s);
  }

  function applyLang(lang) {
    if (lang === 'kk' && !I18N.kk) lang = 'ru';
    curLang = lang;
    var dict = I18N[lang];
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var k = el.getAttribute('data-i18n');
      if (k in dict) el.textContent = dict[k];
    });
    document.querySelectorAll('[data-i18n-ph]').forEach(function (el) {
      var k = el.getAttribute('data-i18n-ph');
      if (k in dict) el.setAttribute('placeholder', dict[k]);
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
      var k = el.getAttribute('data-i18n-aria');
      if (k in dict) el.setAttribute('aria-label', dict[k]);
    });
    document.querySelectorAll('[data-i18n-alt]').forEach(function (el) {
      var k = el.getAttribute('data-i18n-alt');
      if (k in dict) el.setAttribute('alt', dict[k]);
    });
    document.documentElement.setAttribute('lang', lang);
    if (dict['meta.title']) document.title = dict['meta.title'];
    var d = document.querySelector('meta[name="description"]');
    if (d && dict['meta.description']) d.setAttribute('content', dict['meta.description']);
    document.querySelectorAll('.lang-btn').forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-lang') === lang ? 'true' : 'false');
    });
    try { localStorage.setItem('autoplus-lang', lang); } catch (e) {}
    if (burger) burger.setAttribute('aria-label', t(menu && !menu.hidden ? 'hdr.close' : 'hdr.open'));
    updateLane();
  }

  function setLang(lang) { loadLang(lang, function () { applyLang(lang); }); }

  /* ---------- меню ---------- */
  var burger = document.querySelector('.burger');
  var menu = document.getElementById('menu');
  function closeMenu() {
    if (!menu || menu.hidden) return;
    menu.hidden = true;
    document.body.classList.remove('menu-open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', t('hdr.open'));
  }
  function openMenu() {
    menu.hidden = false;
    document.body.classList.add('menu-open');
    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', t('hdr.close'));
  }
  if (burger && menu) {
    burger.addEventListener('click', function () { if (menu.hidden) openMenu(); else closeMenu(); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) closeMenu(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
  }

  /* пересчёт - только при смене ширины (iOS шлёт resize при сворачивании адресной строки) */
  var lastW = window.innerWidth;
  window.addEventListener('resize', function () {
    if (window.innerWidth === lastW) return;
    lastW = window.innerWidth;
    if (lastW > NAV_BREAK) closeMenu();
    updateLane();
  });

  /* ---------- язык: ?lang= главнее сохранённого выбора ---------- */
  snapshotRu();
  document.querySelectorAll('.lang-btn').forEach(function (b) {
    b.addEventListener('click', function () { setLang(b.getAttribute('data-lang')); });
  });
  (function initLang() {
    var forced = (location.search.match(/[?&]lang=(ru|kk)/) || [])[1];
    var saved = null;
    try { saved = localStorage.getItem('autoplus-lang'); } catch (e) {}
    var lang = forced || saved || 'ru';
    if (lang === 'kk') setLang('kk');
  })();

  /* ---------- сотовый свет: сетка шестигранников над кадром ---------- */
  var SVG_NS = 'http://www.w3.org/2000/svg';
  function buildHex(box, opts) {
    var w = box.clientWidth, h = box.clientHeight;
    if (!w || !h) return null;
    var cols = opts.cols || 7;
    var r = w / (cols * Math.sqrt(3));          /* радиус описанной окружности */
    var dx = r * Math.sqrt(3), dy = r * 1.5;
    var svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('class', 'hexgrid');
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('aria-hidden', 'true');
    var cx0 = opts.ox * w, cy0 = opts.oy * h;
    var maxDist = 0, cells = [];
    for (var row = -1; row * dy < h + r; row++) {
      var off = (row % 2) ? dx / 2 : 0;
      for (var col = -1; col * dx < w + dx; col++) {
        var cx = col * dx + off, cy = row * dy;
        var pts = [];
        for (var k = 0; k < 6; k++) {
          var a = Math.PI / 180 * (60 * k - 30);
          pts.push((cx + r * 1.01 * Math.cos(a)).toFixed(1) + ',' + (cy + r * 1.01 * Math.sin(a)).toFixed(1));
        }
        var p = document.createElementNS(SVG_NS, 'polygon');
        p.setAttribute('points', pts.join(' '));
        var d = Math.hypot(cx - cx0, cy - cy0);
        if (d > maxDist) maxDist = d;
        cells.push({ el: p, d: d });
        svg.appendChild(p);
      }
    }
    cells.forEach(function (c) {
      var tt = c.d / maxDist;                       /* 0..1 от очага света */
      var delay = Math.round(tt * opts.spread + (Math.random() * 60));
      c.el.style.setProperty('--d', delay + 'ms');
      if (Math.random() < 0.45) c.el.classList.add('flash');
    });
    return svg;
  }

  function light(box) {
    box.classList.add('is-lit');
    var total = (parseInt(box.dataset.spread || 900, 10)) + 1200;
    setTimeout(function () { box.classList.add('is-done'); }, total);
  }

  /* интро пропускается при переходе по якорю, хэше в адресе или если страница уже проскроллена */
  var skipIntro = !!location.hash || window.scrollY > 80;
  var boxes = document.querySelectorAll('.hex-reveal');
  if (reduceMotion) {
    boxes.forEach(function (b) { b.classList.add('is-lit', 'is-done'); });
  } else {
    var io = ('IntersectionObserver' in window) ? new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { io.unobserve(en.target); light(en.target); }
      });
    }, { threshold: 0.35 }) : null;

    var narrow = narrowMQ.matches;
    boxes.forEach(function (box) {
      var intro = box.dataset.hex === 'intro';
      if (intro && skipIntro) { box.classList.add('is-lit', 'is-done'); return; }
      var spread = intro ? 1200 : 700;
      box.dataset.spread = spread;
      var svg = buildHex(box, {
        cols: intro ? (narrow ? 6 : 8) : 6,
        ox: intro ? (narrow ? 0.5 : 0.4) : 0.5,
        oy: intro ? (narrow ? 0.18 : 0.2) : 0.45,
        spread: spread
      });
      if (!svg) { box.classList.add('is-lit', 'is-done'); return; }
      box.appendChild(svg);
      if (intro) {
        setTimeout(function () { light(box); }, 350);
      } else if (io) {
        io.observe(box);
      } else {
        light(box);
      }
    });
  }

  /* ---------- тихое проявление кадров ---------- */
  var rvs = document.querySelectorAll('.rv');
  if (!reduceMotion && !skipIntro && 'IntersectionObserver' in window) {
    var rio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.remove('rv-pre');
          en.target.classList.add('is-in');
          rio.unobserve(en.target);
        }
      });
    }, { threshold: 0.2, rootMargin: '0px 0px -5% 0px' });
    rvs.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.9) return;   /* то, что уже на экране, не прячем */
      el.classList.add('rv-pre');
      rio.observe(el);
    });
  }

  /* ---------- немые петли: грузим и играем только в зоне видимости ---------- */
  var vids = document.querySelectorAll('video[data-src]');
  if (!reduceMotion && 'IntersectionObserver' in window) {
    var vio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var v = en.target;
        if (en.isIntersecting) {
          if (!v.getAttribute('src')) { v.src = v.dataset.src; v.load(); }
          var p = v.play();
          if (p && p.then) p.then(function () { v.classList.add('is-playing'); }).catch(function () {});
        } else if (!v.paused) {
          v.pause();
        }
      });
    }, { rootMargin: '160px 0px' });
    vids.forEach(function (v) { vio.observe(v); });
  }

  /* ---------- лента мастеров: стрелки, шаг в одну карточку ---------- */
  var lane = document.querySelector('.team-lane');
  var laneBtns = document.querySelectorAll('.lane-btn');
  function laneStep() {
    var fig = lane.querySelector('figure');
    if (!fig) return 200;
    var gap = parseFloat(getComputedStyle(lane).columnGap || getComputedStyle(lane).gap) || 0;
    return fig.getBoundingClientRect().width + gap;
  }
  function updateLane() {
    if (!lane || !laneBtns.length) return;
    var max = lane.scrollWidth - lane.clientWidth;
    var fits = max <= 1;
    laneBtns.forEach(function (b) {
      b.hidden = fits;
      var dir = parseInt(b.getAttribute('data-dir'), 10);
      b.disabled = dir < 0 ? lane.scrollLeft <= 1 : lane.scrollLeft >= max - 1;
    });
  }
  if (lane && laneBtns.length) {
    laneBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        var dir = parseInt(b.getAttribute('data-dir'), 10);
        lane.scrollBy({ left: dir * laneStep(), behavior: reduceMotion ? 'auto' : 'smooth' });
      });
    });
    var laneTick = false;
    lane.addEventListener('scroll', function () {
      if (laneTick) return;
      laneTick = true;
      requestAnimationFrame(function () { laneTick = false; updateLane(); });
    }, { passive: true });
    updateLane();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(updateLane);
    window.addEventListener('load', updateLane);
  }

  /* ---------- липкая панель: после ~55% первого экрана, прячется на форме ---------- */
  var hero = document.getElementById('hero');
  var zayavka = document.getElementById('zayavka');
  var heroPassed = false, formSeen = false;
  function syncSticky() {
    document.body.classList.toggle('sticky-on', heroPassed && !formSeen);
  }
  if ('IntersectionObserver' in window && hero) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { heroPassed = en.intersectionRatio < 0.45; syncSticky(); });
    }, { threshold: [0, 0.45, 1] }).observe(hero);
    if (zayavka) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { formSeen = en.isIntersecting; syncSticky(); });
      }, { threshold: 0.25 }).observe(zayavka);
    }
  } else {
    heroPassed = true; syncSticky();
  }

  /* ---------- форма -> WhatsApp ---------- */
  var form = document.getElementById('lead-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var f = form.elements;
      if (f.website && f.website.value) return;      /* ловушка для ботов */
      var phone = (f.phone.value || '').trim();
      if (phone.replace(/\D/g, '').length < 10) {
        f.phone.focus();
        f.phone.setAttribute('aria-invalid', 'true');
        return;
      }
      f.phone.removeAttribute('aria-invalid');
      var sel = f.service;
      var serviceText = sel.options[sel.selectedIndex] ? sel.options[sel.selectedIndex].textContent : sel.value;
      var lines = [t('form.msg') + serviceText];
      if (f.car.value.trim()) lines.push(t('form.msg_car') + f.car.value.trim());
      if (f.name.value.trim()) lines.push(t('form.msg_name') + f.name.value.trim());
      lines.push(t('form.msg_phone') + phone);
      var url = 'https://wa.me/77011189228?text=' + encodeURIComponent(lines.join('\n'));
      window.open(url, '_blank', 'noopener');
      var ok = form.querySelector('.form-ok');
      if (ok) { ok.hidden = false; }
    });
  }

  /* ---------- якоря: шапка липкая, цель не должна уходить под неё ---------- */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href').slice(1);
    if (!id) return;
    var target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    var hdr = document.querySelector('.hdr');
    var top = target.getBoundingClientRect().top + window.pageYOffset - (hdr ? hdr.offsetHeight : 0) - 8;
    window.scrollTo({ top: top, behavior: reduceMotion ? 'auto' : 'smooth' });
    history.replaceState(null, '', '#' + id);
  });
})();
