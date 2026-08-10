/* ============================================================
   api/photo.js — Vercel serverless function (Node.js runtime)

   Removes the background from a CV profile photo using an AI
   provider. This is the ONLY operation that leaves the browser —
   crop, zoom, move, rotate, brightness/contrast/saturation, and
   background color are all handled locally in js/app.js (Photo
   Studio) and never touch this endpoint.

   Required environment variables (set in Vercel → Settings →
   Environment Variables, never in frontend code):
     PHOTO_AI_API_KEY
     PHOTO_AI_PROVIDER   (currently only 'removebg' is implemented;
                          the provider call is isolated in
                          removeBackgroundViaProvider() below so a
                          different provider can be added later
                          without touching the rest of this file)

   Optional (enables basic per-IP rate limiting; safely no-ops if
   not set — same storage/pattern as api/feedback.js and
   api/analytics.js):
     UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN
     -- or the Vercel Marketplace naming --
     <PREFIX>_KV_REST_API_URL / <PREFIX>_KV_REST_API_TOKEN

   If PHOTO_AI_API_KEY isn't configured, this endpoint returns a
   clear "not configured" error and the Photo Studio's local editing
   (crop/zoom/brightness/etc.) keeps working without it — AI is an
   enhancement, never a requirement to finish a CV.

   This endpoint receives ONLY the photo the person is actively
   editing. It is never logged, never stored, and never forwarded to
   analytics or the Telegram feedback bot.
   ============================================================ */

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB, matches the client-side upload limit
const RATE_LIMIT_WINDOW_SECONDS = 60;
const RATE_LIMIT_MAX_REQUESTS = 5; // AI calls cost money — keep this tighter than feedback's limit

async function redisCmd(parts) {
  const url = process.env.UPSTASH_REDIS_KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  try {
    const res = await fetch(`${url}/${parts.map(encodeURIComponent).join('/')}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    return data.result;
  } catch (err) {
    console.error('NeonCV photo: redis error', err);
    return null;
  }
}

async function withinRateLimit(key) {
  const count = await redisCmd(['INCR', key]);
  if (count === null) return true; // fail open if not configured
  if (count === 1) await redisCmd(['EXPIRE', key, String(RATE_LIMIT_WINDOW_SECONDS)]);
  return count <= RATE_LIMIT_MAX_REQUESTS;
}

/**
 * Parses "data:image/jpeg;base64,AAAA..." into { mimeType, base64 }.
 * Returns null if the string isn't a recognized image data URL.
 */
function parseDataUrl(value) {
  const match = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(String(value || ''));
  if (!match) return null;
  return { mimeType: match[1], base64: match[2] };
}

/**
 * Calls the configured AI provider and returns a PNG data URL with
 * the background removed, or throws with a safe, user-facing message.
 */
async function removeBackgroundViaProvider(base64Image) {
  const provider = (process.env.PHOTO_AI_PROVIDER || 'removebg').toLowerCase();
  const apiKey = process.env.PHOTO_AI_API_KEY;

  if (!apiKey) {
    const err = new Error('Photo AI is not configured yet.');
    err.userMessage = "We couldn't remove the background right now.";
    err.statusCode = 503;
    throw err;
  }

  if (provider === 'removebg') {
    const res = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_file_b64: base64Image,
        size: 'auto',
        format: 'png',
        response_format: 'json',
      }),
    });

    if (!res.ok) {
      let detail = '';
      try {
        const errBody = await res.json();
        detail = (errBody.errors && errBody.errors[0] && errBody.errors[0].title) || '';
      } catch (e) { /* ignore parse failure */ }
      console.error('NeonCV photo: remove.bg error', res.status, detail);
      const err = new Error('AI provider request failed: ' + detail);
      err.userMessage = res.status === 429
        ? "We're getting a lot of requests right now. Please try again in a moment."
        : "We couldn't remove the background right now.";
      err.statusCode = 502;
      throw err;
    }

    const data = await res.json();
    const resultB64 = data && data.data && data.data.result_b64;
    if (!resultB64) {
      const err = new Error('AI provider returned no image.');
      err.userMessage = "We couldn't remove the background right now.";
      err.statusCode = 502;
      throw err;
    }
    return 'data:image/png;base64,' + resultB64;
  }

  const err = new Error(`Unknown PHOTO_AI_PROVIDER: ${provider}`);
  err.userMessage = "We couldn't remove the background right now.";
  err.statusCode = 500;
  throw err;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed.' });
    return;
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const parsed = parseDataUrl(body.image);

  if (!parsed) {
    res.status(400).json({ ok: false, error: 'Please upload a JPG, PNG, or WEBP image under 2 MB.' });
    return;
  }
  if (!ALLOWED_TYPES.includes(parsed.mimeType)) {
    res.status(400).json({ ok: false, error: 'Please upload a JPG, PNG, or WEBP image under 2 MB.' });
    return;
  }
  const approxBytes = Math.floor((parsed.base64.length * 3) / 4);
  if (approxBytes > MAX_BYTES) {
    res.status(400).json({ ok: false, error: 'Please upload a JPG, PNG, or WEBP image under 2 MB.' });
    return;
  }

  const ip = String(req.headers['x-forwarded-for'] || 'unknown').split(',')[0].trim();
  const allowed = await withinRateLimit(`neoncv:ratelimit:photo:${ip}`);
  if (!allowed) {
    res.status(429).json({ ok: false, error: 'Too many photo requests. Please try again in a minute.' });
    return;
  }

  try {
    const resultImage = await removeBackgroundViaProvider(parsed.base64);
    res.status(200).json({ ok: true, image: resultImage });
  } catch (err) {
    res.status(err.statusCode || 500).json({ ok: false, error: err.userMessage || "We couldn't remove the background right now." });
  }
};
