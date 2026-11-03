/* AUTO+ Атырау - скрипт лэндинга: i18n, меню, плиты с маской-маркировкой, форма */
(function () {
  'use strict';

  var root = document.documentElement;
  var RED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var NAV_BREAK = 1100;               /* порог бургера и оверлея меню - одно число с styles.css */
  var MOBILE = window.matchMedia('(max-width: 760px)');
  var HAS_IO = 'IntersectionObserver' in window;
  var WA = 'https://wa.me/77011189228?text=';

  function clamp(v) { return v < 0 ? 0 : (v > 1 ? 1 : v); }
  function easeInOut(t) { return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

  /* ---------- i18n: русский в разметке, казахский - только из assets/lang/kk.js ---------- */
  var ASSET_V = ((document.currentScript && document.currentScript.src.match(/[?&]v=([^&]+)/)) || [])[1] || '';
  var I18N = { ru: null, kk: null };
  var RU = {};
  var curLang = 'ru';

  function snapshotRu() {
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var k = el.getAttribute('data-i18n');
      if (!(k in RU)) RU[k] = el.textContent;
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
      var k = el.getAttribute('data-i18n-aria');
      if (!(k in RU)) RU[k] = el.getAttribute('aria-label') || '';
    });
    RU['meta.title'] = document.title;
    var d = document.querySelector('meta[name="description"]');
    RU['meta.description'] = d ? d.getAttribute('content') : '';
    RU['hdr.close'] = 'Закрыть меню';
    RU['hdr.open'] = 'Открыть меню';
    RU['wa.card'] = 'Здравствуйте! Нужна стоимость: ';
    RU['wa.hero'] = 'Здравствуйте! Нужно коммерческое предложение для организации.';
    RU['wa.biz'] = 'Здравствуйте! Нужны условия обслуживания автопарка для организации.';
    RU['wa.opt'] = 'Здравствуйте! Нужен оптовый прайс на масла и технические жидкости.';
    RU['wa.sv'] = 'Здравствуйте! Хочу записаться на замену масла.';
    RU['wa.pb'] = 'Здравствуйте! Нужен подбор масла. Автомобиль: ';
    RU['form.org'] = 'Запрос коммерческого предложения от организации';
    RU['form.priv'] = 'Запрос от частного клиента';
    RU['form.need'] = 'Что нужно: ';
    RU['form.name'] = 'Имя: ';
    RU['form.phone'] = 'Телефон: ';
    RU['form.company'] = 'Компания: ';
    RU['form.cars'] = 'Количество автомобилей: ';
    RU['form.comment'] = 'Комментарий: ';
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
  /* ссылки WhatsApp собираются заранее по текущему языку, не в момент клика (трекер LeadBot дописывает код в href при клике) */
  function syncWaLinks() {
    document.querySelectorAll('a[data-wa]').forEach(function (a) {
      var kind = a.getAttribute('data-wa');
      var text;
      if (kind === 'card') text = t('wa.card') + t(a.getAttribute('data-title')) + '.';
      else text = t('wa.' + kind);
      a.setAttribute('href', WA + encodeURIComponent(text));
    });
  }
  function applyLang(lang) {
    if (lang === 'kk' && !I18N.kk) lang = 'ru';
    curLang = lang;
    var dict = I18N[lang];
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var k = el.getAttribute('data-i18n');
      if (k in dict) el.textContent = dict[k];
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
      var k = el.getAttribute('data-i18n-aria');
      if (k in dict) el.setAttribute('aria-label', dict[k]);
    });
    root.setAttribute('lang', lang);
    if (dict['meta.title']) document.title = dict['meta.title'];
    var d = document.querySelector('meta[name="description"]');
    if (d && dict['meta.description']) d.setAttribute('content', dict['meta.description']);
    document.querySelectorAll('.lang-btn').forEach(function (b) {
      var on = b.getAttribute('data-lang') === lang;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    try { localStorage.setItem('autoplus-lang', lang); } catch (e) {}
    if (burger) burger.setAttribute('aria-label', t(document.body.classList.contains('menu-open') ? 'hdr.close' : 'hdr.open'));
    syncWaLinks();
    updateLane();
  }
  function setLang(lang) { loadLang(lang, function () { applyLang(lang); }); }

  /* ---------- шапка и меню ---------- */
  var hdr = document.getElementById('hdr');
  var burger = document.querySelector('.burger');
  var menu = document.getElementById('menu');
  function hdrState() { if (hdr) hdr.classList.toggle('solid', window.scrollY > 24); }
  function closeMenu() {
    if (!menu || !document.body.classList.contains('menu-open')) return;
    document.body.classList.remove('menu-open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', t('hdr.open'));
    setTimeout(function () { if (!document.body.classList.contains('menu-open')) menu.hidden = true; }, 320);
  }
  function openMenu() {
    menu.hidden = false;
    requestAnimationFrame(function () {
      document.body.classList.add('menu-open');
      burger.setAttribute('aria-expanded', 'true');
      burger.setAttribute('aria-label', t('hdr.close'));
    });
  }
  if (burger && menu) {
    burger.addEventListener('click', function () { if (document.body.classList.contains('menu-open')) closeMenu(); else openMenu(); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) closeMenu(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
  }

  snapshotRu();
  syncWaLinks();
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

  /* ---------- маска-маркировка: контуры Inter Tight 800, в единицах шрифта (2048/em), y вниз ----------
     ox/oy - самая внутренняя точка глифа, r - запас до края глифа: через неё кадр раскрывается до полного экрана */
  var GL = {
    '5W-30': {w:7028,h:1490,ox:2355,oy:771,r:212,d:'M652 1510Q489 1510 362 1452Q235 1393 162 1290Q89 1186 86 1052H436Q438 1134 501 1184Q564 1233 652 1233Q720 1233 772 1204Q823 1174 852 1120Q882 1067 882 996Q882 923 852 869Q822 815 770 785Q718 755 650 755Q584 755 527 784Q470 813 440 863L121 803L185 0H1142V291H481L448 642H456Q494 580 576 540Q659 500 764 500Q898 500 1002 562Q1107 624 1168 734Q1229 843 1229 986Q1229 1139 1157 1258Q1085 1376 955 1443Q825 1510 652 1510ZM1735 1490 1301 0H1699L1925 976H1937L2193 0H2519L2774 979H2787L3012 0H3410L2977 1490H2629L2362 587H2350L2083 1490ZM4214 751V1025H3526V751ZM4971 1510Q4801 1510 4670 1452Q4538 1394 4462 1290Q4387 1187 4386 1052H4748Q4749 1101 4778 1138Q4808 1176 4859 1196Q4910 1217 4973 1217Q5037 1217 5086 1194Q5135 1172 5162 1132Q5190 1092 5190 1040Q5190 986 5160 946Q5129 906 5074 883Q5019 860 4943 860H4798V604H4943Q5009 604 5059 582Q5109 560 5138 520Q5166 481 5166 430Q5166 379 5142 342Q5118 304 5075 282Q5032 261 4974 261Q4914 261 4866 282Q4817 304 4789 342Q4761 380 4760 431H4415Q4416 298 4489 196Q4562 95 4688 38Q4814 -20 4975 -20Q5135 -20 5256 36Q5378 92 5446 188Q5513 285 5513 407Q5513 531 5431 613Q5349 695 5220 714V725Q5392 745 5480 837Q5567 929 5567 1067Q5567 1196 5491 1296Q5415 1397 5280 1454Q5146 1510 4971 1510ZM6330 1510Q6132 1510 5992 1419Q5851 1328 5776 1158Q5701 987 5701 746Q5701 505 5776 334Q5851 162 5992 71Q6133 -20 6331 -20Q6529 -20 6670 72Q6811 163 6886 334Q6961 505 6961 746Q6961 987 6886 1158Q6811 1328 6670 1419Q6530 1510 6330 1510ZM6330 1216Q6414 1216 6472 1162Q6530 1107 6560 1002Q6590 897 6590 746Q6590 594 6560 488Q6530 383 6472 328Q6414 272 6330 272Q6205 272 6138 396Q6071 519 6071 746Q6071 897 6100 1002Q6130 1107 6188 1162Q6247 1216 6330 1216Z'},
    '10W-40': {w:8022,h:1490,ox:3297,oy:771,r:212,d:'M764 0V1490H404V336H396L62 541V229L430 0ZM1545 1510Q1347 1510 1206 1419Q1066 1328 991 1158Q916 987 916 746Q916 505 991 334Q1066 162 1207 71Q1348 -20 1546 -20Q1744 -20 1885 72Q2026 163 2101 334Q2176 505 2176 746Q2176 987 2101 1158Q2026 1328 1886 1419Q1745 1510 1545 1510ZM1545 1216Q1629 1216 1687 1162Q1745 1107 1775 1002Q1805 897 1805 746Q1805 594 1775 488Q1745 383 1687 328Q1629 272 1545 272Q1420 272 1353 396Q1286 519 1286 746Q1286 897 1316 1002Q1345 1107 1404 1162Q1462 1216 1545 1216ZM2682 1490 2248 0H2646L2872 976H2884L3140 0H3466L3721 979H3734L3959 0H4357L3924 1490H3576L3309 587H3297L3030 1490ZM5161 751V1025H4473V751ZM5333 1243V962L5944 0H6193V382H6049L5691 948V960H6576V1243ZM6053 1490V1158L6061 1033V0H6397V1490ZM7324 1510Q7126 1510 6986 1419Q6845 1328 6770 1158Q6695 987 6695 746Q6695 505 6770 334Q6845 162 6986 71Q7127 -20 7325 -20Q7523 -20 7664 72Q7805 163 7880 334Q7955 505 7955 746Q7955 987 7880 1158Q7805 1328 7664 1419Q7524 1510 7324 1510ZM7324 1216Q7408 1216 7466 1162Q7524 1107 7554 1002Q7584 897 7584 746Q7584 594 7554 488Q7524 383 7466 328Q7408 272 7324 272Q7199 272 7132 396Q7065 519 7065 746Q7065 897 7094 1002Q7124 1107 7182 1162Q7241 1216 7324 1216Z'},
    '208 L': {w:5476,h:1490,ox:396,oy:1297,r:191,d:'M80 1490V1232L624 756Q685 700 728 654Q771 608 794 561Q816 514 816 458Q816 397 789 353Q762 309 716 285Q669 261 608 261Q546 261 499 286Q452 311 426 358Q401 405 401 473H59Q59 321 128 211Q196 101 320 40Q444 -20 609 -20Q778 -20 903 36Q1028 93 1097 194Q1166 296 1166 431Q1166 516 1132 599Q1097 682 1009 784Q921 885 758 1026L580 1190V1200H1184V1490ZM1947 1510Q1749 1510 1608 1419Q1468 1328 1393 1158Q1318 987 1318 746Q1318 505 1393 334Q1468 162 1609 71Q1750 -20 1948 -20Q2146 -20 2287 72Q2428 163 2503 334Q2578 505 2578 746Q2578 987 2503 1158Q2428 1328 2288 1419Q2147 1510 1947 1510ZM1947 1216Q2031 1216 2089 1162Q2147 1107 2177 1002Q2207 897 2207 746Q2207 594 2177 488Q2147 383 2089 328Q2031 272 1947 272Q1822 272 1755 396Q1688 519 1688 746Q1688 897 1718 1002Q1747 1107 1806 1162Q1864 1216 1947 1216ZM3313 1510Q3139 1510 3004 1454Q2868 1399 2790 1304Q2713 1208 2713 1088Q2713 995 2757 918Q2801 841 2877 789Q2953 737 3047 722V713Q2924 689 2846 597Q2767 505 2767 382Q2767 266 2838 176Q2908 85 3032 32Q3156 -20 3313 -20Q3471 -20 3595 32Q3719 85 3790 176Q3861 267 3861 382Q3861 506 3781 598Q3701 689 3581 713V722Q3673 737 3749 789Q3825 841 3870 918Q3915 995 3915 1088Q3915 1208 3838 1304Q3760 1399 3624 1454Q3488 1510 3313 1510ZM3313 1256Q3380 1256 3430 1230Q3480 1205 3508 1160Q3537 1115 3537 1057Q3537 1000 3508 955Q3479 910 3428 884Q3378 859 3313 859Q3249 859 3198 884Q3148 910 3119 954Q3090 999 3090 1057Q3090 1115 3118 1160Q3147 1204 3198 1230Q3248 1256 3313 1256ZM3313 604Q3370 604 3414 581Q3458 558 3484 516Q3509 475 3509 423Q3509 370 3484 330Q3458 290 3414 268Q3370 245 3313 245Q3256 245 3212 268Q3168 290 3143 330Q3118 370 3118 423Q3118 475 3143 516Q3168 557 3212 580Q3257 604 3313 604ZM4451 1490V0H4810V1197H5431V1490Z'},
    'ATF': {w:3992,h:1490,ox:765,oy:184,r:191,d:'M405 1490H18L522 0H1000L1503 1490H1117L767 375H755ZM355 903H1164V1177H355ZM1558 293V0H2816V293H2364V1490H2010V293ZM2936 1490V0H3953V293H3295V666H3888V952H3295V1490Z'}
  };
  var UPM = 2048, GL_H = 1490;
  function pathToPx(d, s, ox, oy) {
    var out = '', re = /[MLHVQCZ]|-?\d+(?:\.\d+)?/g, m, cmd = 'M', isX = true;
    while ((m = re.exec(d))) {
      var tok = m[0];
      if (/[MLHVQCZ]/.test(tok)) { out += tok; cmd = tok; isX = (tok !== 'V'); }
      else {
        var v = parseFloat(tok);
        out += (isX ? (ox + v * s) : (oy + v * s)).toFixed(1) + ' ';
        if (cmd !== 'H' && cmd !== 'V') isX = !isX;
      }
    }
    return out;
  }

  /* ---------- плиты ---------- */
  var pws = [].slice.call(document.querySelectorAll('.pw'));
  var heroPw = document.getElementById('hero');
  var bar = document.getElementById('bar');
  var zayavka = document.getElementById('zayavka');
  var masks = [];
  /* приглушённая копия кадра под маской: пока надпись закрыта, плита не пустая */
  document.querySelectorAll('.mk[data-mask]').forEach(function (mk) {
    var pic = mk.querySelector('picture');
    if (!pic || mk.parentNode.querySelector('.ph-bg')) return;
    var bg = document.createElement('div');
    bg.className = 'ph-bg';
    bg.setAttribute('aria-hidden', 'true');
    var c = pic.cloneNode(true);
    c.querySelectorAll('img').forEach(function (im) { im.removeAttribute('fetchpriority'); im.setAttribute('alt', ''); im.setAttribute('loading', 'lazy'); });
    bg.appendChild(c);
    mk.parentNode.insertBefore(bg, mk);
  });
  function setupMasks() {
    masks = [];
    document.querySelectorAll('.mk[data-mask]').forEach(function (mk) {
      var g = GL[mk.getAttribute('data-mask')];
      if (!g) return;
      var W = mk.clientWidth, H = mk.clientHeight;
      if (!W || !H) return;
      var frac = MOBILE.matches ? .9 : .66;
      var s = (frac * W) / g.w;
      var left = (W - g.w * s) / 2;
      var top = (H - GL_H * s) / 2 - (MOBILE.matches ? H * .08 : 0);
      var ox = left + g.ox * s, oy = top + g.oy * s;
      var far = 0;
      [[0, 0], [W, 0], [0, H], [W, H]].forEach(function (c) { far = Math.max(far, Math.hypot(c[0] - ox, c[1] - oy)); });
      var kFull = far / (g.r * s) * 1.08;
      var inner = mk.firstElementChild;
      mk.style.clipPath = 'path("' + pathToPx(g.d, s, left, top) + '")';
      mk.style.transformOrigin = inner.style.transformOrigin = ox.toFixed(1) + 'px ' + oy.toFixed(1) + 'px';
      masks.push({ el: mk, inner: inner, kFull: kFull, p: -1, pw: mk.closest('.pw') });
    });
  }
  function setMask(m, p) {
    p = clamp(p);
    if (m.p === p) return;
    m.p = p;
    if (p >= 1) {
      m.el.classList.add('open');
      m.el.style.clipPath = 'none';
      m.el.style.transform = m.inner.style.transform = 'none';
      return;
    }
    if (m.el.classList.contains('open')) { m.el.classList.remove('open'); setupMasks(); return; }
    /* медленный старт (надпись читается), затем ускорение до полного кадра */
    var e = p < .35 ? (p / .35) * .12 : .12 + .88 * Math.pow((p - .35) / .65, 2.2);
    var k = Math.exp(Math.log(m.kFull) * e);
    m.el.style.transform = 'scale(' + k.toFixed(4) + ')';
    m.inner.style.transform = 'scale(' + (1 / k).toFixed(5) + ')';
  }

  var introK = 1, introDone = true;
  var formSeen = false;
  function update() {
    var H = window.innerHeight || root.clientHeight;
    var mob = MOBILE.matches;
    var rects = pws.map(function (pw) { return pw.getBoundingClientRect(); });
    pws.forEach(function (pw, i) {
      var r = rects[i];
      if (r.bottom < -H || r.top > 2 * H) return;        /* вне экрана не считаем */
      var enter = clamp(1 - r.top / H);
      var exit = clamp(1 - r.bottom / H);
      var stay = r.height > H + 1 ? clamp(-r.top / (r.height - H)) : enter;
      pw.style.setProperty('--enter', enter.toFixed(3));
      pw.style.setProperty('--exit', exit.toFixed(3));
      pw.style.setProperty('--stay', stay.toFixed(3));
      pw.classList.toggle('gone', !mob && exit >= 1);
      pw.classList.toggle('on', enter > (mob ? .35 : .58) || (pw === heroPw && (introDone || introK > .55)));
    });
    masks.forEach(function (m) {
      if (m.pw === heroPw) { setMask(m, introDone ? 1 : introK); return; }
      var r = m.pw.getBoundingClientRect();
      if (r.bottom < -H || r.top > 2 * H) return;
      var enter = clamp(1 - r.top / H);
      setMask(m, (enter - (mob ? .12 : .26)) / (mob ? .6 : .62));
    });
    hdrState();
    if (bar) document.body.classList.toggle('sticky-on', window.scrollY > H * .55 && !formSeen);
  }
  var tick = false;
  function onScroll() {
    if (tick) return; tick = true;
    requestAnimationFrame(function () { tick = false; update(); });
  }
  var lastW = window.innerWidth;
  window.addEventListener('resize', function () {
    if (window.innerWidth === lastW) return;              /* iOS шлёт resize при сворачивании адресной строки */
    lastW = window.innerWidth;
    if (lastW > NAV_BREAK) closeMenu();
    masks.forEach(function (m) { m.p = -1; m.el.classList.remove('open'); });
    setupMasks();
    update();
    updateLane();
  });

  var skipIntro = !!location.hash || window.scrollY > 80;
  if (RED) {
    root.classList.add('no-plate', 'no-rv');
    pws.forEach(function (pw) { pw.classList.add('on'); });
    window.addEventListener('scroll', function () {
      hdrState();
      if (bar) document.body.classList.toggle('sticky-on', window.scrollY > window.innerHeight * .55 && !formSeen);
    }, { passive: true });
    hdrState();
  } else {
    setupMasks();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('load', function () { update(); });
    if (skipIntro) {
      update();
    } else {
      introK = 0; introDone = false;
      update();
      var t0 = null;
      var step = function (ts) {
        if (introDone) return;
        if (t0 === null) t0 = ts;
        var p = clamp((ts - t0) / 1700);
        introK = p;
        update();
        if (p < 1) requestAnimationFrame(step); else introDone = true;
      };
      setTimeout(function () { requestAnimationFrame(step); }, 150);
      /* страховка на случай фоновой вкладки: собрать экран по таймеру */
      setTimeout(function () { if (!introDone) { introDone = true; introK = 1; update(); } }, 2600);
    }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(update);
  }

  /* ---------- тихое появление карточек ---------- */
  var rvs = document.querySelectorAll('.rv');
  if (!RED && HAS_IO) {
    var rio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); rio.unobserve(en.target); }
      });
    }, { threshold: .15, rootMargin: '0px 0px -4% 0px' });
    rvs.forEach(function (el) { rio.observe(el); });
  } else {
    root.classList.add('no-rv');
  }

  /* ---------- липкая панель: прячется на форме ---------- */
  if (HAS_IO && zayavka) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { formSeen = en.isIntersecting; });
      if (bar) document.body.classList.toggle('sticky-on', window.scrollY > window.innerHeight * .55 && !formSeen);
    }, { threshold: .2 }).observe(zayavka);
  }

  /* ---------- лента команды: стрелки, шаг в одну карточку ---------- */

  /* галереи магазинов */
  document.querySelectorAll('[data-gal]').forEach(function (g) {
    var t = g.querySelector('.gal-track'), bs = g.querySelectorAll('.gal-btn');
    function upd() {
      var max = t.scrollWidth - t.clientWidth;
      bs.forEach(function (b) {
        b.hidden = max <= 1;
        b.disabled = parseInt(b.getAttribute('data-dir'), 10) < 0 ? t.scrollLeft <= 1 : t.scrollLeft >= max - 1;
      });
    }
    bs.forEach(function (b) {
      b.addEventListener('click', function () {
        t.scrollBy({ left: parseInt(b.getAttribute('data-dir'), 10) * t.clientWidth, behavior: RED ? 'auto' : 'smooth' });
      });
    });
    var tick = false;
    t.addEventListener('scroll', function () {
      if (tick) return; tick = true;
      requestAnimationFrame(function () { tick = false; upd(); });
    }, { passive: true });
    upd(); window.addEventListener('resize', upd);
  });
  var lane = document.querySelector('.lane');
  var laneBtns = document.querySelectorAll('.lane-btn');
  function laneStep() {
    var li = lane.querySelector('li');
    if (!li) return 200;
    var gap = parseFloat(getComputedStyle(lane).columnGap || getComputedStyle(lane).gap) || 0;
    return li.getBoundingClientRect().width + gap;
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
        lane.scrollBy({ left: parseInt(b.getAttribute('data-dir'), 10) * laneStep(), behavior: RED ? 'auto' : 'smooth' });
      });
    });
    var laneTick = false;
    lane.addEventListener('scroll', function () {
      if (laneTick) return; laneTick = true;
      requestAnimationFrame(function () { laneTick = false; updateLane(); });
    }, { passive: true });
    updateLane();
    window.addEventListener('load', updateLane);
  }

  /* ---------- форма -> WhatsApp ---------- */
  var form = document.getElementById('lead-form');
  if (form) {
    var orgRow = form.querySelector('.f-org');
    function syncType() {
      var org = form.elements.ctype.value === 'org';
      if (orgRow) orgRow.hidden = !org;
    }
    form.addEventListener('change', function (e) { if (e.target.name === 'ctype') syncType(); });
    syncType();
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var f = form.elements;
      if (f.website && f.website.value) return;
      var phone = (f.phone.value || '').trim();
      if (phone.replace(/\D/g, '').length < 10) {
        f.phone.focus();
        f.phone.setAttribute('aria-invalid', 'true');
        return;
      }
      f.phone.removeAttribute('aria-invalid');
      var org = f.ctype.value === 'org';
      var sel = f.service;
      var need = sel.options[sel.selectedIndex] ? sel.options[sel.selectedIndex].textContent : sel.value;
      var lines = [t(org ? 'form.org' : 'form.priv'), t('form.need') + need];
      if (f.name.value.trim()) lines.push(t('form.name') + f.name.value.trim());
      lines.push(t('form.phone') + phone);
      if (org && f.company.value.trim()) lines.push(t('form.company') + f.company.value.trim());
      if (org && f.cars.value.trim()) lines.push(t('form.cars') + f.cars.value.trim());
      if (f.comment.value.trim()) lines.push(t('form.comment') + f.comment.value.trim());
      window.open(WA + encodeURIComponent(lines.join('\n')), '_blank', 'noopener');
      var ok = form.querySelector('.form-ok');
      if (ok) ok.hidden = false;
    });
  }

  /* ---------- якоря: цель не уходит под липкую шапку ---------- */
  function hdrH() { return hdr ? hdr.offsetHeight : 0; }
  function scrollToId(id, push) {
    var tg = document.getElementById(id);
    if (!tg) return false;
    var top = tg.getBoundingClientRect().top + window.pageYOffset - (tg.classList.contains('pw') ? 0 : hdrH() - 4);
    window.scrollTo({ top: Math.max(0, top), behavior: RED ? 'auto' : 'smooth' });
    if (push) { try { history.pushState(null, '', '#' + id); } catch (err) {} }
    return true;
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href').slice(1);
    if (!id || !document.getElementById(id)) return;
    e.preventDefault();
    closeMenu();
    scrollToId(id, true);
  });
  window.addEventListener('hashchange', function () {
    var id = location.hash.slice(1);
    if (id) scrollToId(id, false);
  });
  if (location.hash) {
    var id0 = location.hash.slice(1);
    window.addEventListener('load', function () {
      setTimeout(function () { scrollToId(id0, false); update(); }, 60);
      /* повторная сверка после догрузки шрифтов и картинок: цель должна стоять под шапкой */
      setTimeout(function () { if (location.hash.slice(1) === id0) { scrollToId(id0, false); update(); } }, 900);
    });
  }
})();
