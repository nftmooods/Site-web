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
})();
