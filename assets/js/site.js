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
