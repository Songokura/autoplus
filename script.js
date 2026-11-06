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

  /* ---------- маска-логотип: контур знака AUTO+ из файла клиента (буквы и круг, плюс вырезан), высота 1490 единиц, y вниз ----------
     ox/oy - самая внутренняя точка глифа, r - запас до края глифа: через неё кадр раскрывается до полного экрана */
  var GL = {
    'AUTO+': {w:5623,h:1490,ox:5222,oy:1096,r:247,d:'M2848 56L2848 329L3286 329L3289 332L3289 1416L3588 1418L3597 1409L3597 332L3600 329L4038 329L4040 65L4031 56ZM1485 56L1476 65L1483 72L1476 79L1476 875L1483 880L1483 1009L1490 1014L1490 1051L1497 1056L1497 1079L1504 1084L1504 1100L1511 1105L1511 1121L1518 1126L1518 1142L1525 1147L1525 1156L1532 1161L1532 1170L1539 1175L1539 1184L1546 1190L1546 1198L1560 1211L1560 1219L1574 1232L1574 1240L1646 1313L1655 1313L1674 1334L1683 1334L1696 1348L1704 1348L1710 1355L1718 1355L1724 1362L1732 1362L1738 1369L1747 1369L1752 1376L1761 1376L1766 1383L1782 1383L1787 1390L1796 1390L1801 1397L1817 1397L1822 1404L1845 1404L1850 1411L1873 1411L1878 1418L1908 1418L1913 1425L1957 1425L1963 1432L2049 1432L2054 1439L2133 1439L2138 1432L2217 1432L2223 1425L2267 1425L2272 1418L2302 1418L2307 1411L2330 1411L2335 1404L2358 1404L2363 1397L2379 1397L2384 1390L2400 1390L2405 1383L2414 1383L2419 1376L2435 1376L2441 1369L2449 1369L2455 1362L2463 1362L2469 1355L2477 1355L2490 1341L2499 1341L2511 1327L2520 1327L2539 1306L2548 1306L2613 1240L2613 1232L2627 1219L2627 1211L2641 1198L2641 1190L2648 1184L2648 1175L2655 1170L2655 1161L2662 1156L2662 1147L2669 1142L2669 1126L2676 1121L2676 1105L2683 1100L2683 1084L2690 1079L2690 1056L2697 1051L2697 1014L2704 1009L2704 922L2711 917L2711 86L2704 81L2704 58L2405 56L2397 65L2397 910L2390 915L2390 959L2383 965L2383 995L2376 1000L2376 1016L2369 1021L2369 1030L2362 1035L2362 1044L2354 1049L2354 1058L2347 1063L2347 1072L2302 1118L2293 1118L2281 1132L2272 1132L2267 1139L2251 1139L2246 1146L2237 1146L2231 1153L2202 1153L2196 1160L2145 1160L2140 1167L2040 1167L2035 1160L1984 1160L1978 1153L1956 1153L1950 1146L1935 1146L1929 1139L1920 1139L1915 1132L1906 1132L1894 1118L1885 1118L1833 1065L1833 1056L1826 1051L1826 1042L1819 1037L1819 1028L1812 1023L1812 1000L1805 995L1805 972L1797 966L1797 915L1790 910L1790 65L1782 56ZM395 56L387 65L387 81L380 86L380 109L372 114L372 130L365 135L365 158L358 163L358 179L351 184L351 200L344 206L344 228L337 234L337 257L330 262L330 278L323 283L323 299L316 304L316 327L309 332L309 348L302 353L302 376L295 381L295 397L288 402L288 425L281 430L281 453L274 459L274 474L267 480L267 495L260 501L260 524L253 529L253 545L246 550L246 573L239 578L239 594L232 599L232 622L225 627L225 643L218 648L218 671L211 676L211 692L204 698L204 720L197 726L197 741L190 747L190 770L183 775L183 791L176 796L176 819L169 824L169 840L162 845L162 861L155 866L155 889L148 894L148 910L141 915L141 938L134 944L134 966L127 972L127 987L119 993L119 1009L112 1014L112 1037L105 1042L105 1058L98 1063L98 1086L91 1091L91 1107L84 1112L84 1135L77 1140L77 1156L70 1161L70 1184L63 1190L63 1205L56 1211L56 1233L49 1239L49 1255L42 1260L42 1283L35 1288L35 1304L28 1309L28 1325L21 1330L21 1353L14 1358L14 1374L7 1379L7 1395L0 1399L0 1418L313 1418L315 1400L322 1395L322 1379L329 1374L329 1344L336 1339L336 1323L343 1318L343 1295L350 1290L350 1274L357 1269L357 1246L364 1240L364 1218L371 1212L371 1197L378 1191L378 1168L385 1163L385 1147L392 1142L392 1119L399 1114L399 1091L406 1086L406 1070L413 1065L413 1042L420 1037L420 1021L427 1016L427 993L438 982L980 982L991 993L991 1009L998 1014L998 1030L1005 1035L1005 1058L1012 1063L1012 1079L1019 1084L1019 1107L1026 1112L1026 1135L1033 1140L1033 1156L1040 1161L1040 1184L1047 1190L1047 1212L1054 1218L1054 1233L1061 1239L1061 1255L1068 1260L1068 1283L1075 1288L1075 1311L1082 1316L1082 1332L1089 1337L1089 1360L1096 1365L1096 1388L1103 1393L1103 1409L1112 1418L1416 1418L1418 1400L1411 1395L1411 1372L1404 1367L1404 1351L1397 1346L1397 1323L1390 1318L1390 1302L1383 1297L1383 1274L1376 1269L1376 1253L1369 1248L1369 1232L1362 1226L1362 1204L1355 1198L1355 1183L1348 1177L1348 1154L1341 1149L1341 1133L1334 1128L1334 1105L1327 1100L1327 1084L1320 1079L1320 1056L1313 1051L1313 1035L1306 1030L1306 1007L1298 1002L1298 986L1291 980L1291 965L1284 959L1284 937L1277 931L1277 908L1270 903L1270 887L1263 882L1263 866L1256 861L1256 838L1249 833L1249 817L1242 812L1242 789L1235 784L1235 768L1228 763L1228 740L1221 734L1221 719L1214 713L1214 698L1207 692L1207 669L1200 664L1200 648L1193 643L1193 620L1186 615L1186 599L1179 594L1179 571L1172 566L1172 550L1165 545L1165 522L1158 517L1158 501L1151 495L1151 473L1144 467L1144 452L1137 446L1137 430L1130 425L1130 402L1123 397L1123 381L1116 376L1116 353L1109 348L1109 332L1102 327L1102 304L1095 299L1095 283L1088 278L1088 255L1081 250L1081 234L1074 228L1074 206L1067 200L1067 184L1060 179L1060 163L1052 158L1052 135L1045 130L1045 114L1038 109L1038 86L1031 81L1031 65L1023 56ZM676 132L741 132L752 142L752 158L759 163L759 179L766 184L766 200L773 206L773 228L780 234L780 250L787 255L787 278L794 283L794 306L801 311L801 327L808 332L808 355L815 360L815 376L822 381L822 404L829 409L829 432L836 438L836 453L843 459L843 474L850 480L850 503L857 508L857 531L864 536L864 552L872 557L872 580L879 585L879 601L886 606L886 629L893 634L893 657L900 662L900 678L907 684L907 706L903 710L515 710L511 706L511 691L518 685L518 662L525 657L525 641L532 636L532 613L539 608L539 592L546 587L546 564L553 559L553 536L561 531L561 515L568 510L568 487L575 481L575 466L582 460L582 438L589 432L589 416L596 411L596 388L603 383L603 360L610 355L610 332L617 327L617 311L624 306L624 283L631 278L631 262L638 257L638 234L645 228L645 206L652 200L652 184L659 179L659 163L666 158L666 142ZM4676 7L4670 14L4654 14L4649 21L4633 21L4628 28L4612 28L4607 35L4591 35L4586 42L4577 42L4572 49L4563 49L4558 56L4542 56L4537 63L4528 63L4523 70L4514 70L4502 84L4493 84L4488 91L4479 91L4466 105L4458 105L4445 119L4437 119L4424 134L4416 134L4410 148L4401 148L4375 176L4366 176L4287 255L4287 264L4266 283L4266 292L4252 304L4252 313L4238 325L4238 334L4224 346L4224 355L4217 360L4217 369L4210 374L4210 383L4203 388L4203 397L4189 409L4189 425L4182 430L4182 439L4175 445L4175 453L4168 459L4168 474L4161 480L4161 488L4154 494L4154 510L4147 515L4147 538L4140 543L4140 566L4133 571L4133 608L4126 613L4126 650L4119 655L4119 833L4126 838L4126 875L4133 880L4133 910L4140 915L4140 938L4147 944L4147 959L4154 965L4154 980L4161 986L4161 1002L4168 1007L4168 1016L4175 1021L4175 1037L4182 1042L4182 1051L4189 1056L4189 1065L4196 1070L4196 1086L4210 1098L4210 1107L4217 1112L4217 1121L4231 1133L4231 1142L4245 1154L4245 1163L4259 1175L4259 1184L4280 1204L4280 1212L4294 1218L4294 1226L4329 1260L4331 1270L4340 1270L4343 1274L4345 1284L4354 1284L4394 1327L4403 1327L4423 1348L4431 1348L4451 1369L4459 1369L4465 1376L4474 1376L4486 1390L4495 1390L4500 1397L4509 1397L4514 1404L4523 1404L4528 1411L4537 1411L4542 1418L4551 1418L4556 1425L4565 1425L4570 1432L4579 1432L4584 1439L4600 1439L4605 1446L4621 1446L4626 1453L4642 1453L4647 1460L4670 1460L4676 1467L4698 1467L4704 1474L4727 1474L4732 1481L4769 1481L4772 1488L4960 1488L4964 1481L5008 1481L5013 1474L5036 1474L5041 1467L5071 1467L5076 1460L5092 1460L5097 1453L5113 1453L5118 1446L5134 1446L5139 1439L5155 1439L5161 1432L5169 1432L5175 1425L5183 1425L5189 1418L5197 1418L5203 1411L5211 1411L5217 1404L5226 1404L5231 1397L5240 1397L5245 1390L5254 1390L5266 1376L5275 1376L5287 1362L5296 1362L5315 1341L5324 1341L5350 1313L5359 1313L5445 1226L5445 1218L5473 1191L5473 1183L5487 1170L5487 1161L5501 1149L5501 1140L5515 1128L5515 1119L5522 1114L5522 1105L5537 1093L5537 1077L5544 1072L5544 1063L5551 1058L5551 1049L5558 1044L5558 1035L5565 1030L5565 1014L5572 1009L5572 1000L5579 995L5579 979L5586 973L5586 958L5593 952L5593 929L5600 924L5600 901L5607 896L5607 873L5614 868L5614 824L5621 821L5621 668L5614 664L5614 620L5607 615L5607 578L5600 573L5600 557L5593 552L5593 529L5586 524L5586 508L5579 503L5579 480L5572 474L5572 466L5565 460L5565 445L5558 439L5558 430L5551 425L5551 416L5544 411L5544 402L5537 397L5537 388L5530 383L5530 374L5515 362L5515 353L5508 348L5508 339L5494 327L5494 318L5473 299L5473 290L5459 278L5459 269L5417 228L5417 220L5373 176L5364 176L5338 148L5329 148L5310 127L5301 127L5289 112L5280 112L5268 98L5259 98L5254 91L5245 91L5233 77L5224 77L5219 70L5210 70L5197 56L5182 56L5176 49L5168 49L5162 42L5154 42L5148 35L5132 35L5127 28L5111 28L5106 21L5090 21L5085 14L5062 14L5057 7L5034 7L5031 0L4709 0L4705 7ZM4781 230L4804 230L4809 237L4832 237L4837 230L4951 230L4957 237L4973 237L4976 241L4978 624L5366 624L5370 627L5370 847L5366 850L4976 852L4976 1233L4973 1237L4865 1237L4860 1244L4809 1244L4802 1237L4795 1244L4790 1237L4760 1237L4756 1233L4755 850L4373 850L4363 840L4363 627L4366 624L4756 622L4756 241L4760 237L4776 237Z'},
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
    /* слайдшоу: листается само, пока блок на экране и человек его не трогает */
    if (g.hasAttribute('data-auto') && !RED) {
      var seen = false, hold = false;
      if (HAS_IO) new IntersectionObserver(function (es) { seen = es[0].isIntersecting; }, { threshold: .4 }).observe(g);
      ['pointerenter', 'focusin', 'touchstart'].forEach(function (ev) { g.addEventListener(ev, function () { hold = true; }, { passive: true }); });
      ['pointerleave', 'focusout'].forEach(function (ev) { g.addEventListener(ev, function () { hold = false; }); });
      setInterval(function () {
        if (!seen || hold || document.hidden) return;
        var max = t.scrollWidth - t.clientWidth;
        t.scrollTo({ left: t.scrollLeft >= max - 1 ? 0 : t.scrollLeft + t.clientWidth, behavior: 'smooth' });
      }, 3500);
    }
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
