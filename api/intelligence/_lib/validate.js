import crypto from "node:crypto";

const DISPOSABLE = new Set([
  "mailinator.com", "tempmail.com", "10minutemail.com", "guerrillamail.com",
  "trashmail.com", "yopmail.com", "throwaway.email", "fakeinbox.com",
  "sharklasers.com", "getnada.com", "temp-mail.org", "dispostable.com",
]);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateProfile(p) {
  const errors = [];
  if (!p || typeof p !== "object") return ["invalid payload"];

  const trim = (v, max) => typeof v === "string" ? v.trim().slice(0, max) : "";
  p.name = trim(p.name, 80);
  p.email = trim(p.email, 120).toLowerCase();
  p.company = trim(p.company, 120);
  p.industry = trim(p.industry, 60);
  p.website = trim(p.website, 200);
  p.lang = p.lang === "ar" ? "ar" : "en";

  if (p.name.length < 2) errors.push("name");
  if (!EMAIL_RE.test(p.email)) errors.push("email");
  const domain = p.email.split("@")[1];
  if (domain && DISPOSABLE.has(domain)) errors.push("email_disposable");
  if (p.company.length < 2) errors.push("company");
  if (p.industry.length < 2) errors.push("industry");

  return errors;
}

export function hashEmail(email) {
  return crypto.createHash("sha256").update(email.toLowerCase().trim()).digest("hex").slice(0, 32);
}

export function newSessionId() {
  return crypto.randomBytes(12).toString("hex");
}

export function clientIP(req) {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string") return fwd.split(",")[0].trim();
  return req.socket?.remoteAddress || "unknown";
}

// Detect if an email is a business domain (heuristic for lead scoring)
const PERSONAL_DOMAINS = new Set([
  "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "live.com",
  "icloud.com", "me.com", "aol.com", "proton.me", "protonmail.com",
  "yandex.com", "zoho.com", "gmx.com",
]);
export function isBusinessEmail(email) {
  const d = email.split("@")[1];
  return d && !PERSONAL_DOMAINS.has(d);
}
