/* Ensign Intelligence — overlay client.
   States: unlock → loader → conversation → review (or returning) */
(function () {
  "use strict";

  // Hidden on production until approved — active on localhost and Vercel preview URLs.
  // Production (ensignksa.com) still bails out so the chat stays gated until launch.
  {
    const h = location.hostname;
    const allowed = /^(localhost|127\.0\.0\.1)$/.test(h) || /\.vercel\.app$/.test(h);
    if (!allowed) return;
  }

  const STORAGE_KEY = "ensign_intel_completed";
  const STORAGE_LANG_KEY = "ensign_intel_lang";
  const BOOKING_URL = "https://cal.com/ensign-ai-agency-q4mmzg/30min";
  const CONTACT_EMAIL = "contact@ensignksa.com";

  const S = window.EnsignIntelStrings;

  // ----- Language detection -----
  function detectLang() {
    const explicit = localStorage.getItem(STORAGE_LANG_KEY);
    if (explicit === "ar" || explicit === "en") return explicit;
    const path = window.location.pathname || "";
    if (path.startsWith("/ar") || path.includes("/ar/")) return "ar";
    const htmlLang = (document.documentElement.lang || "").toLowerCase();
    if (htmlLang.startsWith("ar")) return "ar";
    const nav = (navigator.language || "").toLowerCase();
    if (nav.startsWith("ar")) return "ar";
    return "en";
  }

  // ----- DOM helpers -----
  function el(tag, attrs = {}, children = []) {
    const node = document.createElement(tag);
    for (const k in attrs) {
      if (k === "class") node.className = attrs[k];
      else if (k === "html") node.innerHTML = attrs[k];
      else if (k === "text") node.textContent = attrs[k];
      else if (k.startsWith("on") && typeof attrs[k] === "function") node.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] !== false && attrs[k] !== null && attrs[k] !== undefined) node.setAttribute(k, attrs[k]);
    }
    (Array.isArray(children) ? children : [children]).forEach((c) => {
      if (c == null || c === false) return;
      node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return node;
  }

  function svg(d) {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  }

  // ----- Singleton overlay state -----
  let root = null;
  let lang = detectLang();
  let session = null;
  let busy = false;

  // ----- Fonts: load IBM Plex Sans Arabic lazily when AR is needed -----
  let fontsLoaded = { ar: false };
  function ensureFonts(forLang) {
    if (forLang === "ar" && !fontsLoaded.ar) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&display=swap";
      document.head.appendChild(link);
      fontsLoaded.ar = true;
    }
  }

  // ----- Build overlay shell once -----
  function ensureRoot() {
    if (root) return root;
    root = el("div", { class: "ei-root", "aria-modal": "true", role: "dialog", id: "ei-root" });
    root.appendChild(el("div", { class: "ei-backdrop", onclick: handleBackdropClick }));
    root.appendChild(el("div", { class: "ei-stage", id: "ei-stage" }));
    document.body.appendChild(root);
    return root;
  }

  function handleBackdropClick(e) {
    if (e.target.classList.contains("ei-backdrop")) {
      // Only allow closing when not mid-conversation
      if (!session || session.completed) closeOverlay();
    }
  }

  function applyLangAttrs() {
    ensureFonts(lang);
    root.setAttribute("dir", S[lang].dir);
    root.setAttribute("lang", lang);
  }

  // ----- Render: stages -----
  function clearStage() {
    document.getElementById("ei-stage").innerHTML = "";
  }

  function renderHeader() {
    const t = S[lang];
    const header = el("div", { class: "ei-header" });

    const left = el("div", { class: "ei-mark" }, [
      el("span", { class: "ei-mark-dot" }),
      el("span", { text: t.overlay.mark }),
    ]);

    const right = el("div", { class: "ei-header-actions" });

    const langSwitch = el("div", { class: "ei-lang-switch", role: "group", "aria-label": "Language" }, [
      el("button", {
        type: "button",
        "aria-pressed": lang === "ar" ? "true" : "false",
        onclick: () => switchLang("ar"),
        text: "العربية",
      }),
      el("span", { class: "ei-lang-sep" }),
      el("button", {
        type: "button",
        "aria-pressed": lang === "en" ? "true" : "false",
        onclick: () => switchLang("en"),
        text: "English",
      }),
    ]);
    right.appendChild(langSwitch);

    const close = el("button", {
      class: "ei-close",
      type: "button",
      "aria-label": t.overlay.close,
      onclick: () => {
        if (session && !session.completed) {
          const confirmText = lang === "ar"
            ? "هل تريد إغلاق الجلسة؟ التقدم سيُحفظ مؤقتًا."
            : "Close this session? Your progress will be paused.";
          if (!confirm(confirmText)) return;
        }
        closeOverlay();
      },
      html: svg('<path d="M6 6 18 18 M18 6 6 18"/>'),
    });
    right.appendChild(close);

    header.appendChild(left);
    header.appendChild(right);
    return header;
  }

  function switchLang(newLang) {
    if (newLang === lang) return;
    if (session && !session.completed && session.messages && session.messages.length > 1) {
      const confirmText = newLang === "ar"
        ? "تبديل اللغة سيعيد بدء الجلسة. هل تريد المتابعة؟"
        : "Switching language will restart the session. Continue?";
      if (!confirm(confirmText)) return;
      session = null;
    }
    lang = newLang;
    localStorage.setItem(STORAGE_LANG_KEY, lang);
    applyLangAttrs();
    // Re-render current screen
    if (session && session.completed && session.review) {
      renderReview(session.review, session.labels);
    } else if (session && session.id) {
      // Mid-session: we restarted above; show unlock
      renderUnlock();
    } else {
      renderUnlock();
    }
  }

  // ----- Unlock -----
  function renderUnlock() {
    clearStage();
    const stage = document.getElementById("ei-stage");
    stage.appendChild(renderHeader());

    const t = S[lang].unlock;
    const wrap = el("div", { class: "ei-panel-scroll" });
    const inner = el("div", { class: "ei-unlock" });

    inner.appendChild(el("div", { class: "ei-eyebrow", text: t.eyebrow }));
    inner.appendChild(el("h1", { class: "ei-display", text: t.headline }));
    inner.appendChild(el("p", { class: "ei-sub", text: t.sub }));

    const form = el("form", { class: "ei-form", id: "ei-form", onsubmit: onUnlockSubmit, novalidate: "true" });

    const nameField = field("name", t.name, el("input", {
      class: "ei-input", id: "ei-name", type: "text", name: "name",
      placeholder: t.namePlaceholder, autocomplete: "name", required: "true",
    }));

    const emailField = field("email", t.email, el("input", {
      class: "ei-input", id: "ei-email", type: "email", name: "email",
      placeholder: t.emailPlaceholder, autocomplete: "email", required: "true",
    }));

    const phoneField = field("phone", t.phone, el("input", {
      class: "ei-input", id: "ei-phone", type: "tel", name: "phone",
      placeholder: t.phonePlaceholder, autocomplete: "tel", required: "true",
      inputmode: "tel",
    }));

    const industrySelect = el("select", { class: "ei-select", id: "ei-industry", name: "industry", required: "true" });
    industrySelect.appendChild(el("option", { value: "", disabled: "true", selected: "true", text: t.industryPlaceholder }));
    t.industries.forEach((i) => industrySelect.appendChild(el("option", { value: i, text: i })));
    const industryField = field("industry", t.industry, industrySelect);

    const row1 = el("div", { class: "ei-form-row" }, [nameField, emailField]);
    const row2 = el("div", { class: "ei-form-row" }, [phoneField, industryField]);

    form.appendChild(row1);
    form.appendChild(row2);

    // Privacy paragraph with embedded link to the privacy policy.
    const privacyP = el("p", { class: "ei-consent" });
    privacyP.appendChild(document.createTextNode(t.privacyLead + " "));
    privacyP.appendChild(el("a", {
      class: "ei-consent-link",
      href: t.privacyLinkHref,
      target: "_blank",
      rel: "noopener",
      text: t.privacyLinkText,
    }));
    privacyP.appendChild(document.createTextNode(t.privacyTrailing || ""));
    form.appendChild(privacyP);

    const submit = el("button", { class: "ei-submit", type: "submit", id: "ei-submit" }, [
      el("span", { text: t.submit }),
      el("span", { class: "ei-arrow", html: svg('<path d="M5 12h14M13 5l7 7-7 7"/>'), style: "width:18px;height:18px;display:inline-flex;" }),
    ]);
    form.appendChild(submit);

    inner.appendChild(form);
    inner.appendChild(el("div", { class: "ei-note", text: t.note }));
    inner.appendChild(el("div", { class: "ei-error", id: "ei-error" }));

    wrap.appendChild(inner);
    stage.appendChild(wrap);

    setTimeout(() => document.getElementById("ei-name")?.focus(), 400);
  }

  function field(id, label, input) {
    return el("div", { class: "ei-field" }, [
      el("label", { class: "ei-label", for: `ei-${id}`, text: label }),
      input,
    ]);
  }

  async function onUnlockSubmit(e) {
    e.preventDefault();
    if (busy) return;
    const err = document.getElementById("ei-error");
    err.textContent = "";

    const payload = {
      lang,
      name: document.getElementById("ei-name").value.trim(),
      email: document.getElementById("ei-email").value.trim(),
      phone: document.getElementById("ei-phone").value.trim(),
      industry: document.getElementById("ei-industry").value,
    };

    if (!payload.name || !payload.email || !payload.phone || !payload.industry) {
      err.textContent = S[lang].unlock.errorFields;
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(payload.email)) {
      err.textContent = S[lang].unlock.errorEmail;
      return;
    }
    if (((payload.phone.match(/\d/g) || []).length) < 7) {
      err.textContent = S[lang].unlock.errorPhone || S[lang].unlock.errorFields;
      return;
    }

    busy = true;
    document.getElementById("ei-submit").disabled = true;

    renderLoader();

    try {
      const res = await fetch("/api/intelligence/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.status === 409 && data.error === "already_completed") {
        localStorage.setItem(STORAGE_KEY, "1");
        await wait(2200);
        renderReturning();
        busy = false;
        return;
      }
      if (!res.ok) {
        await wait(800);
        renderUnlock();
        setTimeout(() => {
          const e2 = document.getElementById("ei-error");
          if (e2) e2.textContent = S[lang].unlock.errorGeneric;
        }, 50);
        busy = false;
        return;
      }

      session = {
        id: data.sessionId,
        lang: data.lang,
        profile: payload,
        messages: [{ role: "assistant", content: data.firstMessage }],
        turn: 0,
        maxTurns: data.maxTurns || 10,
        signals: {},
        completed: false,
        selectedIntelligence: null,
        mode: null, // set by the mode picker (chat | voice)
      };
      // Wait until the staged loader finishes its arc.
      await wait(2200);
      renderModePicker();
    } catch (e3) {
      console.error(e3);
      await wait(800);
      renderUnlock();
      setTimeout(() => {
        const e2 = document.getElementById("ei-error");
        if (e2) e2.textContent = S[lang].unlock.errorGeneric;
      }, 50);
    } finally {
      busy = false;
    }
  }

  // ----- Loader -----
  function renderLoader() {
    clearStage();
    const stage = document.getElementById("ei-stage");
    stage.appendChild(renderHeader());

    const t = S[lang].loader;
    const wrap = el("div", { class: "ei-panel-scroll" });
    const inner = el("div", { class: "ei-loader" });
    inner.appendChild(el("div", { class: "ei-loader-glow", "aria-hidden": "true" }));

    const lines = el("div", { class: "ei-loader-lines" });
    const l1 = el("div", { class: "ei-loader-line", text: t.line1 });
    const l2 = el("div", { class: "ei-loader-line", text: t.line2 });
    const l3 = el("div", { class: "ei-loader-line", text: t.line3 });
    lines.appendChild(l1); lines.appendChild(l2); lines.appendChild(l3);
    inner.appendChild(lines);

    wrap.appendChild(inner);
    stage.appendChild(wrap);

    // Stagger
    setTimeout(() => { l1.classList.add("is-visible", "is-active"); }, 100);
    setTimeout(() => { l1.classList.remove("is-active"); l1.classList.add("is-done"); l2.classList.add("is-visible", "is-active"); }, 900);
    setTimeout(() => { l2.classList.remove("is-active"); l2.classList.add("is-done"); l3.classList.add("is-visible", "is-active"); }, 1700);
  }

  // ----- Mode picker (Chat / Voice) — shown after the form, before the chat -----
  function renderModePicker() {
    clearStage();
    const stage = document.getElementById("ei-stage");
    stage.appendChild(renderHeader());

    const t = S[lang].ready || {};
    const wrap = el("div", { class: "ei-panel-scroll" });
    const inner = el("div", { class: "ei-mode-picker" });
    inner.appendChild(el("div", { class: "ei-eyebrow", text: t.eyebrow || "READY" }));
    inner.appendChild(el("h1", { class: "ei-display", text: t.headline || "Choose how you'd like to start." }));
    if (t.sub) inner.appendChild(el("p", { class: "ei-sub", text: t.sub }));

    const grid = el("div", { class: "ei-mode-grid" });

    const chatBtn = el("button", { class: "ei-mode-card", type: "button" }, [
      el("div", { class: "ei-mode-card-title", text: t.chat || "Start Chat" }),
      el("div", { class: "ei-mode-card-hint", text: t.chatHint || "Type and read" }),
    ]);
    chatBtn.addEventListener("click", () => {
      if (session) session.mode = "chat";
      renderConversation();
    });

    const voiceBtn = el("button", { class: "ei-mode-card ei-mode-card--accent", type: "button" }, [
      el("div", { class: "ei-mode-card-title", text: t.voice || "Start Voice" }),
      el("div", { class: "ei-mode-card-hint", text: t.voiceHint || "Speak and listen" }),
    ]);
    voiceBtn.addEventListener("click", () => {
      if (session) session.mode = "voice";
      renderVoiceIntro();
    });

    grid.appendChild(chatBtn);
    grid.appendChild(voiceBtn);
    inner.appendChild(grid);
    wrap.appendChild(inner);
    stage.appendChild(wrap);
  }

  // ----- Voice intro: mic readiness note + start button -----
  function renderVoiceIntro() {
    clearStage();
    const stage = document.getElementById("ei-stage");
    stage.appendChild(renderHeader());

    const t = S[lang].voice || {};
    const wrap = el("div", { class: "ei-panel-scroll" });
    const inner = el("div", { class: "ei-mode-picker" });
    inner.appendChild(el("div", { class: "ei-eyebrow", text: t.eyebrow || "VOICE" }));
    inner.appendChild(el("h1", { class: "ei-display", text: t.headline || "Make sure your microphone is working." }));
    if (t.sub) inner.appendChild(el("p", { class: "ei-sub", text: t.sub }));

    const row = el("div", { class: "ei-mode-actions" });
    const startBtn = el("button", { class: "ei-submit", type: "button" }, [
      el("span", { text: t.start || "Start Voice Experience" }),
    ]);
    startBtn.addEventListener("click", startVoiceExperience);
    const fallbackBtn = el("button", { class: "ei-mode-link", type: "button", text: t.switchToChat || "Switch to chat" });
    fallbackBtn.addEventListener("click", () => {
      if (session) session.mode = "chat";
      renderConversation();
    });

    row.appendChild(startBtn);
    row.appendChild(fallbackBtn);
    inner.appendChild(row);
    wrap.appendChild(inner);
    stage.appendChild(wrap);
  }

  // ----- Voice experience — browser-native Web Speech API with chat fallback -----
  // 3-minute soft limit. Never abrupt; nudges user toward Book a Call near the end.
  async function startVoiceExperience() {
    const t = S[lang].voice || {};
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      if (session) session.mode = "chat";
      renderConversation();
      const thread = document.getElementById("ei-thread");
      if (thread) appendMessage("assistant", t.unsupported || "Voice isn't available in this browser. Continuing in chat instead.");
      return;
    }

    try {
      const ms = await navigator.mediaDevices.getUserMedia({ audio: true });
      ms.getTracks().forEach((tr) => tr.stop()); // we just needed the permission
    } catch (_e) {
      if (session) session.mode = "chat";
      renderConversation();
      const thread = document.getElementById("ei-thread");
      if (thread) appendMessage("assistant", t.permissionDenied || "Microphone access was blocked. Continuing in chat instead.");
      return;
    }

    // Render the voice surface
    clearStage();
    const stage = document.getElementById("ei-stage");
    stage.appendChild(renderHeader());

    const wrap = el("div", { class: "ei-panel-scroll" });
    const inner = el("div", { class: "ei-voice-surface" });

    const status = el("div", { class: "ei-voice-status", id: "ei-voice-status", text: t.idleHint || "Tap the mic to speak." });
    const transcript = el("div", { class: "ei-voice-transcript", id: "ei-voice-transcript" });
    const micBtn = el("button", { class: "ei-voice-mic", id: "ei-voice-mic", type: "button", "aria-label": t.listening || "Mic" });
    micBtn.appendChild(el("span", { class: "ei-voice-mic-dot" }));

    const actions = el("div", { class: "ei-voice-actions" });
    const bookBtn = el("a", {
      class: "ei-voice-book is-hidden",
      id: "ei-voice-book",
      href: "https://cal.com/ensign-ai-agency-q4mmzg/30min",
      target: "_blank",
      rel: "noopener",
      text: (S[lang].bookCTA || t.bookCTA || "Book a Call With Ensign"),
    });
    const switchToChat = el("button", { class: "ei-mode-link", type: "button", text: t.switchToChat || "Switch to chat" });
    switchToChat.addEventListener("click", () => {
      voiceTeardown();
      if (session) session.mode = "chat";
      renderConversation();
    });

    actions.appendChild(bookBtn);
    actions.appendChild(switchToChat);

    inner.appendChild(status);
    inner.appendChild(transcript);
    inner.appendChild(micBtn);
    inner.appendChild(actions);
    wrap.appendChild(inner);
    stage.appendChild(wrap);

    // ── Recognition + synthesis ──
    const rec = new SR();
    rec.lang = lang === "ar" ? "ar-SA" : "en-US";
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;

    let currentUtterance = "";
    let listening = false;
    let bookCTAShown = false;

    voiceState = { rec, started: Date.now(), softLimitFired: false, hardLimitFired: false, timer: null, teardown: voiceTeardown };

    function setStatus(text) {
      const s = document.getElementById("ei-voice-status");
      if (s) s.textContent = text;
    }
    function appendTranscript(role, content) {
      const elNode = el("div", { class: "ei-voice-line ei-voice-line--" + role });
      elNode.appendChild(el("span", { class: "ei-voice-role", text: role === "user" ? S[lang].chat.fromUser : S[lang].chat.fromAI }));
      elNode.appendChild(el("span", { class: "ei-voice-text", text: content }));
      transcript.appendChild(elNode);
      transcript.scrollTop = transcript.scrollHeight;
    }
    function showBookCTA() {
      if (bookCTAShown) return;
      const b = document.getElementById("ei-voice-book");
      if (b) b.classList.remove("is-hidden");
      bookCTAShown = true;
    }

    rec.onstart = () => {
      listening = true;
      micBtn.classList.add("is-listening");
      setStatus(t.listening || "Listening…");
    };
    rec.onresult = (ev) => {
      let finalText = "";
      let interim = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const r = ev.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interim += r[0].transcript;
      }
      currentUtterance = (finalText + interim).trim();
      const s = document.getElementById("ei-voice-status");
      if (s && currentUtterance) s.textContent = "“" + currentUtterance + "”";
    };
    rec.onerror = (ev) => {
      console.warn("[voice] recognition error", ev.error);
      listening = false;
      micBtn.classList.remove("is-listening");
      setStatus(t.idleHint || "Tap the mic to speak.");
    };
    rec.onend = async () => {
      listening = false;
      micBtn.classList.remove("is-listening");
      const userText = (currentUtterance || "").trim();
      currentUtterance = "";
      if (!userText) {
        setStatus(t.idleHint || "Tap the mic to speak.");
        return;
      }
      appendTranscript("user", userText);
      setStatus(t.thinking || "Thinking…");
      try {
        const replyText = await sendVoiceTurn(userText);
        appendTranscript("assistant", replyText);
        speakOut(replyText);
      } catch (e) {
        console.error("[voice] turn error", e);
        setStatus(t.idleHint || "Tap the mic to speak.");
      }
    };

    function speakOut(text) {
      try {
        const synth = window.speechSynthesis;
        if (!synth) { setStatus(t.idleHint || "Tap the mic to speak."); return; }
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = lang === "ar" ? "ar-SA" : "en-US";
        utter.rate = 1.0;
        utter.pitch = 1.0;
        utter.onstart = () => setStatus(t.speaking || "Speaking…");
        utter.onend = () => setStatus(t.idleHint || "Tap the mic to speak.");
        synth.cancel();
        synth.speak(utter);
      } catch (_) {
        setStatus(t.idleHint || "Tap the mic to speak.");
      }
    }

    micBtn.addEventListener("click", () => {
      if (listening) {
        try { rec.stop(); } catch (_) {}
        return;
      }
      try { rec.start(); } catch (_) { /* already started */ }
    });

    // ── 3-minute soft limit ──
    const softLimitMs = 2 * 60 * 1000 + 30 * 1000; // 2:30 — gentle escalation
    const hardLimitMs = 3 * 60 * 1000;             // 3:00 — surface CTA prominently
    voiceState.timer = setInterval(() => {
      const elapsed = Date.now() - voiceState.started;
      if (!voiceState.softLimitFired && elapsed >= softLimitMs) {
        voiceState.softLimitFired = true;
        const line = t.softLimit || "This is where the real implementation starts. A short call with our team would let us map the right agent, workflow, and integration around your business.";
        appendTranscript("assistant", line);
        speakOut(line);
        showBookCTA();
      }
      if (!voiceState.hardLimitFired && elapsed >= hardLimitMs) {
        voiceState.hardLimitFired = true;
        showBookCTA();
        const b = document.getElementById("ei-voice-book");
        if (b) b.classList.add("is-prominent");
      }
    }, 5000);
  }

  // Cleanup for voice session
  let voiceState = null;
  function voiceTeardown() {
    if (!voiceState) return;
    try { voiceState.rec?.abort?.(); } catch (_) {}
    try { window.speechSynthesis?.cancel?.(); } catch (_) {}
    if (voiceState.timer) clearInterval(voiceState.timer);
    voiceState = null;
  }

  // Voice-specific send (parallels sendMessage but lighter — no chat-thread DOM)
  async function sendVoiceTurn(userText) {
    session.messages.push({ role: "user", content: userText });
    const res = await fetch("/api/intelligence/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: session.id,
        message: userText,
        selectedIntelligence: session.selectedIntelligence || null,
        mode: "voice",
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "request_failed");
    session.turn = data.turn;
    if (data.signal) session.signals[data.signal.key] = data.signal.value;
    session.messages.push({ role: "assistant", content: data.reply });
    return data.reply;
  }

  // ----- Conversation -----
  function renderConversation() {
    clearStage();
    const stage = document.getElementById("ei-stage");
    stage.appendChild(renderHeader());

    const body = el("div", { class: "ei-body" });

    // Rail
    const rail = el("div", { class: "ei-panel ei-panel-rail" });
    const railInner = el("div", { class: "ei-rail" });
    railInner.appendChild(el("div", { class: "ei-rail-eyebrow", text: S[lang].modules.heading }));
    railInner.appendChild(module("business_context"));
    railInner.appendChild(module("growth_signal"));
    railInner.appendChild(module("intelligence_depth"));
    railInner.appendChild(module("recommended_direction"));
    rail.appendChild(railInner);

    // Main column
    const main = el("div", { class: "ei-panel-main" });

    const thread = el("div", { class: "ei-thread", id: "ei-thread" });

    // One adaptive intelligence — no lens grid, no tool selection.
    // Render existing session messages directly into the local thread element
    // BEFORE it's appended to the DOM. (appendMessage() uses getElementById and
    // would return null at this point, so build bubbles inline here.)
    session.messages.forEach((m) => {
      const fromLabel = m.role === "assistant" ? S[lang].chat.fromAI : S[lang].chat.fromUser;
      const msg = el("div", { class: `ei-msg ei-msg--${m.role === "assistant" ? "ai" : "user"}` }, [
        el("div", { class: "ei-msg-from", text: fromLabel }),
        el("div", { class: "ei-msg-body", dir: "auto" }, [document.createTextNode(m.content)]),
      ]);
      msg.style.animation = "none";
      thread.appendChild(msg);
    });

    main.appendChild(thread);

    // (Turn-counter UI removed — conversations are open-ended now.)

    const input = el("div", { class: "ei-input-bar" });
    const lensRequired = false; // One adaptive intelligence — input is unlocked from the start.
    const ta = el("textarea", {
      class: "ei-textarea",
      id: "ei-textarea",
      placeholder: S[lang].chat.placeholder,
      rows: "1",
      "aria-label": S[lang].chat.placeholder,
      onkeydown: (e) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
      },
      oninput: (e) => {
        e.target.style.height = "auto";
        e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px";
      },
    });
    if (lensRequired) {
      ta.disabled = true;
      input.classList.add("is-locked");
    }
    const sendBtn = el("button", {
      class: "ei-send", id: "ei-send", type: "button",
      "aria-label": S[lang].chat.send,
      onclick: sendMessage,
      html: svg('<path d="M5 12h14M13 5l7 7-7 7"/>'),
    });
    if (lensRequired) sendBtn.disabled = true;
    input.appendChild(ta); input.appendChild(sendBtn);
    main.appendChild(input);

    body.appendChild(rail);
    body.appendChild(main);
    stage.appendChild(body);

    if (!lensRequired) setTimeout(() => ta.focus(), 300);
  }

  function renderHeroOpening() {
    const t = S[lang].hero;
    const hero = el("div", { class: "ei-hero", id: "ei-hero" });

    // Primary headline with accent word highlighted.
    const primary = el("h2", { class: "ei-hero-headline" });
    primary.innerHTML = highlightAccent(t.headlinePrimary, t.headlinePrimaryAccentWord);
    hero.appendChild(primary);

    // Secondary headline (the other language).
    const secondary = el("p", {
      class: "ei-hero-headline-alt",
      dir: lang === "ar" ? "ltr" : "rtl",
    });
    secondary.innerHTML = highlightAccent(t.headlineSecondary, t.headlineSecondaryAccentWord);
    hero.appendChild(secondary);

    hero.appendChild(el("p", { class: "ei-hero-sub", text: t.sub }));

    // Intelligence picker
    hero.appendChild(el("div", { class: "ei-chips-label", text: t.intelligenceLabel }));
    hero.appendChild(el("p", { class: "ei-intelligence-sub", text: t.intelligenceSub }));
    const grid = el("div", { class: "ei-intelligence-grid", role: "radiogroup", "aria-label": t.intelligenceLabel });
    t.intelligences.forEach((opt) => {
      const card = el("button", {
        type: "button",
        class: "ei-intelligence-card",
        role: "radio",
        "aria-checked": "false",
        "data-intel": opt.id,
        onclick: () => onIntelligenceSelect(opt, card),
      }, [
        el("span", { class: "ei-intelligence-title", text: opt.title }),
        el("span", { class: "ei-intelligence-desc", text: opt.desc }),
      ]);
      grid.appendChild(card);
    });
    hero.appendChild(grid);

    return hero;
  }

  async function onIntelligenceSelect(opt, cardEl) {
    if (!session) return;
    // Lock: first pick wins. Prevents double-firing of the opening.
    if (session.selectedIntelligence) return;
    session.selectedIntelligence = opt.id;

    // Mark active card
    const cards = document.querySelectorAll(".ei-intelligence-card");
    cards.forEach((c) => {
      const isThis = c === cardEl;
      c.classList.toggle("is-active", isThis);
      c.setAttribute("aria-checked", isThis ? "true" : "false");
      c.disabled = true;
    });

    // Update textarea placeholder + unlock the input bar
    const ta = document.getElementById("ei-textarea");
    const sendBtn = document.getElementById("ei-send");
    const inputBar = ta && ta.parentElement;
    if (ta && opt.placeholder) {
      ta.placeholder = opt.placeholder;
      ta.setAttribute("aria-label", opt.placeholder);
    }
    if (ta) ta.disabled = false;
    if (sendBtn) sendBtn.disabled = false;
    if (inputBar) inputBar.classList.remove("is-locked");

    // Let the activation glow register, then dismiss the hero and show the agent's opening.
    await wait(380);
    dismissHero();
    await wait(500);

    if (opt.opening) {
      // Brief typing indicator so it feels like the agent is thinking
      const thread = document.getElementById("ei-thread");
      if (thread) {
        const typing = el("div", { class: "ei-msg ei-msg--ai", id: "ei-typing-msg" }, [
          el("div", { class: "ei-msg-from", text: S[lang].chat.fromAI }),
          el("div", { class: "ei-msg-body" }, [el("span", { class: "ei-typing" })]),
        ]);
        thread.appendChild(typing);
        thread.scrollTop = thread.scrollHeight;
        await wait(750);
        typing.remove();
      }
      await typeOutMessage(opt.opening);
      session.messages.push({ role: "assistant", content: opt.opening });
    }

    if (ta) ta.focus();
  }

  function highlightAccent(text, accentWord) {
    if (!accentWord) return escapeHTML(text);
    const idx = text.indexOf(accentWord);
    if (idx < 0) return escapeHTML(text);
    return (
      escapeHTML(text.slice(0, idx)) +
      `<span class="ei-accent">${escapeHTML(accentWord)}</span>` +
      escapeHTML(text.slice(idx + accentWord.length))
    );
  }
  function escapeHTML(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  }

  function onChipClick(text, chipEl) {
    const ta = document.getElementById("ei-textarea");
    if (!ta) return;
    ta.value = text;
    ta.dispatchEvent(new Event("input", { bubbles: true }));
    ta.focus();
    if (chipEl) {
      chipEl.classList.add("is-selected");
      setTimeout(() => chipEl.classList.remove("is-selected"), 1200);
    }
  }

  function dismissHero() {
    const hero = document.getElementById("ei-hero");
    if (!hero) return;
    hero.classList.add("is-leaving");
    setTimeout(() => hero.remove(), 480);
  }

  function module(key) {
    const placeholder = S[lang].modules.placeholders?.[key] || "";
    const m = el("div", { class: "ei-module ei-module--pending", "data-key": key, id: `ei-module-${key}` }, [
      el("div", { class: "ei-module-label", text: S[lang].modules[key] }),
      el("div", { class: "ei-module-value", id: `ei-module-value-${key}` }, [
        el("span", { class: "ei-module-placeholder", text: placeholder }),
      ]),
    ]);
    return m;
  }

  function setModule(key, value) {
    const wrap = document.getElementById(`ei-module-${key}`);
    const v = document.getElementById(`ei-module-value-${key}`);
    if (!wrap || !v) return;
    v.textContent = value;
    wrap.classList.remove("ei-module--pending");
    wrap.classList.add("is-active");
  }

  function progressLabel(turn, max) {
    return `${S[lang].chat.turn} ${Math.min(turn + 1, max)} ${S[lang].chat.of} ${max}`;
  }

  function appendMessage(role, content, animate = true) {
    const thread = document.getElementById("ei-thread");
    if (!thread) return;
    const fromLabel = role === "assistant" ? S[lang].chat.fromAI : S[lang].chat.fromUser;
    const msg = el("div", { class: `ei-msg ei-msg--${role === "assistant" ? "ai" : "user"}` }, [
      el("div", { class: "ei-msg-from", text: fromLabel }),
      el("div", { class: "ei-msg-body", dir: "auto" }, [document.createTextNode(content)]),
    ]);
    if (!animate) msg.style.animation = "none";
    thread.appendChild(msg);
    thread.scrollTop = thread.scrollHeight;
  }

  async function sendMessage() {
    if (busy) return;
    const ta = document.getElementById("ei-textarea");
    const text = (ta.value || "").trim();
    if (!text) return;
    if (session.completed) return;

    ta.value = "";
    ta.style.height = "auto";
    busy = true;
    document.getElementById("ei-send").disabled = true;

    // First send: collapse the hero opening.
    dismissHero();

    appendMessage("user", text);
    session.messages.push({ role: "user", content: text });

    // Thinking indicator: cycling fade-in/out status lines while we wait.
    const thread = document.getElementById("ei-thread");
    const thinkingLine = el("span", { class: "ei-thinking-line", dir: "auto" });
    const typing = el("div", { class: "ei-msg ei-msg--ai ei-msg--thinking", id: "ei-typing-msg" }, [
      el("div", { class: "ei-msg-from", text: S[lang].chat.fromAI }),
      el("div", { class: "ei-msg-body" }, [thinkingLine]),
    ]);
    thread.appendChild(typing);
    thread.scrollTop = thread.scrollHeight;

    const phases = (S[lang].chat.thinkingPhases) || ["…"];
    let phaseIdx = 0;
    const setPhase = (text) => {
      thinkingLine.classList.remove("is-in");
      // double rAF to restart the fade animation
      requestAnimationFrame(() => requestAnimationFrame(() => {
        thinkingLine.textContent = text;
        thinkingLine.classList.add("is-in");
      }));
    };
    setPhase(phases[0]);
    const phaseTimer = setInterval(() => {
      phaseIdx = (phaseIdx + 1) % phases.length;
      setPhase(phases[phaseIdx]);
    }, 2800);

    // Client-side timeout fallback. Vercel function maxDuration is 60s; we give
    // a small buffer so the user sees a graceful retry prompt instead of a hang.
    const controller = new AbortController();
    const fetchTimer = setTimeout(() => controller.abort(), 70000);

    try {
      const res = await fetch("/api/intelligence/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          message: text,
          selectedIntelligence: session.selectedIntelligence || null,
          mode: session.mode || "chat",
        }),
        signal: controller.signal,
      });
      const data = await res.json();
      clearInterval(phaseTimer);
      clearTimeout(fetchTimer);
      typing.remove();
      if (!res.ok) throw new Error(data.error || "request_failed");

      session.turn = data.turn;

      if (data.signal) {
        setModule(data.signal.key, data.signal.value);
        session.signals[data.signal.key] = data.signal.value;
      }

      await typeOutMessage(data.reply);
      session.messages.push({ role: "assistant", content: data.reply });

      if (data.shouldComplete) {
        await wait(900);
        await completeSession();
      }
    } catch (err) {
      console.error(err);
      clearInterval(phaseTimer);
      clearTimeout(fetchTimer);
      const typingEl = document.getElementById("ei-typing-msg");
      if (typingEl) typingEl.remove();
      const isAbort = err && (err.name === "AbortError" || err.code === 20);
      const msg = isAbort
        ? (S[lang].chat.timeoutMessage || "Request timed out. Try again.")
        : (lang === "ar" ? "حدث خطأ مؤقت. حاول مرة أخرى." : "A temporary error occurred. Please try again.");
      appendMessage("assistant", msg);
    } finally {
      busy = false;
      const sb = document.getElementById("ei-send");
      if (sb) sb.disabled = false;
    }
  }

  function typeOutMessage(text) {
    // Cinematic reveal: insert full text, animate via CSS opacity sweep.
    // Immune to tab throttling; feels intentional, not slow.
    const thread = document.getElementById("ei-thread");
    const msg = el("div", { class: "ei-msg ei-msg--ai ei-msg--reveal" }, [
      el("div", { class: "ei-msg-from", text: S[lang].chat.fromAI }),
      el("div", { class: "ei-msg-body", dir: "auto" }, [document.createTextNode(text)]),
    ]);
    thread.appendChild(msg);
    thread.scrollTop = thread.scrollHeight;
    return wait(650);
  }

  async function completeSession() {
    const thread = document.getElementById("ei-thread");
    const note = el("div", { class: "ei-msg ei-msg--ai" }, [
      el("div", { class: "ei-msg-from", text: S[lang].chat.synthesizing }),
      el("div", { class: "ei-msg-body" }, [el("span", { class: "ei-typing" })]),
    ]);
    thread.appendChild(note);
    thread.scrollTop = thread.scrollHeight;

    try {
      const res = await fetch("/api/intelligence/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "complete_failed");
      session.completed = true;
      session.review = data.review;
      session.labels = data.labels;
      localStorage.setItem(STORAGE_KEY, "1");
      await wait(800);
      renderReview(data.review, data.labels);
    } catch (err) {
      console.error(err);
      note.remove();
      appendMessage("assistant", lang === "ar"
        ? "تعذّر إنشاء المراجعة الآن. تواصل مع إنساين لإكمال التحليل."
        : "Could not generate the review right now. Reach out to Ensign to complete the analysis.");
    }
  }

  // ----- Review -----
  function renderReview(review, labels) {
    clearStage();
    const stage = document.getElementById("ei-stage");
    stage.appendChild(renderHeader());

    const t = S[lang].review;
    const wrap = el("div", { class: "ei-panel-scroll" });
    const inner = el("div", { class: "ei-review" });

    inner.appendChild(el("div", { class: "ei-review-eyebrow", text: t.eyebrow }));
    inner.appendChild(el("h1", { class: "ei-review-title", text: t.title }));

    const sections = el("div", { class: "ei-review-sections" });
    const order = ["business_signal", "bottleneck", "ai_opportunity", "marketing_opportunity", "direction"];
    order.forEach((k) => {
      if (!review[k]) return;
      const sec = el("div", { class: "ei-review-section" }, [
        el("h3", { text: t.sections[k] }),
        el("p", { text: review[k] }),
      ]);
      sections.appendChild(sec);
    });
    inner.appendChild(sections);

    inner.appendChild(el("p", { class: "ei-review-closing", text: t.closing }));

    const ctas = el("div", { class: "ei-review-ctas" });
    ctas.appendChild(el("a", {
      class: "ei-review-cta",
      href: BOOKING_URL,
      target: "_blank",
      rel: "noopener noreferrer",
      "data-event": "book_call_click",
    }, [
      el("span", { text: t.ctaBook }),
      el("span", { html: svg('<path d="M5 12h14M13 5l7 7-7 7"/>') }),
    ]));
    ctas.appendChild(el("a", {
      class: "ei-review-cta ei-review-cta--ghost",
      href: `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(lang === "ar" ? "طلب التصور الكامل من إنساين" : "Full Architecture Request — Ensign")}`,
      "data-event": "proposal_request",
    }, [
      el("span", { text: t.ctaArch }),
      el("span", { html: svg('<path d="M5 12h14M13 5l7 7-7 7"/>') }),
    ]));
    inner.appendChild(ctas);

    wrap.appendChild(inner);
    stage.appendChild(wrap);
    wrap.scrollTop = 0;
  }

  // ----- Returning user -----
  function renderReturning() {
    clearStage();
    const stage = document.getElementById("ei-stage");
    stage.appendChild(renderHeader());

    const t = S[lang].returning;
    const wrap = el("div", { class: "ei-panel-scroll" });
    const inner = el("div", { class: "ei-returning" });

    inner.appendChild(el("div", { class: "ei-eyebrow", text: t.eyebrow }));
    inner.appendChild(el("h1", { class: "ei-display", text: t.headline }));
    inner.appendChild(el("p", { class: "ei-sub", text: t.sub }));

    const ctas = el("div", { class: "ei-review-ctas" });
    ctas.appendChild(el("a", {
      class: "ei-review-cta",
      href: BOOKING_URL,
      target: "_blank",
      rel: "noopener noreferrer",
    }, [
      el("span", { text: t.ctaBook }),
      el("span", { html: svg('<path d="M5 12h14M13 5l7 7-7 7"/>') }),
    ]));
    ctas.appendChild(el("a", {
      class: "ei-review-cta ei-review-cta--ghost",
      href: `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(lang === "ar" ? "طلب التصور الكامل من إنساين" : "Full Architecture Request — Ensign")}`,
    }, [
      el("span", { text: t.ctaArch }),
      el("span", { html: svg('<path d="M5 12h14M13 5l7 7-7 7"/>') }),
    ]));
    ctas.appendChild(el("a", {
      class: "ei-review-cta ei-review-cta--ghost",
      href: `mailto:${CONTACT_EMAIL}`,
    }, [
      el("span", { text: t.ctaContact }),
      el("span", { html: svg('<path d="M5 12h14M13 5l7 7-7 7"/>') }),
    ]));
    inner.appendChild(ctas);

    wrap.appendChild(inner);
    stage.appendChild(wrap);
  }

  // ----- Open / close -----
  function openOverlay() {
    ensureRoot();
    applyLangAttrs();
    document.body.classList.add("ei-locked");
    root.classList.add("is-open");
    if (localStorage.getItem(STORAGE_KEY) === "1") {
      renderReturning();
    } else {
      renderUnlock();
    }
  }
  function closeOverlay() {
    if (!root) return;
    root.classList.remove("is-open");
    document.body.classList.remove("ei-locked");
    setTimeout(() => { clearStage(); session = null; busy = false; }, 600);
  }

  // ----- Utils -----
  function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

  // ----- Public API -----
  window.EnsignIntel = {
    open: openOverlay,
    close: closeOverlay,
    setLang: (l) => { if (l === "ar" || l === "en") { lang = l; localStorage.setItem(STORAGE_LANG_KEY, lang); } },
  };

  // ----- Auto-bind CTAs -----
  document.addEventListener("click", function (e) {
    const trigger = e.target.closest("[data-ei-open]");
    if (!trigger) return;
    e.preventDefault();
    const explicitLang = trigger.getAttribute("data-ei-lang");
    if (explicitLang === "ar" || explicitLang === "en") lang = explicitLang;
    openOverlay();
  });

  // ----- URL-hash auto-open (preview/QA convenience) -----
  // Visiting any page with #open or #open-ar in the URL launches the chat.
  // Useful on mobile and when a preview-environment toolbar intercepts taps.
  function maybeAutoOpenFromHash() {
    const h = (window.location.hash || "").toLowerCase();
    if (h === "#open" || h === "#open-en") { openOverlay(); }
    else if (h === "#open-ar") { lang = "ar"; localStorage.setItem(STORAGE_LANG_KEY, "ar"); openOverlay(); }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", maybeAutoOpenFromHash);
  } else {
    maybeAutoOpenFromHash();
  }
  window.addEventListener("hashchange", maybeAutoOpenFromHash);

  // Esc closes when allowed
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape" || !root || !root.classList.contains("is-open")) return;
    if (!session || session.completed) closeOverlay();
  });
})();
