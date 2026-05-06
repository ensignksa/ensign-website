/* ========================================================================
   Ensign · analytics layer
   Pushes events to BOTH GA4 (gtag) and GTM (dataLayer) so tracking works
   whether GTM is configured yet or not. Once GA4 is wired inside GTM,
   remove the direct gtag.js install in <head> to avoid duplicate hits.
   ========================================================================
   No personal data is ever sent to GA4: we never include form field values,
   email addresses, phone numbers, or message contents in event parameters.
   ======================================================================== */
(function () {
  'use strict';

  // --- 1. Ensure dataLayer + gtag exist (gtag may load before/after this) ---
  window.dataLayer = window.dataLayer || [];
  function _gtag() { window.dataLayer.push(arguments); }
  if (typeof window.gtag !== 'function') window.gtag = _gtag;

  // --- 2. UTM capture (persists for the session) ---
  var UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  var sessionUtm = (function () {
    try {
      var qp = new URLSearchParams(location.search);
      var fresh = {};
      UTM_KEYS.forEach(function (k) { if (qp.has(k)) fresh[k] = qp.get(k); });
      if (Object.keys(fresh).length) {
        try { sessionStorage.setItem('ensign_utm', JSON.stringify(fresh)); } catch (e) {}
        return fresh;
      }
      var stored = sessionStorage.getItem('ensign_utm');
      return stored ? JSON.parse(stored) : {};
    } catch (e) { return {}; }
  })();

  // --- 3. Unified track helper ---
  function track(name, params) {
    params = params || {};
    var base = {
      page_title: document.title,
      page_location: location.href,
      page_path: location.pathname,
      language: document.documentElement.lang || 'en'
    };
    var payload = Object.assign({}, base, sessionUtm, params);

    // GA4 (direct gtag)
    if (typeof window.gtag === 'function') {
      try { window.gtag('event', name, payload); } catch (e) {}
    }
    // GTM (dataLayer object push — listened by GTM custom-event triggers)
    try { window.dataLayer.push(Object.assign({ event: name }, payload)); } catch (e) {}
  }
  window.ensignTrack = track;

  // --- 4. Campaign-landing fire on first paint with UTMs ---
  if (Object.keys(sessionUtm).length && location.search.match(/utm_/)) {
    track('campaign_landing', {});
  }

  // --- 5. Service-page view ---
  var SERVICE_MAP = {
    '/ai-solutions.html': 'ai_solutions',
    '/ensign-os.html':    'ensign_os',
    '/agency.html':       'agency',
    '/work.html':         'our_work',
    '/about.html':        'about',
    '/careers.html':      'careers',
    '/blog/':             'blog',
    '/blog/index.html':   'blog'
  };
  function pathKey(p) { return p.replace(/^\/ar/, '') || '/'; }
  var serviceName = SERVICE_MAP[pathKey(location.pathname)];
  if (serviceName) {
    setTimeout(function () { track('view_service_page', { service_name: serviceName }); }, 0);
  }

  // --- 6. Click delegation: WhatsApp / tel / mailto / Cal.com / data-event-name ---
  function closestContext(el) {
    var ctx = el.closest('[data-cta-location], [data-section]');
    if (ctx) return ctx.dataset.ctaLocation || ctx.dataset.section;
    var parent = el.closest('section[id], header, footer, nav');
    if (parent) return parent.id || parent.tagName.toLowerCase();
    return 'page';
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest('a, button');
    if (!t) return;

    var href = (t.getAttribute('href') || '').trim();
    var ctaText = (t.dataset.ctaText || (t.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80));
    var location_label = t.dataset.ctaLocation || closestContext(t);
    var service = t.dataset.serviceName || serviceName || '';
    var explicit = t.dataset.eventName;
    var common = {
      cta_text: ctaText,
      cta_location: location_label,
      service_name: service,
      link_url: href
    };

    // Explicit event name on the element wins
    if (explicit) { track(explicit, common); return; }

    if (!href) return;

    // WhatsApp
    if (/^https?:\/\/(wa\.me|api\.whatsapp\.com|whatsapp\.com)/i.test(href) || /^whatsapp:/i.test(href)) {
      track('whatsapp_click', common);
      return;
    }
    // Phone
    if (/^tel:/i.test(href)) {
      track('call_click', common);
      return;
    }
    // Email — also count "proposal" mailtos as proposal_request
    if (/^mailto:/i.test(href)) {
      track('email_click', common);
      if (/proposal|quote/i.test(ctaText) || /proposal|quote/i.test(href)) {
        track('proposal_request', common);
        track('generate_lead', Object.assign({ lead_source: 'email_proposal' }, common));
      }
      return;
    }
    // Cal.com booking
    if (/(?:cal\.com|cal\.eu)\/ensign/i.test(href)) {
      track('book_call_click', common);
      track('generate_lead', Object.assign({ lead_source: 'cal_booking_click' }, common));
      return;
    }
    // File downloads
    if (/\.(pdf|docx?|xlsx?|pptx?|zip|csv)(\?|#|$)/i.test(href)) {
      track('file_download', Object.assign({ file_url: href, file_extension: href.split('.').pop().split(/[?#]/)[0] }, common));
      return;
    }
  }, true);

  // --- 7. Form tracking (Web3Forms on careers; safe for any future form) ---
  document.addEventListener('submit', function (e) {
    var f = e.target;
    if (!f || f.tagName !== 'FORM') return;
    var formName = f.id || f.getAttribute('name') || (f.action || '').replace(/\W+/g, '_').slice(-32) || 'form';
    track('form_start', { form_name: formName });
    f.dataset._tracked = '1';
  }, true);

  // Detect Web3Forms-style success state appearing in the DOM
  var SUCCESS_SELECTOR = '.form-success, [data-form-success], #form-success';
  var successObserver = new MutationObserver(function (mutations) {
    for (var i = 0; i < mutations.length; i++) {
      var m = mutations[i];
      if (!m.addedNodes) continue;
      for (var j = 0; j < m.addedNodes.length; j++) {
        var n = m.addedNodes[j];
        if (n.nodeType !== 1) continue;
        var hit = (n.matches && n.matches(SUCCESS_SELECTOR)) ? n
                : (n.querySelector ? n.querySelector(SUCCESS_SELECTOR) : null);
        if (hit) {
          var form = hit.closest('form') || document.querySelector('form[data-_tracked="1"]') || document.querySelector('form');
          var formName = form ? (form.id || form.getAttribute('name') || 'form') : 'form';
          track('contact_form_submit', { form_name: formName });
          track('generate_lead', { form_name: formName, lead_source: 'website_form' });
        }
      }
    }
  });
  successObserver.observe(document.documentElement, { childList: true, subtree: true });

  // --- 8. Scroll depth (25/50/75/90) ---
  var fired = { 25: false, 50: false, 75: false, 90: false };
  function onScroll() {
    var h = document.documentElement;
    var max = (h.scrollHeight - h.clientHeight);
    if (max <= 0) return;
    var pct = (h.scrollTop || document.body.scrollTop) / max * 100;
    Object.keys(fired).forEach(function (k) {
      if (!fired[k] && pct >= +k) { fired[k] = true; track('scroll_' + k, { percent: +k }); }
    });
  }
  var scheduled = false;
  window.addEventListener('scroll', function () {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(function () { onScroll(); scheduled = false; });
  }, { passive: true });
})();
