import { GoogleGenerativeAI } from "@google/generative-ai";

const MODEL_ID = process.env.GEMINI_MODEL || "gemini-2.5-flash";

function getClient() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY missing");
  return new GoogleGenerativeAI(key);
}

async function withRetry(fn, { tries = 3, baseDelay = 600 } = {}) {
  let lastErr;
  for (let i = 0; i < tries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const status = err?.status || err?.statusCode;
      const retriable = status === 503 || status === 429 || status === 500 || status === 502;
      if (!retriable || i === tries - 1) throw err;
      const delay = baseDelay * Math.pow(2, i) + Math.floor(Math.random() * 250);
      console.warn(`[gemini] ${status} retry in ${delay}ms (attempt ${i + 1}/${tries})`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

// ---------------------------------------------------------------------------
// Conversation turns — no thinking mode, tight token budget.
// Thinking mode causes analytical reasoning to bleed into visible output
// (consultant-style sentences). Direct response mode is conversational.
// generateJSON() below intentionally keeps thinking ON for review synthesis.
// ---------------------------------------------------------------------------
export async function generateTurn({ system, history, userMessage, profileName }) {
  const client = getClient();
  const model = client.getGenerativeModel({
    model: MODEL_ID,
    systemInstruction: system,
    generationConfig: {
      temperature: 0.45,
      topP: 0.9,
      maxOutputTokens: 1200,
      thinkingConfig: { thinkingBudget: 0 },
    },
  });

  // Gemini chat history must start with a 'user' turn. Drop any leading
  // assistant messages (our opening greeting lives only in the system prompt).
  const mapped = history.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
  while (mapped.length && mapped[0].role !== "user") mapped.shift();

  const result = await withRetry(async () => {
    const chat = model.startChat({ history: mapped });
    return await chat.sendMessage(userMessage);
  });
  const raw = result.response.text();
  const parsed = parseSignal(raw);
  return { text: simplifyText(parsed.text, profileName), signal: parsed.signal, signals: parsed.signals };
}

// ---------------------------------------------------------------------------
// Final review — thinking ON, high token budget.
// Structured JSON synthesis from a full conversation transcript benefits from
// the model's full analytical capacity.
// ---------------------------------------------------------------------------
export async function generateJSON({ prompt }) {
  const client = getClient();
  const model = client.getGenerativeModel({
    model: MODEL_ID,
    generationConfig: {
      temperature: 0.55,
      topP: 0.9,
      maxOutputTokens: 3000,
      responseMimeType: "application/json",
    },
  });

  const result = await withRetry(() => model.generateContent(prompt));
  const raw = result.response.text().trim();
  const cleaned = raw.replace(/^```json\s*/i, "").replace(/```\s*$/, "");
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    const recovered = recoverJSON(cleaned);
    if (recovered) return recovered;
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Post-generation simplification pass — conversation turns only.
// Safety net: rewrites consultant vocabulary that slips through despite the
// lower token budget and disabled thinking mode.
// Applied to visible text only, after the signal tag has been extracted.
// ---------------------------------------------------------------------------
const SIMPLIFICATIONS = [
  // Multi-word phrases first (more specific before general)
  [/\bmanual processes? introduce[s]? delays? and inconsistenc(?:y|ies)\b/gi, "doing this manually slows things down"],
  [/\bdirectly erode[s]? (?:\w+ )*?value over time\b/gi, "hurt results over time"],
  [/\berode[s]? (?:a |the |your )?(?:\w+ )?value\b/gi, "hurt results"],
  [/\bsystemic (?:disconnect|vulnerabilit(?:y|ies))\b/gi, "a deeper problem"],
  [/\boperational inefficien(?:cy|cies)\b/gi, "something slowing the process down"],
  [/\bcritical bottleneck[s]?\b/gi, "the main thing getting in the way"],
  [/\btangible revenue\b/gi, "actual sales"],
  [/\bengagement architecture\b/gi, "how conversations are handled"],
  [/\bconversion (?:architecture|infrastructure)\b/gi, "what happens between interest and a sale"],
  [/\bstrategic optim(?:iz|is)ation\b/gi, "making this work better"],
  [/\bproportionate conversion\b/gi, "leads turning into sales"],
  [/\bacquisition pipeline\b/gi, "how people find you"],
  [/\bengagement process\b/gi, "what happens after someone shows interest"],
  [/\bleads? disengag(?:e|es|ed|ing)\b/gi, "people losing interest"],
  [/\bvalue proposition\b/gi, "what makes you different"],
  [/\boperational continuity\b/gi, "keeping things running"],
  [/\bstrategic direction\b/gi, "direction"],
  [/\bbusiness objectives?\b/gi, "what you're trying to achieve"],
  [/\bconversion rate\b/gi, "how many leads turn into sales"],
  [/\bpain points?\b/gi, "the real problems"],
  // Single-word softening
  [/\bin order to\b/gi, "to"],
  [/\bleveraging\b/gi, "using"],
  [/\bleverage\b(?= (?:your|the|this|that|a|an|our|their|its)\b)/gi, "use"],
  [/\brobust\b/gi, "solid"],
  [/\bholistic(?:ally)?\b/gi, "complete"],
  [/\boptimize\b/gi, "improve"],
  [/\boptimise\b/gi, "improve"],
  // Remove performative openers that survive despite instructions
  [/\bit(?:'s| is) (?:worth noting|important to note) that\s*/gi, ""],
  [/\bI want to (?:highlight|emphasize|note) that\s*/gi, ""],
  [/\bstrategically speaking[,.]?\s*/gi, ""],
  [/\bfundamentally[,.]?\s*/gi, ""],
  [/\bultimately[,.]?\s*/gi, ""],
  // Strip verbose conversational openers — decision-maker tightness.
  [/^(?:okay|ok|alright|sure|great|got it)[,.!]?\s*(?:let'?s\s+(?:look\s+at\s+(?:that|this)|start|begin|dive\s+in|explore(?:\s+that)?)[,.!]?\s*)?/i, ""],
  [/^let'?s\s+(?:look\s+at\s+(?:that|this)|start|begin|dive\s+in|explore(?:\s+that)?)[,.!]?\s*/i, ""],
  [/^that'?s\s+a\s+(?:great|good|solid|smart|interesting|fair|valid|nice)\s+(?:starting\s+point|place\s+to\s+start|question|point|one|topic|area)[,.!]?\s*/i, ""],
  [/^(?:happy|glad)\s+to\s+help[,.!]?\s*/i, ""],
  [/^absolutely[,.!]?\s*/i, ""],
  [/^for\s+a\s+(?:business|company|brand|team)\s+like\s+\S+[,.]\s*/i, ""],
  // Pain-restatement openers — kill the empathy/diagnosis sentence that follows the
  // affirmation. Match a sentence that begins with one of these openers and runs to
  // its terminal punctuation. Only fires when the sentence stands on its own (after a
  // newline or sentence break), so it never carves out content mid-paragraph.
  [/(?:^|(?<=[\n.!?]\s))that sounds like[^.!?\n]+[.!?]\s*/gi, ""],
  [/(?:^|(?<=[\n.!?]\s))that(?:'s| is) a (?:common|tough|tricky|familiar|classic)[^.!?\n]+[.!?]\s*/gi, ""],
  [/(?:^|(?<=[\n.!?]\s))i see what you mean[^.!?\n]*[.!?]\s*/gi, ""],
  [/(?:^|(?<=[\n.!?]\s))i (?:totally |fully |completely )?understand that[^.!?\n]+[.!?]\s*/gi, ""],
];

function simplifyText(text, profileName) {
  let out = text;

  // Strip the visitor's first name when it appears as a discourse marker
  // ("Hi Rana, ...", "...let me know, Rana."). Original intent: prevent
  // the AI from over-using the name. But the previous regex stripped EVERY
  // occurrence, which also ate the brand word "Ensign" when a tester used
  // it as their name. Now: only strip when the name is followed by a
  // comma/period/dash (typical address pattern), and never when it equals
  // a reserved brand word.
  if (profileName) {
    const firstName = String(profileName).trim().split(/\s+/)[0];
    const RESERVED = new Set(["ensign"]); // brand words that must NEVER be stripped
    if (firstName.length >= 2 && !RESERVED.has(firstName.toLowerCase())) {
      const esc = firstName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      // Only strip when the name is immediately followed by punctuation
      // that signals address (",", ".", " —"), with optional trailing space.
      out = out.replace(new RegExp(`\\b${esc}\\b\\s*[,.\\-—](?=\\s)`, "gi"), "");
    }
  }

  for (const [pattern, replacement] of SIMPLIFICATIONS) {
    out = out.replace(pattern, replacement);
  }

  // Strip markdown formatting that leaks through into plain-text chat bubbles.
  // `**bold**` → bold, `* item` (list marker at line start) → "", `__text__` → text
  out = out.replace(/\*\*(.+?)\*\*/g, "$1");
  out = out.replace(/__(.+?)__/g, "$1");
  out = out.replace(/^\s*[*•\-]\s+/gm, "");
  // Inline single-asterisk emphasis: only strip when wrapping word(s), not stray asterisks.
  out = out.replace(/(^|[\s(])\*(\S[^*]*?\S|\S)\*(?=[\s).,!?;:؟]|$)/g, "$1$2");

  out = truncateToSentence(out, 2800);
  // Clean up whitespace artifacts from removed phrases
  return out.replace(/ {2,}/g, " ").replace(/ ([.,;?!؟])/g, "$1").trim();
}

function truncateToSentence(text, maxChars) {
  if (text.length <= maxChars) return text;
  const slice = text.slice(0, maxChars);
  const lastEnd = Math.max(
    slice.lastIndexOf(". "),
    slice.lastIndexOf("? "),
    slice.lastIndexOf("! "),
    slice.lastIndexOf("؟ ")
  );
  if (lastEnd > 100) return text.slice(0, lastEnd + 1).trim();
  return slice.trim();
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------
function recoverJSON(s) {
  for (let i = s.length; i > 0; i--) {
    if (s[i - 1] !== "}") continue;
    try { return JSON.parse(s.slice(0, i)); } catch {}
  }
  return null;
}

function parseSignal(text) {
  // Strip ALL signal brackets from the text so none leak into the visible reply.
  // Return EVERY key=value pair encountered, so the operational interpretation
  // panel can populate multiple fields in a single turn (business_context,
  // growth_signal, recommended_direction, agent_mode, etc.).
  let visible = text;
  const signals = [];
  visible = visible.replace(/\[SIGNAL:\s*([^\]]+)\]/gi, (_m, body) => {
    // Body may carry one or more comma-separated pairs:
    //   "key=value"
    //   "key=value, other_key=other_value"
    const parts = String(body).split(/,(?=\s*[a-z_]+\s*=)/i);
    for (const raw of parts) {
      const eq = raw.indexOf("=");
      if (eq <= 0) continue;
      const k = raw.slice(0, eq).trim();
      const v = raw.slice(eq + 1).trim();
      if (/^[a-z_]+$/i.test(k) && v) signals.push({ key: k, value: v });
    }
    return "";
  });
  // Back-compat: callers that still read `.signal` get the first one.
  return { text: visible.trim(), signal: signals[0] || null, signals };
}
