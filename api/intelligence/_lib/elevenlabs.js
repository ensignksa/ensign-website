// ElevenLabs text-to-speech client.
// Server-only — the API key never reaches the browser. The voice endpoint
// (api/intelligence/voice.js) calls this and pipes the resulting MP3 back
// to the client.

const DEFAULT_MODEL = "eleven_turbo_v2_5";
const TIMEOUT_MS = 25_000;
const BASE_URL = "https://api.elevenlabs.io/v1";

// TTS-only text transformations. The on-screen transcript still shows the
// original; only the TTS payload gets these substitutions. Per-language
// because Arabic TTS especially butchers Latin letters, symbols, and
// number-formats it can't natively parse.
function preprocessForTTS(text, lang) {
  let out = String(text || "");

  // "24/7" is the universal offender — Arabic TTS reads it as "twenty four
  // slash seven" or letter-by-letter; even English cloned voices sometimes
  // mispronounce the slash. Replace with the natural spoken form.
  if (lang === "ar") {
    out = out.replace(/\b24\s*[\/\\]\s*7\b/g, "على مدار الساعة");
  } else {
    out = out.replace(/\b24\s*[\/\\]\s*7\b/g, "twenty-four seven");
  }

  // Brand name — Arabic TTS reads "Ensign" as the Latin letters.
  if (lang === "ar") {
    out = out.replace(/\bEnsign\b/g, "إنساين");
  }
  // English mode: "Ensign" pronounces correctly out of the box.

  return out;
}

/**
 * @returns {{configured: boolean, reason?: string}}
 */
export function elevenlabsStatus() {
  if (!process.env.ELEVENLABS_API_KEY) return { configured: false, reason: "missing_api_key" };
  if (!process.env.ELEVENLABS_VOICE_ID) return { configured: false, reason: "missing_voice_id" };
  return { configured: true };
}

/**
 * Generate speech audio (MP3) for the given text.
 *
 * @param {object} opts
 * @param {string} opts.text          — text to speak (max ~5000 chars per request)
 * @param {string} [opts.lang]        — "en" or "ar"; passed for future per-lang voice routing
 * @param {string} [opts.voiceId]     — override the default voice id from env
 * @param {string} [opts.modelId]     — override the default model id
 * @returns {Promise<{ok: true, audio: ArrayBuffer, contentType: string} | {ok: false, status: number, error: string, detail?: string}>}
 */
export async function synthesizeSpeech({ text, lang, voiceId, modelId } = {}) {
  const status = elevenlabsStatus();
  if (!status.configured) {
    return { ok: false, status: 503, error: status.reason };
  }

  const trimmed = String(text || "").trim();
  if (!trimmed) return { ok: false, status: 400, error: "empty_text" };
  if (trimmed.length > 5000) return { ok: false, status: 400, error: "text_too_long" };

  const voice = voiceId || process.env.ELEVENLABS_VOICE_ID;
  const model = modelId || process.env.ELEVENLABS_MODEL_ID || DEFAULT_MODEL;

  // Per-language text preprocessing for TTS only — the on-screen transcript
  // is unaffected. Arabic TTS can't pronounce Latin letters like "Ensign"
  // correctly; transliterate so it sounds right.
  const ttsText = preprocessForTTS(trimmed, lang);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${BASE_URL}/text-to-speech/${encodeURIComponent(voice)}`, {
      method: "POST",
      headers: {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": process.env.ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text: ttsText,
        model_id: model,
        // Voice settings tuned for conversational replies. Stability lower
        // than default to allow natural variation; similarity high to keep
        // the cloned voice identity. Speed below 1.0 for a more human,
        // less rushed pace.
        voice_settings: {
          // Tuned for "more human" delivery: looser stability allows
          // natural prosody variation, higher style adds expressive
          // inflection, similarity_boost slightly lower so the model
          // isn't forced into rigid imitation of the source clone,
          // speed back to natural conversational pace.
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.35,
          speed: 1.0,
          use_speaker_boost: true,
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      let detail = "";
      try { detail = (await res.text()).slice(0, 400); } catch (_) {}
      return { ok: false, status: res.status, error: "elevenlabs_error", detail };
    }

    const audio = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") || "audio/mpeg";
    return { ok: true, audio, contentType };
  } catch (err) {
    clearTimeout(timer);
    if (err?.name === "AbortError") {
      return { ok: false, status: 504, error: "timeout" };
    }
    return { ok: false, status: 502, error: "network_error", detail: String(err?.message || err).slice(0, 200) };
  }
}
