# NeonCV

A universal, client-side CV builder by **Neon.dev**.

Create tailored, professional CVs for job applications, internships, scholarships, university applications, freelancing, and research. Your CV content is built and stored entirely in your browser — it's never uploaded anywhere. The project also includes a couple of small, optional Vercel serverless functions for a Telegram feedback form and anonymous usage analytics; neither is required for the CV builder itself to work.

---

## Features

- **Guided creation flow** — choose a purpose, an application context (Myanmar local, international, remote, etc.), then start from a blank form or a realistic sample — so first-time users always know what to fill in.
- **Purpose-aware sections** — pick why you're building a CV and NeonCV recommends the right sections; you can still add or remove any section manually.
- **Context-aware personal fields** — fields like NRC, date of birth, and gender only appear for Myanmar-context CVs, each with its own "show on CV" toggle, and every field is labeled Required, Recommended, or Optional. NRC is entered as four separate boxes (state / township / type / number) rather than one free-text field.
- **Realistic sample CVs** — a distinct, realistic (not lorem-ipsum) sample for each of the 7 purposes, fully editable the moment you load it, with contact details adapted to Myanmar vs. international context.
- **Profile photo** — upload a JPG/PNG/WEBP (up to 2 MB), choose circle/rounded/square, and toggle whether it appears on the printed CV.
- **CV Readiness** — a live completion indicator showing which required and recommended sections still need attention.
- **Live preview** — every change in the editor updates a true-to-scale A4 CV instantly, with no page reload.
- **15+ content sections** — personal info, summary, experience, internships, education, skills, projects, certifications, awards, languages, volunteer work, research, publications, conferences, and references, each fully add/edit/delete-able.
- **Three templates** — Modern, Classic, and Academic, each with a genuinely different layout and photo placement, plus a mini live-style preview thumbnail in the picker. Switch anytime without losing data.
- **Multiple CVs from one profile** — create, duplicate, rename, and delete as many CV versions as you need.
- **Autosave** — changes are saved to your browser automatically, with a clear "Saving… / Saved" indicator.
- **Inline validation** — friendly, non-intrusive error messages instead of browser alert boxes.
- **Print-ready A4 export** — a "Download PDF" button that generates a real PDF file client-side and downloads it immediately — no print dialog, no extra step. It's built from the actual CV text using [jsPDF](https://github.com/parallax/jsPDF) (not a screenshot), so text stays sharp and selectable, and long CVs paginate cleanly across multiple A4 pages.
- **Feedback form** — an optional "Help Us Improve NeonCV" section on the landing page that delivers messages straight to a Telegram chat via a small serverless function (see [Setting up the Telegram bot](#setting-up-the-telegram-bot) below). CV content, photos, and personal data are never included.
- **Anonymous analytics** — optional, privacy-friendly tracking of unique visitors, CVs created, PDF downloads, and feedback submissions, viewable on a secret-protected `/?admin=1` dashboard. No CV content, names, or identities are ever tracked (see [Setting up analytics](#setting-up-analytics-optional) below).
- **CV Photo Studio** — click "Edit Photo" after uploading to open a built-in editor: crop/reposition by dragging, zoom, rotate, adjust brightness/contrast/saturation, pick a background (white/light gray/soft blue/transparent), and optionally remove the background with AI — all before applying the result to your CV. Editing is local and instant; only the "Remove Background" step calls a server, and only your active photo is ever sent, never CV content. See [Setting up the Photo Studio](#setting-up-the-photo-studio-optional) below.
- **Dark mode** — light and dark themes, remembered across visits.
- **Fully responsive** — usable on desktop, tablet, and mobile, with a dedicated Edit/Preview toggle on small screens.
- **Private by default** — the CV builder itself needs no account, no backend, and sends nothing anywhere. Everything lives in `localStorage` on your device, and you can delete all of it at any time. The optional feedback/analytics features (see below) only ever send anonymous, non-CV data if you choose to set them up.

## Supported CV Types

- Job Application
- Internship
- Scholarship
- University Application
- Freelancing / Consulting
- Research / Academic
- General CV

## Tech Stack

- HTML5
- Tailwind CSS (via CDN)
- Vanilla JavaScript (no frameworks, no build step)
- Browser `localStorage` for CV persistence
- Three small Vercel serverless functions (`api/feedback.js`, `api/analytics.js`, `api/photo.js`) — plain Node.js, zero npm dependencies, used only for the optional feedback/analytics/AI-photo features
- [jsPDF](https://github.com/parallax/jsPDF) (via CDN) — generates the downloadable PDF directly from real text, client-side, with no build step
- [Upstash Redis](https://upstash.com) (optional) — free-tier REST-based storage for analytics counters and feedback/photo rate-limiting
- An AI background-removal provider (optional — [remove.bg](https://www.remove.bg/api) by default) for the Photo Studio's "Remove Background" button

No React, no Vue, no TypeScript, no database, no ORM, no full backend server.

## Screenshots

_Add screenshots of the landing page, purpose selector, editor, and a printed CV here._

## How to Run Locally

The CV builder itself is a static site — no build step, no dependencies to install.

1. Clone or download this repository.
2. Open `index.html` directly in your browser, **or** serve the folder locally:
   ```bash
   npx serve .
   # or
   python3 -m http.server 8080
   ```
3. Visit the local URL shown in your terminal (if you used a server), or just double-click `index.html`.

The Feedback form, analytics dashboard, and Photo Studio's AI background removal all need the serverless functions and environment variables described below — each one simply fails gracefully (a friendly error/fallback) if you haven't set it up yet, so the rest of the app still works fine without them.

To run the serverless functions locally too, use the [Vercel CLI](https://vercel.com/docs/cli):
```bash
npm i -g vercel
vercel dev
```

## Project Structure

```text
NeonCV/
│
├── index.html              # Full application UI (all views live in one file)
│
├── css/
│   └── style.css            # Custom CSS: CV paper layout, templates, print styles
│
├── js/
│   ├── app.js                # Application logic, rendering, state, validation, analytics
│   └── storage.js            # LocalStorage persistence only
│
├── api/
│   ├── feedback.js           # Vercel serverless function — delivers feedback to Telegram
│   ├── analytics.js          # Vercel serverless function — anonymous usage counters
│   └── photo.js              # Vercel serverless function — AI background removal for the Photo Studio
│
├── assets/
│   └── images/
│
├── package.json             # Minimal — no dependencies, just marks the Node version for Vercel
├── .env.example             # Template for the environment variables below
├── README.md
└── LICENSE
```

---

## Deploying to Vercel

1. **Push this repository to GitHub** (see the repo's own instructions if you haven't already).
2. Go to **[vercel.com](https://vercel.com)** and sign in — "Continue with GitHub" is the easiest option.
3. Click **Add New → Project**, then select your `neon-cv-builder` (or however you named it) repository from the list and click **Import**.
4. Vercel will auto-detect this as a static project with serverless functions in `/api` — you don't need to change the Framework Preset, Build Command, or Output Directory. Leave them as detected/default.
5. Before clicking **Deploy**, open the **Environment Variables** section on that same screen (or add them afterward under **Project → Settings → Environment Variables**) and add the variables listed in `.env.example`:
   - `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` — required for the feedback form (see next section).
   - `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` (or the `*_KV_REST_API_URL`/`*_KV_REST_API_TOKEN` names Vercel's Marketplace integration may generate instead), plus `ADMIN_SECRET` — optional, only needed for analytics (see the section after that).
   - `PHOTO_AI_API_KEY` and `PHOTO_AI_PROVIDER` — optional, only needed for the Photo Studio's AI background removal (see [Setting up the Photo Studio](#setting-up-the-photo-studio-optional) further down).
6. Click **Deploy**. After a minute or two, Vercel gives you a live URL like `https://neon-cv-builder.vercel.app`.
7. Any time you change an environment variable, click **Redeploy** on the latest deployment (env vars only take effect on new deployments, not automatically).
8. From then on, every `git push` to your repo's default branch triggers a new deployment automatically.

## Setting up the Telegram bot

This is what lets the feedback form on the landing page reach you.

1. Open Telegram and search for **@BotFather** (this is Telegram's official bot for creating other bots).
2. Send `/newbot` and follow the prompts: give it a display name (e.g. "NeonCV Feedback") and a username ending in `bot` (e.g. `neoncv_feedback_bot`).
3. BotFather replies with a token that looks like `123456789:AAH...`. This is your `TELEGRAM_BOT_TOKEN` — copy it somewhere safe.
4. Decide where you want feedback delivered:
   - **To your own DMs:** open a chat with your new bot and send it any message (e.g. "hi") — bots can't message you first, so this step is required.
   - **To a group:** create a Telegram group, add your bot to it, and send a message in the group.
   - **To a channel:** create a channel, add your bot as an administrator.
5. Find your `TELEGRAM_CHAT_ID`:
   - Easiest way: message **@userinfobot** (for your own numeric user ID) or, for a group/channel, temporarily add **@RawDataBot** to it and read the `"chat":{"id": ...}` value from the message it posts, then remove it again.
   - Group/channel IDs are usually negative numbers (e.g. `-1001234567890`) — include the minus sign.
6. In Vercel, set:
   ```text
   TELEGRAM_BOT_TOKEN=123456789:AAH...
   TELEGRAM_CHAT_ID=987654321
   ```
7. Redeploy, then submit a test message through the feedback form on your live site — you should receive it in Telegram within a couple of seconds.

The bot token and chat ID are only ever read inside `api/feedback.js`, which runs on Vercel's servers — they're never sent to, or visible from, the browser.

## Setting up analytics (optional)

Analytics (visitor counts, PDF downloads, feedback totals, and the `/?admin=1` dashboard) need somewhere to store counters centrally — `localStorage` can't do this, since it's private to each visitor's own browser. NeonCV uses [Upstash Redis](https://upstash.com), which has a free tier and needs no npm package (the serverless functions just call its REST API directly).

1. Go to **[vercel.com/dashboard](https://vercel.com/dashboard) → your project → Storage** tab, then **Create Database → Upstash → Redis** (this uses Vercel's built-in marketplace integration and automatically fills in the environment variables for you). Alternatively, sign up directly at [upstash.com](https://upstash.com), create a free Redis database, and copy its **REST URL** and **REST Token** from the database's dashboard into Vercel yourself.
2. Check **Vercel → Project → Settings → Environment Variables** to see exactly which names got created — this varies depending on how you connected:
   ```text
   # A standalone Upstash account, or no custom prefix:
   UPSTASH_REDIS_REST_URL=https://....upstash.io
   UPSTASH_REDIS_REST_TOKEN=....

   # Vercel's Marketplace integration with a custom prefix (e.g. "UPSTASH_REDIS"):
   UPSTASH_REDIS_KV_REST_API_URL=https://....upstash.io
   UPSTASH_REDIS_KV_REST_API_TOKEN=....
   ```
   The serverless functions check for both naming conventions automatically, so whichever one Vercel generated for you will just work — no renaming needed.
3. Add one more variable yourself — this is the password for your analytics dashboard, so make it long and random:
   ```text
   ADMIN_SECRET=choose-a-long-random-string-here
   ```
4. Redeploy. Analytics events now record automatically as people use the site.
5. View your dashboard at `https://your-deployment-url/?admin=1`, enter your `ADMIN_SECRET`, and click **View**.

If you skip this section entirely, the app still works normally — `trackEvent()` calls simply fail silently, and the feedback form's basic rate limiting is disabled (feedback delivery itself still works, since that only needs the Telegram variables).

### What gets tracked (and what doesn't)

- **Visitors** are counted as *unique people*, deduplicated by a random anonymous ID stored in each browser's `localStorage` (`crypto.randomUUID()` — never your name, email, or CV data). Visiting the site 10 times only ever counts once. The trade-off of any cookieless, login-free approach: the same person on a second device/browser, or after clearing their browser storage, is counted again as a new visitor.
- **CVs Created**, **PDF Downloads**, and **Feedback Submitted** are plain, non-deduplicated counters — if the same person downloads their CV 3 times, the count goes up by 3. This is deliberate: it measures actual usage, not unique users.

Never tracked or sent to any server: CV content, personal information, NRC, uploaded photos, or anything you type into the CV editor.

---

## Setting up the Photo Studio (optional)

The Photo Studio's manual editing (crop/zoom/move/rotate/brightness/contrast/saturation/background/shape) always works, with no setup and no server calls. Only the **"Remove Background (AI)"** button needs configuration — everything else in this section is purely to enable that one feature.

1. Sign up for an AI background-removal provider. The code ships with [remove.bg](https://www.remove.bg/api) wired up by default:
   - Go to [remove.bg/api](https://www.remove.bg/api) and create an account, then choose the plan that fits your expected usage.
   - Copy your **API key** from the remove.bg dashboard.
2. In **Vercel → Project → Settings → Environment Variables**, add:
   ```text
   PHOTO_AI_API_KEY=your-remove.bg-api-key
   PHOTO_AI_PROVIDER=removebg
   ```
3. Redeploy.
4. Test it: in the CV editor, upload a photo, click **Edit Photo**, then **Remove Background (AI)**.

If you'd rather use a different provider (e.g. Photoroom, withoutbg), everything provider-specific is isolated in one function — `removeBackgroundViaProvider()` in `api/photo.js` — so you can add another branch there without touching anything else. Only `PHOTO_AI_PROVIDER=removebg` is implemented out of the box.

If `PHOTO_AI_API_KEY` isn't set, the "Remove Background" button shows a friendly error and a **Try Again** link — the rest of the Photo Studio, and CV creation in general, is completely unaffected. AI is an enhancement here, never a requirement.

**Privacy:** only the one photo actively being edited is ever sent to `/api/photo` (and from there to the AI provider) — never CV content, never other saved CVs' photos, and nothing is logged or stored server-side. The AI only removes the background; it never generates a new face, changes your appearance, or applies beauty filters.

---

## Author

**Neon.dev**

© 2026 Neon.dev
