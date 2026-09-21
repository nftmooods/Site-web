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
    labFilter.hidden = false;
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
