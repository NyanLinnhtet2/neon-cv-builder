/* ============================================================
   api/feedback.js — Vercel serverless function (Node.js runtime)

   Receives feedback from the NeonCV feedback form and delivers it
   to the owner's Telegram via the Telegram Bot API.

   Required environment variables (set in Vercel → Settings →
   Environment Variables, never in frontend code):
     TELEGRAM_BOT_TOKEN
     TELEGRAM_CHAT_ID

   Optional (enables basic per-IP rate limiting; safely no-ops if
   not set — see api/analytics.js for the same storage):
     UPSTASH_REDIS_REST_URL
     UPSTASH_REDIS_REST_TOKEN

   This function NEVER receives or forwards CV content, photos,
   NRC, or any personal data other than what the person optionally
   typed into the Name/Email fields of the feedback form itself.
   ============================================================ */

const MAX_MESSAGE_LENGTH = 2000;
const RATE_LIMIT_WINDOW_SECONDS = 60;
const RATE_LIMIT_MAX_REQUESTS = 3;

async function redisCmd(parts) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null; // rate limiting disabled if not configured
  try {
    const res = await fetch(`${url}/${parts.map(encodeURIComponent).join('/')}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    return data.result;
  } catch (err) {
    console.error('NeonCV feedback: redis error', err);
    return null;
  }
}

async function withinRateLimit(key) {
  const count = await redisCmd(['INCR', key]);
  if (count === null) return true; // fail open — don't block feedback if storage isn't configured
  if (count === 1) await redisCmd(['EXPIRE', key, String(RATE_LIMIT_WINDOW_SECONDS)]);
  return count <= RATE_LIMIT_MAX_REQUESTS;
}

function clean(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed.' });
    return;
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});

  // Honeypot — a hidden field real visitors never fill in. Pretend
  // success so a bot doesn't learn its submission was rejected.
  if (clean(body.website, 200)) {
    res.status(200).json({ ok: true });
    return;
  }

  const message = clean(body.message, MAX_MESSAGE_LENGTH);
  if (!message) {
    res.status(400).json({ ok: false, error: 'Message is required.' });
    return;
  }

  const name = clean(body.name, 80) || 'Anonymous';
  const email = clean(body.email, 120) || 'Not provided';
  const type = clean(body.type, 40) || 'General Feedback';
  const visitorId = clean(body.visitorId, 60) || 'Anonymous';

  const ip = String(req.headers['x-forwarded-for'] || 'unknown').split(',')[0].trim();
  const allowed = await withinRateLimit(`neoncv:ratelimit:feedback:${ip}`);
  if (!allowed) {
    res.status(429).json({ ok: false, error: 'Too many requests. Please try again in a minute.' });
    return;
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!botToken || !chatId) {
    console.error('NeonCV feedback: TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID not configured');
    res.status(500).json({ ok: false, error: 'Feedback delivery is not configured yet.' });
    return;
  }

  const time = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
  const text = [
    '📝 NeonCV Feedback',
    '',
    `Type:\n${type}`,
    '',
    `Name:\n${name}`,
    '',
    `Email:\n${email}`,
    '',
    `Message:\n${message}`,
    '',
    '────────────────────',
    '',
    'Source:\nNeonCV Website',
    '',
    `Time:\n${time}`,
    '',
    `Visitor ID:\n${visitorId}`,
  ].join('\n');

  try {
    const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
    const tgData = await tgRes.json();
    if (!tgRes.ok || !tgData.ok) {
      console.error('NeonCV feedback: Telegram delivery failed', tgData);
      res.status(502).json({ ok: false, error: "We couldn't send your feedback right now." });
      return;
    }
  } catch (err) {
    console.error('NeonCV feedback: Telegram request error', err);
    res.status(502).json({ ok: false, error: "We couldn't send your feedback right now." });
    return;
  }

  res.status(200).json({ ok: true });
};
