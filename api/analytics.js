/* ============================================================
   api/analytics.js — Vercel serverless function (Node.js runtime)

   Two responsibilities:
     POST — record one tracked event, anonymously.
     GET  — (admin only, requires ?secret=ADMIN_SECRET) return the
            current totals for the NeonCV Analytics dashboard.

   Storage: Upstash Redis REST API. Set these environment variables
   in Vercel → Settings → Environment Variables:
     UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN
     -- or, if connected via Vercel Marketplace with a custom prefix --
     <PREFIX>_KV_REST_API_URL / <PREFIX>_KV_REST_API_TOKEN
     ADMIN_SECRET   (any long random string you choose)

   If Upstash isn't configured, POST requests silently no-op (the
   app keeps working fine without analytics) and GET returns all
   zeros rather than erroring.

   Visitors are counted as UNIQUE people: each browser gets a random
   anonymous ID (stored client-side in localStorage — see
   getVisitorId() in js/app.js), and we add that ID to a Redis SET,
   so visiting the site 10 times only ever counts as 1 visitor. This
   is a best-effort, cookieless approximation — the same person on a
   second device/browser, or after clearing site data, is counted
   again as a new visitor, since there's no login to tie them
   together.

   Every other event (cv_created, pdf_download, feedback_submitted)
   is a plain counter and is NOT deduplicated — the same person
   downloading their CV 3 times correctly shows as 3 downloads.

   This endpoint NEVER receives CV content, names, emails, phone
   numbers, NRC, or photos — only an event name, an anonymous visitor
   ID, and small metadata (template, purpose, device, feedback type).
   ============================================================ */

const COUNTER_EVENTS = ['cv_created', 'pdf_download', 'feedback_submitted', 'photo_upload', 'photo_ai_process', 'photo_ai_success', 'photo_ai_failure', 'photo_applied'];

async function redisCmd(parts) {
  // See api/feedback.js for why several variable-name variants are
  // checked — it depends on how the Upstash integration was connected.
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
    console.error('NeonCV analytics: redis error', err);
    return null;
  }
}

function todayKey() { return new Date().toISOString().slice(0, 10); }   // YYYY-MM-DD
function monthKey() { return new Date().toISOString().slice(0, 7); }    // YYYY-MM

// ---- plain, non-deduplicated counters (cv_created, pdf_download, feedback_submitted) ----

async function incrementCounter(event) {
  await Promise.all([
    redisCmd(['INCR', `neoncv:${event}:total`]),
    redisCmd(['INCR', `neoncv:${event}:${todayKey()}`]),
    redisCmd(['INCR', `neoncv:${event}:${monthKey()}`]),
  ]);
}

async function readCounter(event) {
  const [total, today, month] = await Promise.all([
    redisCmd(['GET', `neoncv:${event}:total`]),
    redisCmd(['GET', `neoncv:${event}:${todayKey()}`]),
    redisCmd(['GET', `neoncv:${event}:${monthKey()}`]),
  ]);
  return { total: Number(total) || 0, today: Number(today) || 0, thisMonth: Number(month) || 0 };
}

// ---- unique-visitor tracking (page_view), deduplicated by anonymous visitorId ----

async function recordUniqueVisitor(visitorId) {
  if (!visitorId) return;
  await Promise.all([
    redisCmd(['SADD', 'neoncv:visitors:set:total', visitorId]),
    redisCmd(['SADD', `neoncv:visitors:set:${todayKey()}`, visitorId]),
    redisCmd(['SADD', `neoncv:visitors:set:${monthKey()}`, visitorId]),
  ]);
}

async function readUniqueVisitors() {
  const [total, today, month] = await Promise.all([
    redisCmd(['SCARD', 'neoncv:visitors:set:total']),
    redisCmd(['SCARD', `neoncv:visitors:set:${todayKey()}`]),
    redisCmd(['SCARD', `neoncv:visitors:set:${monthKey()}`]),
  ]);
  return { total: Number(total) || 0, today: Number(today) || 0, thisMonth: Number(month) || 0 };
}

// ---- anonymous timing sample for photo_ai_success (lets the owner see whether
// the ~10s on-device background-removal target is actually being hit) ----

async function recordAiDuration(durationMs) {
  const ms = Number(durationMs);
  if (!Number.isFinite(ms) || ms < 0 || ms > 10 * 60 * 1000) return; // ignore garbage/implausible values
  await Promise.all([
    redisCmd(['INCRBY', 'neoncv:photo_ai:duration_sum_ms', String(Math.round(ms))]),
    redisCmd(['INCR', 'neoncv:photo_ai:duration_count']),
  ]);
}

async function readAiDurationStats() {
  const [sum, count] = await Promise.all([
    redisCmd(['GET', 'neoncv:photo_ai:duration_sum_ms']),
    redisCmd(['GET', 'neoncv:photo_ai:duration_count']),
  ]);
  const sampleCount = Number(count) || 0;
  const avgDurationMs = sampleCount > 0 ? Math.round(Number(sum) / sampleCount) : null;
  return { avgDurationMs, sampleCount };
}

module.exports = async function handler(req, res) {
  if (req.method === 'POST') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const event = body.event;

    if (event === 'page_view') {
      const visitorId = String(body.visitorId || '').slice(0, 80);
      await recordUniqueVisitor(visitorId);
      res.status(200).json({ ok: true });
      return;
    }

    if (!COUNTER_EVENTS.includes(event)) {
      res.status(400).json({ ok: false, error: 'Unknown event.' });
      return;
    }
    await incrementCounter(event);
    if (event === 'photo_ai_success' && body.meta && body.meta.durationMs !== undefined) {
      await recordAiDuration(body.meta.durationMs);
    }
    res.status(200).json({ ok: true });
    return;
  }

  if (req.method === 'GET') {
    const secret = req.query ? req.query.secret : undefined;
    if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
      res.status(401).json({ ok: false, error: 'Unauthorized.' });
      return;
    }
    const [visitors, cvCreated, pdfDownloads, feedback, photoAi] = await Promise.all([
      readUniqueVisitors(),
      readCounter('cv_created'),
      readCounter('pdf_download'),
      readCounter('feedback_submitted'),
      readAiDurationStats(),
    ]);
    res.status(200).json({ ok: true, visitors, cvCreated, pdfDownloads, feedback, photoAi });
    return;
  }

  res.status(405).json({ ok: false, error: 'Method not allowed.' });
};

