/* Ensign Ai Marketing Agency — main.js v4 */

(function () {
  'use strict';

  /* ── Scroll-driven hero ──────────────────────────────────── */
  var heroBg      = document.getElementById('hero-bg');
  var heroContent = document.getElementById('hero-content');
  var heroHint    = document.getElementById('hero-hint');

  if (heroBg && heroContent) {
    function onHeroScroll() {
      var progress = Math.min(1, window.scrollY / 700);
      heroBg.style.transform = 'scale(' + (1 + progress * 0.08) + ') translateY(' + (progress * 40) + 'px)';
      heroContent.style.opacity  = Math.max(0, 1 - progress * 1.1);
      heroContent.style.transform = 'translateY(' + (-progress * 60) + 'px)';
      if (heroHint) heroHint.style.opacity = Math.max(0, 1 - progress * 2);
    }
    window.addEventListener('scroll', onHeroScroll, { passive: true });
    onHeroScroll();
  }

  /* ── Mobile nav toggle ───────────────────────────────────── */
  var burger    = document.getElementById('nav-burger');
  var mobileNav = document.getElementById('nav-mobile');

  if (burger && mobileNav) {
    burger.addEventListener('click', function () {
      var open = mobileNav.classList.toggle('open');
      burger.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', open);
    });

    /* close on outside click */
    document.addEventListener('click', function (e) {
      if (!burger.contains(e.target) && !mobileNav.contains(e.target)) {
        mobileNav.classList.remove('open');
        burger.classList.remove('open');
        burger.setAttribute('aria-expanded', false);
      }
    });

    /* close on nav link click */
    mobileNav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        mobileNav.classList.remove('open');
        burger.classList.remove('open');
      });
    });
  }

})();
