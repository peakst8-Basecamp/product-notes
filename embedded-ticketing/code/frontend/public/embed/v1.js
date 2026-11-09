/*!
 * peakst8 Embed v1 — replaces a KonfHub-style registration iframe on an
 * organiser's own site.
 *
 *   <div data-peakst8-event="EVENT_ID" data-mode="passes"></div>
 *   <script src="https://ps8.club/embed/v1.js" async></script>
 *
 * Modes: "button" (one Register button) or "passes" (pass list with live
 * early-bird and bulk prices). Add data-checkout="tab" to open checkout in a
 * new tab instead of the overlay. Both render into the host page's own DOM, so
 * the race name, dates and prices are part of the organiser's page. Checkout
 * opens as an overlay on the same page and runs on peakst8 (details, email
 * OTP, Razorpay). Booking events are forwarded to the host's GA4 / Meta pixel.
 *
 * No dependencies, no build step. Keep it ES2017 so it runs on old Safari.
 */
(function () {
  'use strict';
  if (window.__peakst8EmbedLoaded) return;
  window.__peakst8EmbedLoaded = true;

  var script = document.currentScript;
  var SRC = script && script.src ? new URL(script.src) : new URL('https://ps8.club/embed/v1.js');
  var APP_ORIGIN = (script && script.getAttribute('data-app-origin')) || SRC.origin;
  var API_ORIGIN = (script && script.getAttribute('data-api-origin')) || 'https://api.ps8.club';
  var STYLE_ID = 'peakst8-embed-style';

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var css =
      '.p8e{--p8e-accent:#0469d4;--p8e-ink:#111;--p8e-muted:#666;--p8e-line:rgba(0,0,0,.12);font:inherit;color:inherit;display:grid;gap:10px;max-width:640px}' +
      '.p8e-pass{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:14px 16px;border:1px solid var(--p8e-line);border-radius:12px}' +
      '.p8e-pass b{display:block;font-size:1.02em}' +
      '.p8e-pass small{display:block;opacity:.7;font-size:.86em;line-height:1.4}' +
      '.p8e-price{text-align:right;white-space:nowrap}' +
      '.p8e-price s{opacity:.55;font-size:.86em;margin-right:6px}' +
      '.p8e-tag{display:inline-block;margin-top:4px;font-size:.78em;font-weight:600;padding:2px 8px;border-radius:999px;background:color-mix(in srgb,var(--p8e-accent) 14%,transparent);color:var(--p8e-accent)}' +
      '.p8e-btn{appearance:none;border:0;cursor:pointer;font:inherit;font-weight:600;padding:12px 20px;border-radius:10px;background:var(--p8e-accent);color:#fff}' +
      '.p8e-btn[disabled]{opacity:.5;cursor:not-allowed}' +
      '.p8e-bulk{font-size:.9em;opacity:.8}' +
      '.p8e-err{font-size:.9em;opacity:.75}' +
      '.p8e-by{font-size:.78em;opacity:.55}' +
      '.p8e-ov{position:fixed;inset:0;z-index:2147483646;background:rgba(0,0,0,.6);display:flex;align-items:flex-end;justify-content:center}' +
      '@media(min-width:720px){.p8e-ov{align-items:center}}' +
      '.p8e-sheet{position:relative;width:100%;max-width:480px;height:92vh;background:#050506;border-radius:24px 24px 0 0;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.5)}' +
      '@media(min-width:720px){.p8e-sheet{height:min(860px,92vh);border-radius:24px}}' +
      '.p8e-sheet iframe{border:0;width:100%;height:100%;display:block}' +
      '.p8e-x{position:absolute;top:10px;right:10px;z-index:1;width:36px;height:36px;border-radius:999px;border:0;background:rgba(255,255,255,.12);color:#fff;font-size:20px;line-height:1;cursor:pointer}';
    var el = document.createElement('style');
    el.id = STYLE_ID;
    el.textContent = css;
    document.head.appendChild(el);
  }

  function rupees(paise) {
    var n = Math.round(paise) / 100;
    return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: n % 1 ? 2 : 0 });
  }

  function text(tag, cls, value) {
    var el = document.createElement(tag);
    if (cls) el.className = cls;
    if (value != null) el.textContent = value;
    return el;
  }

  function track(cfg, name, data) {
    var t = (cfg && cfg.tracking) || {};
    try {
      if (t.ga4MeasurementId && typeof window.gtag === 'function') {
        var ga = { send_to: t.ga4MeasurementId, currency: 'INR' };
        if (data && data.value != null) ga.value = data.value / 100;
        if (data && data.transactionId) ga.transaction_id = data.transactionId;
        window.gtag('event', name, ga);
      }
      if (t.metaPixelId && typeof window.fbq === 'function') {
        var map = { view_item: 'ViewContent', begin_checkout: 'InitiateCheckout', purchase: 'Purchase' };
        if (map[name]) window.fbq('track', map[name], data && data.value != null ? { value: data.value / 100, currency: 'INR' } : {});
      }
    } catch (e) {
      /* never break the host page over analytics */
    }
    try {
      window.dispatchEvent(new CustomEvent('peakst8:' + name, { detail: data || {} }));
    } catch (e) {
      /* old browsers */
    }
  }

  var overlay = null;
  function closeCheckout() {
    if (!overlay) return;
    overlay.remove();
    overlay = null;
    document.documentElement.style.overflow = '';
  }

  function openCheckout(cfg, passId, quantity) {
    closeCheckout();
    var url = new URL(cfg.checkoutUrl || APP_ORIGIN + '/event/' + encodeURIComponent(cfg.event.id));
    if (checkoutInTab) {
      // Fallback for sites or browsers that block third-party sign-in inside iframes.
      url.searchParams.set('register', '1');
      if (passId) url.searchParams.set('pass', passId);
      window.open(url.toString(), '_blank', 'noopener');
      track(cfg, 'begin_checkout', { passId: passId || null });
      return;
    }
    url.searchParams.set('embed', '1');
    url.searchParams.set('register', '1');
    url.searchParams.set('host', location.origin);
    if (passId) url.searchParams.set('pass', passId);
    if (quantity && quantity > 1) url.searchParams.set('qty', String(quantity));
    var params = new URLSearchParams(location.search);
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'coupon', 'club'].forEach(function (k) {
      if (params.get(k)) url.searchParams.set(k, params.get(k));
    });

    overlay = text('div', 'p8e-ov');
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Register for ' + cfg.event.name);
    var sheet = text('div', 'p8e-sheet');
    var x = text('button', 'p8e-x', '×');
    x.type = 'button';
    x.setAttribute('aria-label', 'Close registration');
    x.addEventListener('click', closeCheckout);
    var frame = document.createElement('iframe');
    frame.src = url.toString();
    frame.title = 'peakst8 checkout';
    frame.allow = 'payment';
    sheet.appendChild(x);
    sheet.appendChild(frame);
    overlay.appendChild(sheet);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeCheckout();
    });
    document.body.appendChild(overlay);
    document.documentElement.style.overflow = 'hidden';
    x.focus();
    track(cfg, 'begin_checkout', { passId: passId || null });
  }

  window.addEventListener('message', function (e) {
    if (e.origin !== APP_ORIGIN || !e.data || e.data.source !== 'peakst8-embed') return;
    var cfg = e.data.config || current;
    if (e.data.type === 'close') closeCheckout();
    if (e.data.type === 'purchase') track(cfg, 'purchase', e.data.payload);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeCheckout();
  });

  var current = null;
  var checkoutInTab = false;

  function renderButton(root, cfg) {
    var btn = text('button', 'p8e-btn', (cfg.brand && cfg.brand.buttonLabel) || 'Register');
    btn.type = 'button';
    btn.disabled = !cfg.event.openForRegistration;
    btn.addEventListener('click', function () {
      openCheckout(cfg);
    });
    root.appendChild(btn);
  }

  function renderPasses(root, cfg) {
    cfg.passes.forEach(function (p) {
      var row = text('div', 'p8e-pass');
      var left = text('div');
      left.appendChild(text('b', null, p.name));
      if (p.description) left.appendChild(text('small', null, p.description));
      if (p.tier) left.appendChild(text('span', 'p8e-tag', p.tier.label));
      var right = text('div', 'p8e-price');
      var price = text('div');
      if (p.listPricePaise > p.pricePaise) price.appendChild(text('s', null, rupees(p.listPricePaise)));
      price.appendChild(text('b', null, p.pricePaise === 0 ? 'Free' : rupees(p.pricePaise)));
      right.appendChild(price);
      var btn = text('button', 'p8e-btn', p.soldOut ? 'Sold out' : (cfg.brand && cfg.brand.buttonLabel) || 'Register');
      btn.type = 'button';
      btn.disabled = p.soldOut || !cfg.event.openForRegistration;
      btn.style.marginTop = '8px';
      btn.addEventListener('click', function () {
        openCheckout(cfg, p.id);
      });
      right.appendChild(btn);
      row.appendChild(left);
      row.appendChild(right);
      root.appendChild(row);
    });
    if (cfg.bulk) {
      root.appendChild(
        text('div', 'p8e-bulk', cfg.bulk.percentOff + '% off when you book ' + cfg.bulk.minQuantity + ' or more entries together.'),
      );
    }
  }

  function mount(root) {
    if (root.__p8e) return;
    root.__p8e = true;
    var eventId = root.getAttribute('data-peakst8-event');
    var mode = root.getAttribute('data-mode') || 'button';
    if (root.getAttribute('data-checkout') === 'tab') checkoutInTab = true;
    injectStyle();
    root.classList.add('p8e');
    fetch(API_ORIGIN + '/embed/v1/events/' + encodeURIComponent(eventId), { credentials: 'omit' })
      .then(function (r) {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then(function (body) {
        var cfg = body.data || body;
        current = cfg;
        if (cfg.brand && cfg.brand.accentColor) root.style.setProperty('--p8e-accent', cfg.brand.accentColor);
        root.textContent = '';
        if (mode === 'passes' && cfg.passes && cfg.passes.length) renderPasses(root, cfg);
        else renderButton(root, cfg);
        var by = text('a', 'p8e-by', 'Tickets by peakst8');
        by.href = 'https://ps8.club';
        by.target = '_blank';
        by.rel = 'noopener';
        root.appendChild(by);
        track(cfg, 'view_item', {});
      })
      .catch(function () {
        root.textContent = '';
        var fallback = text('a', 'p8e-btn', 'Register on peakst8');
        fallback.href = APP_ORIGIN + '/event/' + encodeURIComponent(eventId);
        fallback.target = '_blank';
        fallback.rel = 'noopener';
        root.appendChild(fallback);
      });
  }

  function mountAll() {
    var nodes = document.querySelectorAll('[data-peakst8-event]');
    for (var i = 0; i < nodes.length; i++) mount(nodes[i]);
  }

  window.peakst8Embed = { mount: mountAll, open: function (passId) { if (current) openCheckout(current, passId); } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountAll);
  else mountAll();
})();
