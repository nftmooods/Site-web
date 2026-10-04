/* martinlisen.com — interactions minimales.
   Tout reste lisible sans JavaScript : menu, contenus et liens fonctionnent en HTML pur. */
(function () {
  'use strict';

  // Menu mobile
  var btn = document.querySelector('.menu-btn');
  var nav = document.getElementById('nav');
  if (btn && nav) {
    btn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(open));
      btn.querySelector('span').textContent = open ? 'Fermer' : 'Menu';
      document.body.style.overflow = open ? 'hidden' : '';
    });
    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        if (nav.classList.contains('open')) btn.click();
      });
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 900 && nav.classList.contains('open')) btn.click();
    });
  }

  // Révélation au défilement (≈700 ms, courbe douce), désactivée si l'appareil le demande
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  function setMotion() { document.body.classList.toggle('motion-off', reduce.matches); }
  setMotion();
  if (reduce.addEventListener) reduce.addEventListener('change', setMotion);

  // Dossiers : ouverture au clic et au clavier, sans rotation à la souris.
  var bench = document.querySelector('[data-workbench]');
  if (bench) {
    var folders = bench.querySelectorAll('details');
    folders.forEach(function (folder) {
      folder.addEventListener('toggle', function () {
        if (folder.open) folders.forEach(function (other) {
          if (other !== folder) other.open = false;
        });
      });
    });
  }

  // Dossier de solutions : amélioration progressive des liens en onglets.
  document.querySelectorAll('[data-casebook]').forEach(function (book) {
    var menu = book.querySelector('.case-menu');
    var links = Array.prototype.slice.call(menu.querySelectorAll('[data-case-link]'));
    var panels = links.map(function (link) { return document.getElementById(link.hash.slice(1)); });
    if (panels.some(function (panel) { return !panel; })) return;
    menu.setAttribute('role', 'tablist');
    var compactCases = window.matchMedia('(max-width: 650px)');
    function orientCases() { menu.setAttribute('aria-orientation', compactCases.matches ? 'horizontal' : 'vertical'); }
    orientCases();
    if (compactCases.addEventListener) compactCases.addEventListener('change', orientCases);
    function selectCase(index, focus) {
      links.forEach(function (link, i) {
        link.setAttribute('aria-selected', String(i === index));
        link.tabIndex = i === index ? 0 : -1;
        panels[i].hidden = i !== index;
      });
      if (focus) links[index].focus();
    }
    links.forEach(function (link, i) {
      link.setAttribute('role', 'tab');
      link.setAttribute('aria-controls', panels[i].id);
      panels[i].setAttribute('role', 'tabpanel');
      panels[i].setAttribute('aria-labelledby', link.id);
      panels[i].tabIndex = 0;
      link.addEventListener('click', function (event) {
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        selectCase(i, false);
      });
      link.addEventListener('keydown', function (event) {
        var next = i;
        if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (i + 1) % links.length;
        else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = (i + links.length - 1) % links.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = links.length - 1;
        else if (event.key !== ' ') return;
        event.preventDefault();
        selectCase(next, true);
      });
    });
    function caseFromHash() {
      var index = panels.findIndex(function (panel) { return '#' + panel.id === location.hash; });
      if (index >= 0) selectCase(index, false);
      return index;
    }
    if (caseFromHash() < 0) selectCase(0, false);
    window.addEventListener('hashchange', caseFromHash);
    book.classList.add('is-enhanced');
  });

  // Aide Chèque-Formation : informative et temporaire.
  var fundingTips = Array.prototype.slice.call(document.querySelectorAll('.funding-tip'));
  function clearFundingTimer(tip) {
    if (tip._closeTimer) { clearTimeout(tip._closeTimer); tip._closeTimer = null; }
  }
  function scheduleFundingClose(tip) {
    clearFundingTimer(tip);
    if (tip.open) tip._closeTimer = setTimeout(function () { tip.open = false; }, 6500);
  }
  fundingTips.forEach(function (tip) {
    tip.addEventListener('toggle', function () {
      if (tip.open) fundingTips.forEach(function (other) { if (other !== tip) other.open = false; });
      scheduleFundingClose(tip);
    });
  });

  // Le Lab : filtre par statut + carrousel horizontal. Sans JavaScript, toutes les fiches restent visibles.
  var labFilter = document.querySelector('[data-labfilter]');
  var labStage = document.querySelector('[data-labstage]');
  var labGrid = labStage ? labStage.querySelector('.lab-gallery') : null;
  if (labFilter && labGrid) {
    var labCards = Array.prototype.slice.call(labGrid.querySelectorAll('.project[data-status]'));
    var labRow = labFilter.querySelector('.filter-row');
    var labHelp = labFilter.querySelector('.filter-help');
    var labCount = labFilter.querySelector('[data-labcount]');
    var labPrev = labStage.querySelector('.lab-prev');
    var labNext = labStage.querySelector('.lab-next');
    var labKeys = ['une', 'tous', 'vente', 'membre', 'construction', 'sur-mesure'];
    var labNames = { 'une': 'À la une', 'tous': 'Tout', 'vente': 'En vente', 'membre': 'Membre Lab', 'construction': 'En construction', 'sur-mesure': 'Sur-mesure' };
    var labHelps = {
      'une': 'Le projet le plus récent de chaque catégorie.',
      'tous': 'Tous les projets, du plus récent au plus ancien.',
      'vente': 'Disponibles maintenant : tu peux les acheter.',
      'membre': 'Des outils que j’utilise et que je montre. L’accès est réservé aux membres du Lab.',
      'construction': 'Des projets en cours : suis l’avancement.',
      'sur-mesure': 'Des bases que je peux adapter à ton activité.'
    };
    var labCurrent = 'une';
    var labButtons = {};
    labStage.classList.add('is-carousel');
    labGrid.setAttribute('role', 'region');
    labGrid.setAttribute('aria-label', 'Projets du Lab, à faire défiler horizontalement');
    labGrid.tabIndex = 0;
    function labMatching(key) {
      if (key === 'tous') return labCards.slice();
      if (key === 'une') {
        var seen = {};
        return labCards.filter(function (c) {
          var st = c.getAttribute('data-status');
          if (seen[st]) return false;
          seen[st] = true;
          return true;
        });
      }
      return labCards.filter(function (c) { return c.getAttribute('data-status') === key; });
    }
    function labArrows() {
      var overflow = labGrid.scrollWidth > labGrid.clientWidth + 2;
      labPrev.hidden = labNext.hidden = !overflow;
      labPrev.disabled = labGrid.scrollLeft <= 4;
      labNext.disabled = labGrid.scrollLeft + labGrid.clientWidth >= labGrid.scrollWidth - 2;
    }
    function labRender() {
      var list = labMatching(labCurrent);
      labCards.forEach(function (c) { c.hidden = list.indexOf(c) < 0; });
      Object.keys(labButtons).forEach(function (k) {
        labButtons[k].setAttribute('aria-pressed', String(k === labCurrent));
      });
      labHelp.textContent = labHelps[labCurrent];
      labCount.textContent = list.length + (list.length > 1 ? ' projets affichés' : ' projet affiché');
      labGrid.scrollLeft = 0;
      labArrows();
    }
    function labSet(key) {
      labCurrent = key;
      labRender();
      if (window.history && history.replaceState) {
        history.replaceState(null, '', location.pathname + (key === 'une' ? '' : '?statut=' + key));
      }
    }
    labKeys.forEach(function (key) {
      var total = labMatching(key).length;
      if (key !== 'une' && key !== 'tous' && !total) return;
      if (key === 'tous' && labCards.length <= 1) return;
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'filter-chip';
      b.setAttribute('aria-describedby', 'lab-filter-help');
      b.appendChild(document.createTextNode(labNames[key]));
      if (key !== 'une') {
        var sp = document.createElement('span');
        sp.textContent = String(total);
        b.appendChild(sp);
      }
      b.addEventListener('click', function () { labSet(key); });
      labButtons[key] = b;
      labRow.appendChild(b);
    });
    function labScroll(dir) {
      labGrid.scrollBy({ left: dir * labGrid.clientWidth * 0.95, behavior: reduce.matches ? 'auto' : 'smooth' });
    }
    labPrev.addEventListener('click', function () { labScroll(-1); });
    labNext.addEventListener('click', function () { labScroll(1); });
    var labTick = false;
    labGrid.addEventListener('scroll', function () {
      if (!labTick) { labTick = true; requestAnimationFrame(function () { labTick = false; labArrows(); }); }
    }, { passive: true });
    window.addEventListener('resize', labArrows);
    function labFromHash() {
      var id = location.hash.slice(1);
      var target = null;
      labCards.forEach(function (c) { if (c.id === id) target = c; });
      if (!target) return;
      if (target.hidden) { labCurrent = 'tous'; labRender(); }
      labGrid.scrollLeft = target.offsetLeft - labGrid.offsetLeft;
      labArrows();
      labFilter.scrollIntoView();
    }
    var labParam = /[?&]statut=([\w-]+)/.exec(location.search);
    if (labParam && labButtons[labParam[1]]) labCurrent = labParam[1];
    labRender();
    labFromHash();
    window.addEventListener('hashchange', labFromHash);
  }

  // Repère de lecture, sans déplacer le focus ni modifier l'historique.
  var chapters = document.querySelectorAll('.chapter-nav a');
  if (chapters.length) {
    var chapterSections = Array.prototype.map.call(chapters, function (a) {
      return document.querySelector(a.getAttribute('href'));
    });
    var chapterPending = false;
    var previousChapter = -1;
    function updateChapter() {
      chapterPending = false;
      var marker = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--top-h')) + 100;
      var active = -1;
      chapterSections.forEach(function (section, i) {
        if (section && section.getBoundingClientRect().top <= marker) active = i;
      });
      chapters.forEach(function (a, i) {
        if (i === active) a.setAttribute('aria-current', 'location');
        else a.removeAttribute('aria-current');
      });
      if (active >= 0 && active !== previousChapter && window.innerWidth <= 600) {
        var activeChapter = chapters[active];
        var chapterRail = activeChapter.parentElement;
        chapterRail.scrollTo({
          left: activeChapter.offsetLeft - (chapterRail.clientWidth - activeChapter.offsetWidth) / 2,
          behavior: reduce.matches ? 'auto' : 'smooth'
        });
      }
      previousChapter = active;
    }
    function queueChapter() {
      if (!chapterPending) { chapterPending = true; requestAnimationFrame(updateChapter); }
    }
    window.addEventListener('scroll', queueChapter, { passive: true });
    window.addEventListener('resize', queueChapter);
    updateChapter();
  }

  if ('IntersectionObserver' in window && !reduce.matches) {
    document.documentElement.classList.add('js-reveal');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    document.querySelectorAll('[data-reveal]').forEach(function (el) { io.observe(el); });
  }

  // Année du pied de page
  var y = document.getElementById('year');
  if (y) y.textContent = String(new Date().getFullYear());

  // Galerie « Le calcul que personne ne fait » : sans JS, les exemples restent tous
  // affichés à la suite (lisibles, pas de contenu perdu). Avec JS, un seul à la fois.
  document.querySelectorAll('[data-calc-gallery]').forEach(function (gallery) {
    var slides = Array.prototype.slice.call(gallery.querySelectorAll('[data-calc-slide]'));
    if (slides.length < 2) return;
    var nav = gallery.querySelector('[data-calc-nav]');
    var dotsWrap = gallery.querySelector('[data-calc-dots]');
    var prevBtn = gallery.querySelector('[data-calc-prev]');
    var nextBtn = gallery.querySelector('[data-calc-next]');
    var index = 0;
    var timer = null;

    var dots = slides.map(function (_, i) {
      var d = document.createElement('button');
      d.type = 'button';
      d.className = 'calc-dot';
      d.setAttribute('role', 'tab');
      d.setAttribute('aria-label', 'Exemple ' + (i + 1) + ' sur ' + slides.length);
      d.addEventListener('click', function () { show(i); restart(); });
      dotsWrap.appendChild(d);
      return d;
    });

    function show(i) {
      index = (i + slides.length) % slides.length;
      slides.forEach(function (s, si) { s.classList.toggle('is-active', si === index); });
      dots.forEach(function (d, di) { d.classList.toggle('is-active', di === index); });
    }
    function next() { show(index + 1); }
    function prev() { show(index - 1); }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    function restart() {
      stop();
      if (!reduce.matches) timer = setInterval(next, 7000);
    }

    prevBtn.addEventListener('click', function () { prev(); restart(); });
    nextBtn.addEventListener('click', function () { next(); restart(); });
    gallery.addEventListener('mouseenter', stop);
    gallery.addEventListener('mouseleave', restart);
    gallery.addEventListener('focusin', stop);
    gallery.addEventListener('focusout', restart);

    gallery.classList.add('js-gallery');
    nav.hidden = false;
    show(0);
    restart();
  });
})();

/* Accueil : moteur des animations, très léger, sans bibliothèque.
   Principe : à chaque défilement, on lit la position des éléments et on bascule
   des classes. Tout le mouvement est dans le CSS. Réversible dans les deux sens. */
(function () {
  'use strict';
  if (!document.getElementById('h-reconnais')) return;   // page d’accueil seulement
  var root = document.body;
  var mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  var forced = false;
  function reduced() { return forced || mq.matches; }
  function q(s, c) { return (c || document).querySelector(s); }
  function qa(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function vh() { return window.innerHeight || document.documentElement.clientHeight; }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function group(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }

  /* ---------- Scène 1 : dossiers ---------- */
  /* ---------- Scène 1 : le tableau de bord qui se construit ----------
     Une ligne de temps en boucle : chats (1-3), skills (4-6), données vers
     archives (7-10), tableau de contrôle (11-14), pause, puis on recommence.
     Les cartes flottent (CSS), le tableau se redresse un peu au scroll. */
  var hx = q('.hx');
  if (hx) {
    var hxCards = qa('.hx-card[data-i]', hx), hxSheets = qa('.hx-sheet-in', hx), hxDash = q('.hx-dash', hx);
    var hxAt = qa('[data-at]:not([data-bit])', hx);
    var hxBits = qa('[data-bit]', hx), hxDrawers = qa('[data-drawer]', hx);
    var hxStep = 0, hxVisible = true, LAST = 13, HOLD = 5;
    hxCards.forEach(function (card, i) {
      card.addEventListener('click', function () {
        var open = card.getAttribute('aria-expanded') !== 'true';
        hxCards.forEach(function (c, k) { c.setAttribute('aria-expanded', String(open && k === i)); });
        hxSheets.forEach(function (sh, k) { sh.hidden = !(open && k === i); });
      });
    });
    var showHx = function (st) {
      hxAt.forEach(function (el, k) {
        var fs = q('.hx-fstatus', hx); if (fs) fs.textContent = st >= 11 ? 'en routine' : st >= 7 ? 'en cours' : 'brouillon';
      // petit décalage propre à chaque élément : rien ne tombe exactement en même temps
        el.style.transitionDelay = (el.classList.contains('on') ? 0 : (k % 4) * 0.12) + 's';
        el.classList.toggle('on', +el.getAttribute('data-at') <= st);
      });
      // morceaux -> tiroirs : chaque morceau vise sa case (position calculée), la case s'allume à l'arrivée
      var count = [0, 0, 0];
      hxBits.forEach(function (bit) {
        var on = +bit.getAttribute('data-at') <= st, d = +bit.getAttribute('data-to');
        if (on) {
          var slot = qa('b', hxDrawers[d])[count[d] % 3]; count[d]++;
          var a = bit.getBoundingClientRect(), z = slot.getBoundingClientRect();
          if (!bit.classList.contains('on')) {
            bit.style.setProperty('--dx', (z.left + z.width / 2 - (a.left + a.width / 2)) + 'px');
            bit.style.setProperty('--dy', (z.top + z.height / 2 - (a.top + a.height / 2)) + 'px');
            bit.classList.add('on'); bit.classList.remove('landed');
            setTimeout(function () { bit.classList.add('landed'); slot.classList.add('full'); }, 950);
          }
        } else { bit.classList.remove('on', 'landed'); }
      });
      if (st < 5) hxDrawers.forEach(function (dr) { qa('b', dr).forEach(function (b) { b.classList.remove('full'); }); });
    };
    setInterval(function () {
      if (reduced() || !hxVisible) return;
      hxStep = hxStep >= LAST + HOLD ? 0 : hxStep + 1;
      hx.classList.toggle('is-reset', hxStep === 0);
      showHx(Math.min(hxStep, LAST));
    }, 850);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) { hxVisible = e.isIntersecting; hx.classList.toggle('is-paused', !e.isIntersecting); });
      }).observe(hx);
    }
    var updHx = function () {
      if (reduced()) { showHx(LAST); hxDrawers.forEach(function (dr) { qa('b', dr).forEach(function (b) { b.classList.add('full'); }); }); hxDash.style.setProperty('--tx', '8deg'); hxDash.style.setProperty('--ty', '-11deg'); return; }
      var r = hxDash.getBoundingClientRect();
      var f = clamp((r.top - vh() * 0.1) / (vh() * 0.7), 0, 1);
      hxDash.style.setProperty('--tx', (8 + 10 * f).toFixed(2) + 'deg');
      hxDash.style.setProperty('--ty', (-11 - 8 * f).toFixed(2) + 'deg');
    };
  }

  /* ---------- Scène 2 : Faire le point ----------
     La scène reste épinglée le temps de parcourir .pc-scroll : chaque tranche de
     défilement pose une carte sur la pile, le déclic se pose en dernier. */
  var sit = q('#reconnais');
  var pcScroll = q('.pc-scroll', sit);
  var pcCards = qa('.pc-card', sit);
  var sitDecl = q('.sit-decl', sit);
  var sitRail = qa('.sit-rail i', sit);
  var pcLabel = q('[data-pc-label]', sit);
  var pcFinale = q('.pc-finale', sit);
  var bar = q('.top'), cnav = q('.chapter-nav');
  function updSit() {
    document.documentElement.style.setProperty('--pvb', ((bar ? bar.offsetHeight : 0) + (cnav ? cnav.offsetHeight : 0)) + 'px');
    var n = pcCards.length, k = n + 1;
    if (!reduced()) {
      var rect = pcScroll.getBoundingClientRect();
      var span = Math.max(1, rect.height - vh());
      var t = clamp(-rect.top / span, 0, 1);
      // n cartes, puis le déclic et le titre de clôture, deux tranches chacun
      var slot = Math.floor(t * (n + 4));
      k = slot < n ? slot : slot < n + 2 ? n : n + 1;
      if (rect.top > vh() * 0.35) k = -1;
    }
    pcCards.forEach(function (c, i) {
      c.classList.toggle('is-in', i <= Math.max(k, 0) && k >= 0);
      c.classList.toggle('is-under', i < k);
    });
    sitDecl.classList.toggle('is-on', k >= n);
    pcFinale.classList.toggle('is-on', k >= n + 1);
    sitRail.forEach(function (s, i) { s.classList.toggle('is-on', i <= Math.min(k, n)); });
    pcLabel.textContent = k >= n + 1 ? 'Le déclic' : k >= n ? 'Le coût' : 'Situation ' + pad(Math.max(k, 0) + 1) + ' sur ' + pad(n);
  }

  /* ---------- Scène 3 : grille des cas d'usage ---------- */
  var cb = q('.casebook');
  var tiles = qa('.case-tile[data-case]', cb);
  var nextTile = q('.case-tile-next', cb);
  var cnt = q('[data-count]', cb);
  var panels = qa('.case-panel', cb);
  function selectCase(id) {
    tiles.forEach(function (t) { t.setAttribute('aria-pressed', String(t.getAttribute('data-case') === id)); });
    panels.forEach(function (p) { p.hidden = p.id !== 'case-' + id; });
  }
  tiles.forEach(function (t) {
    t.addEventListener('click', function () { if (!t.disabled) selectCase(t.getAttribute('data-case')); });
  });
  selectCase(tiles[0].getAttribute('data-case'));
  function updCases() {
    var r = reduced();
    var p = r ? 1 : clamp((vh() * 0.92 - cb.getBoundingClientRect().top) / (vh() * 0.62), 0, 1);
    cb.style.setProperty('--p', p.toFixed(3));
    var n = 0;
    tiles.forEach(function (t, k) {
      var on = r || p > (k + 0.6) / 8.2;
      t.classList.toggle('is-filled', on);
      t.disabled = !on;
      if (on) n++;
    });
    nextTile.classList.toggle('is-filled', r || p >= 0.985);
    cnt.textContent = n;
  }

  /* ---------- Scène 4 : le document qui se construit ----------
     Épinglé le temps de parcourir .sq-scroll. Sept paliers : titre (qui s'écrit au
     fil du scroll), point de départ, journal, assistant, mise en place, autonomie, tampon. */
  var sqScroll = q('.sq-scroll');
  var sqSteps = qa('.sq-step', sqScroll);
  var sqParts = qa('[data-s]', sqScroll);
  var sqType = q('[data-type]', sqScroll);
  var sqFull = sqType.textContent;
  var sqStatus = q('[data-status]', sqScroll);
  var sqDoc = q('.sq-doc', sqScroll);
  var STATUS = ['Brouillon', 'Brouillon', 'En construction', 'En construction', 'En test', 'Dans ta routine', 'Dans ta routine'];
  function updJourney() {
    var s = 6, typed = 1;
    if (!reduced()) {
      var rect = sqScroll.getBoundingClientRect();
      var t = clamp(-rect.top / Math.max(1, rect.height - vh()), 0, 1) * 7.4;
      s = Math.min(6, Math.floor(t));
      typed = clamp(t / 0.8, 0, 1);
      if (rect.top > vh() * 0.4) { s = -1; typed = 0; }
    }
    sqParts.forEach(function (el) { el.classList.toggle('is-in', +el.getAttribute('data-s') <= s); });
    var step = s >= 5 ? 3 : s >= 4 ? 2 : s >= 2 ? 1 : 0;
    sqSteps.forEach(function (el, i) { el.classList.toggle('is-now', i === step); el.classList.toggle('is-done', i < step); });
    var n = Math.round(sqFull.length * typed);
    sqType.textContent = sqFull.slice(0, n);
    sqType.classList.toggle('is-typing', n > 0 && n < sqFull.length);
    // le fichier arrive incliné et se redresse à mesure qu'il se remplit
    var f = 1 - clamp((s + typed) / 6, 0, 1);
    sqDoc.style.setProperty('--ry', (-12 * f).toFixed(2) + 'deg');
    sqDoc.style.setProperty('--rx', (5 * f).toFixed(2) + 'deg');
    sqDoc.style.setProperty('--rz', (2 * f).toFixed(2) + 'deg');
    sqStatus.textContent = STATUS[Math.max(s, 0)];
    sqStatus.classList.toggle('is-final', s >= 5);
  }

  /* ---------- Scène 4 bis : le fond bascule au papier -> noir ---------- */
  var jSec = q('#preuves');
  function updCurve() {
    jSec.classList.toggle('dark', reduced() || jSec.getBoundingClientRect().top < vh() * 0.6);
  }

  /* ---------- Scène 5 : l'orbite des outils ----------
     Deux moteurs combinés : une rotation lente permanente (auto-animée) et la
     progression du scroll, qui allume les outils un par un, fait compter les
     chiffres et ajoute de la rotation. Des impulsions remontent vers le noyau. */
  var ox = q('#chiffres');
  var oxScroll = q('.ox-scroll', ox);
  var oxViz = q('.ox-viz', ox);
  var oxSvg = q('.ox-svg', ox);
  var oxCore = q('.ox-core', ox);
  var oxSats = qa('.ox-sat', ox);
  var oxTh = qa('.ox-svg path', ox);
  var oxPulse = qa('.ox-pulse', ox);
  var oxRings = qa('.ox-ring', ox);
  var oxEnd = q('.ox-end', ox);
  var oxLabel = q('[data-ox-label]', ox);
  var counters = new WeakMap();
  var oxK = -1, oxP = 0, W = 0;
  var BASE = [-90, -30, 30, 90, 150, 210];
  function finalOf(b) { return b.getAttribute('data-final'); }
  function cancelCount(b) { var c = counters.get(b); if (c) { c(); counters.delete(b); } }
  function countUp(b) {
    var fin = finalOf(b), to = parseInt(fin.replace(/[^\d]/g, ''), 10), suf = /\+\s*$/.test(fin) ? '+' : '';
    var t0 = null, id;
    cancelCount(b);
    function frame(t) {
      if (t0 === null) t0 = t;
      var k = clamp((t - t0) / 1200, 0, 1), e = 1 - Math.pow(1 - k, 3);
      if (k >= 1) { b.textContent = fin; counters.delete(b); return; }
      b.textContent = group(Math.round(to * e)) + (k > 0.92 ? suf : '');
      id = requestAnimationFrame(frame);
    }
    id = requestAnimationFrame(frame);
    counters.set(b, function () { cancelAnimationFrame(id); });
  }
  function sizeOx() {
    W = oxViz.clientWidth;
    oxSvg.setAttribute('viewBox', '0 0 ' + W + ' ' + W);
    var R = radius();
    oxRings[0].setAttribute('cx', W / 2); oxRings[0].setAttribute('cy', W / 2); oxRings[0].setAttribute('r', R * 0.55);
    oxRings[1].setAttribute('cx', W / 2); oxRings[1].setAttribute('cy', W / 2); oxRings[1].setAttribute('r', R);
  }
  function radius() { return W / 2 - (W < 480 ? 56 : 92); }
  function setLit(k) {
    if (k === oxK) return;
    var r = reduced();
    oxSats.forEach(function (sat, i) {
      var on = i < k, was = sat.classList.contains('is-lit');
      sat.classList.toggle('is-lit', on);
      oxTh[i].classList.toggle('is-lit', on);
      var b = q('.ox-num', sat);
      if (!b) return;
      if (r) { cancelCount(b); b.textContent = finalOf(b); }
      else if (on && !was) countUp(b);
      else if (!on) { cancelCount(b); b.textContent = '0'; }
    });
    oxSats.forEach(function (sat, i) { sat.classList.toggle('is-now', i === k - 1 && k <= 5); });
    oxEnd.classList.toggle('is-on', k >= 6);
    var now = oxSats[Math.min(k, 6) - 1];
    oxLabel.textContent = k <= 0 ? 'Les outils, un par un' : k >= 6 ? 'Et le prochain, chez toi' :
      'Liaison ' + pad(k) + ' sur 05 · ' + q('.ox-tag', now).textContent;
    oxK = k;
  }
  function updCore() {
    if (reduced()) { oxP = 1; setLit(6); return; }
    var rect = oxScroll.getBoundingClientRect();
    oxP = clamp(-rect.top / Math.max(1, rect.height - vh()), 0, 1);
    setLit(rect.top > vh() * 0.4 ? 0 : Math.min(6, Math.floor(oxP * 6.6) + 1));
  }
  function drawOx(t) {
    if (!W) sizeOx();
    var r = reduced(), C = W / 2, R = radius();
    var rot = (r ? 0 : t * 0.005) + oxP * 70;
    oxSats.forEach(function (sat, i) {
      var a = (BASE[i] + rot) * Math.PI / 180;
      var x = C + R * Math.cos(a), y = C + R * Math.sin(a);
      sat.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) translate(-50%,-50%)';
      // fil courbe de l'outil vers le noyau
      var qx = C + (x - C) * 0.5 - (y - C) * 0.28, qy = C + (y - C) * 0.5 + (x - C) * 0.28;
      oxTh[i].setAttribute('d', 'M' + x.toFixed(1) + ' ' + y.toFixed(1) + 'Q' + qx.toFixed(1) + ' ' + qy.toFixed(1) + ' ' + C + ' ' + C);
      var p = oxPulse[i];
      if (!p) return;
      var on = !r && sat.classList.contains('is-lit');
      if (!on) { p.style.opacity = 0; return; }
      var u = ((t / 1900) + i * 0.37) % 1, v = 1 - u;
      p.setAttribute('cx', (v * v * x + 2 * v * u * qx + u * u * C).toFixed(1));
      p.setAttribute('cy', (v * v * y + 2 * v * u * qy + u * u * C).toFixed(1));
      p.style.opacity = Math.sin(Math.PI * u).toFixed(2);
    });
    var k = Math.max(oxK, 0);
    oxCore.style.transform = 'translate(-50%,-50%) scale(' + (0.9 + 0.05 * Math.min(k, 5) + (r ? 0 : Math.sin(t / 900) * 0.015)).toFixed(3) + ')';
  }
  (function loop(t) {
    var rc = ox.getBoundingClientRect();
    if (rc.bottom > 0 && rc.top < vh()) drawOx(t || 0);
    requestAnimationFrame(loop);
  })();
  window.addEventListener('resize', function () { W = 0; });

  /* ---------- Mode et boucle ---------- */
  function updAll() { if (hx) updHx(); updSit(); updCases(); updCurve(); updJourney(); updCore(); }
  var ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () { ticking = false; updAll(); });
  }
  function applyMode() {
    var r = reduced();
    root.classList.toggle('js-anim', !r);
    oxK = -1;
    updAll();
  }
  if (mq.addEventListener) mq.addEventListener('change', applyMode);
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  applyMode();
})();
