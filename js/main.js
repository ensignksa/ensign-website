/* ============================================
   ENSIGN AI LABS — Main JavaScript
   Interactive animations & behaviors
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  // --- RTL Detection ---
  const isRTL = document.documentElement.dir === 'rtl';

  // --- Preloader ---
  const preloader = document.getElementById('preloader');
  if (preloader) {
    window.addEventListener('load', () => {
      setTimeout(() => {
        preloader.classList.add('hidden');
        document.body.style.overflow = '';
        initAnimations();
      }, 1800);
    });

    // Fallback: hide preloader after 3s regardless
    setTimeout(() => {
      preloader.classList.add('hidden');
      document.body.style.overflow = '';
    }, 3000);
  }

  // --- Custom Cursor ---
  const cursor = document.getElementById('cursor');
  const follower = document.getElementById('cursor-follower');
  let mouseX = 0, mouseY = 0;
  let cursorX = 0, cursorY = 0;
  let followerX = 0, followerY = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  function animateCursor() {
    // Cursor follows instantly
    cursorX += (mouseX - cursorX) * 0.5;
    cursorY += (mouseY - cursorY) * 0.5;
    cursor.style.left = cursorX + 'px';
    cursor.style.top = cursorY + 'px';

    // Follower with delay
    followerX += (mouseX - followerX) * 0.15;
    followerY += (mouseY - followerY) * 0.15;
    follower.style.left = followerX + 'px';
    follower.style.top = followerY + 'px';

    requestAnimationFrame(animateCursor);
  }
  animateCursor();

  // Cursor hover states
  const hoverElements = document.querySelectorAll('a, button, .service-card, .benefit-card, .engagement-card, .industry-item');
  hoverElements.forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursor.classList.add('hovering');
      follower.classList.add('hovering');
    });
    el.addEventListener('mouseleave', () => {
      cursor.classList.remove('hovering');
      follower.classList.remove('hovering');
    });
  });

  // --- Navigation Scroll ---
  const nav = document.getElementById('nav');
  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const currentScroll = window.scrollY;
    if (currentScroll > 50) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
    lastScroll = currentScroll;
  });

  // --- Mobile Menu ---
  const toggle = document.getElementById('nav-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileLinks = mobileMenu.querySelectorAll('.mobile-link');

  toggle.addEventListener('click', () => {
    toggle.classList.toggle('active');
    mobileMenu.classList.toggle('active');
    document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
  });

  mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
      toggle.classList.remove('active');
      mobileMenu.classList.remove('active');
      document.body.style.overflow = '';
    });
  });

  // --- Hero Word Rotation ---
  const words = document.querySelectorAll('.hero-word');
  let currentWordIndex = 0;

  if (words.length > 1) {
    function rotateWords() {
      const currentWord = words[currentWordIndex];
      currentWord.classList.remove('active');
      currentWord.classList.add('exit');

      setTimeout(() => {
        currentWord.classList.remove('exit');
      }, 500);

      currentWordIndex = (currentWordIndex + 1) % words.length;
      words[currentWordIndex].classList.add('active');
    }

    setInterval(rotateWords, 2500);
  }

  // --- Scroll Animations (Intersection Observer) ---
  function initAnimations() {
    const animateElements = document.querySelectorAll('[data-animate]');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const delay = entry.target.dataset.delay || 0;
          setTimeout(() => {
            entry.target.classList.add('visible');
          }, delay * 1000);
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    animateElements.forEach(el => observer.observe(el));
  }

  // Initialize animations immediately as well (in case load event already fired)
  initAnimations();

  // Safety net: force all animated elements visible after 1.5s
  // Prevents content from staying hidden if IntersectionObserver fails
  setTimeout(() => {
    document.querySelectorAll('[data-animate]:not(.visible)').forEach(el => {
      el.classList.add('visible');
    });
  }, 1500);

  // --- Counter Animation ---
  function animateCounters() {
    const counters = document.querySelectorAll('.stat-number[data-count]');

    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const target = parseInt(entry.target.dataset.count);
          const duration = 2000;
          const startTime = performance.now();

          function updateCounter(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            const currentValue = Math.round(target * easeProgress);
            entry.target.textContent = currentValue;

            if (progress < 1) {
              requestAnimationFrame(updateCounter);
            }
          }

          requestAnimationFrame(updateCounter);
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(counter => counterObserver.observe(counter));
  }

  animateCounters();

  // --- GSAP Animations (subtle effects only) ---
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);

    // Marquee speed change on scroll
    gsap.to('.marquee-track', {
      x: isRTL ? 100 : -100,
      scrollTrigger: {
        trigger: '.marquee-section',
        start: 'top bottom',
        end: 'bottom top',
        scrub: 2,
      }
    });
  }

  // --- Smooth anchor scrolling ---
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#') return;
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        const navHeight = 80;
        const top = target.getBoundingClientRect().top + window.scrollY - navHeight;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  // --- Active nav link on scroll ---
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link:not(.nav-link-cta)');

  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 200;
      if (window.scrollY >= sectionTop) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.style.color = '';
      if (link.getAttribute('href') === '#' + current) {
        link.style.color = 'var(--blue)';
      }
    });
  });

  // --- Magnetic effect on buttons ---
  const magneticBtns = document.querySelectorAll('.btn');
  magneticBtns.forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });

  // --- Tilt effect on service cards ---
  const tiltCards = document.querySelectorAll('.service-card:not(.service-card-cta)');
  tiltCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      const tiltX = (y - 0.5) * 6;
      const tiltY = (x - 0.5) * -6;
      card.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-4px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });

  // --- GA4 Key Event / Conversion Tracking ---
  // Uses GA4 recommended events for proper Lead Gen Key Event tracking
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href]');
    if (!link) return;
    const href = link.getAttribute('href');
    if (!href) return;

    // Determine page context for attribution
    const pagePath = window.location.pathname;
    const pageTitle = document.title;

    // Book a Discovery Call — generate_lead (Key Event)
    if (href.includes('cal.eu')) {
      gtag('event', 'generate_lead', {
        currency: 'SAR',
        value: 500,
        lead_source: 'booking_call',
        link_url: href,
        page_path: pagePath,
        page_title: pageTitle
      });
    }

    // Request a Proposal — generate_lead (Key Event)
    if (href.includes('mailto:contact@ensignksa.com')) {
      gtag('event', 'generate_lead', {
        currency: 'SAR',
        value: 300,
        lead_source: 'proposal_request',
        link_url: href,
        page_path: pagePath,
        page_title: pageTitle
      });
    }

    // WhatsApp click — contact (Key Event)
    if (href.includes('wa.me')) {
      gtag('event', 'generate_lead', {
        currency: 'SAR',
        value: 200,
        lead_source: 'whatsapp',
        link_url: href,
        page_path: pagePath,
        page_title: pageTitle
      });
    }

    // Phone call click
    if (href.startsWith('tel:')) {
      gtag('event', 'generate_lead', {
        currency: 'SAR',
        value: 200,
        lead_source: 'phone_call',
        link_url: href,
        page_path: pagePath,
        page_title: pageTitle
      });
    }

    // Blog internal link clicks — for content attribution
    if (href.includes('/blog/') && !href.includes('mailto') && !href.includes('wa.me')) {
      gtag('event', 'select_content', {
        content_type: 'blog_post',
        item_id: href,
        page_path: pagePath
      });
    }
  });

});
