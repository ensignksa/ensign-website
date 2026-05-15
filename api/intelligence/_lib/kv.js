// KV layer with in-memory stub for local dev (LOCAL_KV_STUB=1)
// and Vercel KV in production.

const useStub = process.env.LOCAL_KV_STUB === "1" || !process.env.KV_REST_API_URL;

let realKV = null;
async function getRealKV() {
  if (realKV) return realKV;
  const mod = await import("@vercel/kv");
  realKV = mod.kv;
  return realKV;
}

// In-memory stub
const mem = new Map();
const ttls = new Map();

function stubExpired(key) {
  const t = ttls.get(key);
  if (t && Date.now() > t) {
    mem.delete(key);
    ttls.delete(key);
    return true;
  }
  return false;
}

async function get(key) {
  if (useStub) {
    if (stubExpired(key)) return null;
    return mem.get(key) ?? null;
  }
  const kv = await getRealKV();
  return await kv.get(key);
}

async function set(key, value, opts = {}) {
  if (useStub) {
    mem.set(key, value);
    if (opts.ex) ttls.set(key, Date.now() + opts.ex * 1000);
    return;
  }
  const kv = await getRealKV();
  if (opts.ex) await kv.set(key, value, { ex: opts.ex });
  else await kv.set(key, value);
}

async function del(key) {
  if (useStub) {
    mem.delete(key);
    ttls.delete(key);
    return;
  }
  const kv = await getRealKV();
  await kv.del(key);
}

// Sessions: TTL 2 hours
export async function createSession(id, payload) {
  await set(`session:${id}`, payload, { ex: 60 * 60 * 2 });
}
export async function getSession(id) {
  return await get(`session:${id}`);
}
export async function updateSession(id, payload) {
  await set(`session:${id}`, payload, { ex: 60 * 60 * 2 });
}
export async function deleteSession(id) {
  await del(`session:${id}`);
}

// Email lock: 30 days
export async function isEmailLocked(emailHash) {
  return (await get(`lock:email:${emailHash}`)) === 1;
}
export async function lockEmail(emailHash) {
  await set(`lock:email:${emailHash}`, 1, { ex: 60 * 60 * 24 * 30 });
}

// IP lock: 24 hours, allows up to 3 starts then blocks
export async function bumpIPLock(ip) {
  const key = `lock:ip:${ip}`;
  const current = (await get(key)) || 0;
  const next = current + 1;
  await set(key, next, { ex: 60 * 60 * 24 });
  return next;
}
