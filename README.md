# WA Activity Monitor

A dark, mobile-first web app for logging WhatsApp contact activity —
**honestly**. There is no WhatsApp integration in this project, by design.

## What this app actually does

Data comes from exactly two legitimate sources, both clearly labeled:

1. **Demo mode** — simulated contacts and events so you can preview every
   screen. A yellow banner on every page reads
   **“DEMO DATA — not real WhatsApp activity.”**
2. **Consent-based manual log** — you record a status change you personally
   observed, and only for contacts whose consent status is **“granted”**.

## What this app does NOT do

- ❌ No live WhatsApp tracking. WhatsApp offers **no official API** for
  another person's online/offline status.
- ❌ No Baileys, whatsapp-web.js, puppeteer, scraping, or QR pairing.
- ❌ Never asks for WhatsApp passwords, auth codes, or session cookies.
- ❌ Never generates fake status events or notifications.
- ❌ Email alerts are a stored preference only — no email is actually sent
  (sending mail requires a paid service, which this project avoids).

## Run locally (free, no keys needed)

```bash
npm install
npm run dev
```

Open http://localhost:3000. Demo mode is on by default — turn it off in
Settings to see only your own manually logged data.

Production build check:

```bash
npm run build
npm start
```

## Free deployment (no card needed)

**Vercel (hobby tier, free):**
1. Push this folder to a GitHub repo.
2. Import it at https://vercel.com/new — framework preset: Next.js.
3. No environment variables are required for local mode.
4. Deploy. Done.

**Supabase (free tier, optional — only for cloud sync):**
1. Create a free project at https://supabase.com.
2. In the Supabase SQL editor, run `supabase/schema.sql` from this repo.
3. Add the owner trigger shown at the bottom of `schema.sql` (or the app
   will report RLS insert errors while keeping local data safe).
4. In Vercel, set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Redeploy. The Settings page will show “Supabase” as the data source and
   offer email/password sign-in. Without these variables, the app runs fully
   in local mode — nothing is faked.

## Pages

| Route | What it does |
| --- | --- |
| `/` | Dashboard: selected-contact status card, last change, total sessions, today's summary, 7-day session chart, manual log form |
| `/history` | Timeline with daily/weekly/monthly/all filters, contact search, pagination (10/page), real CSV export |
| `/notifications` | Browser-notification toggle (real permission request + test), email-alert preference (stored only, not sent) |
| `/contacts` | Add/remove contacts with validation, consent badges (granted/pending/revoked) |
| `/settings` | Demo-mode toggle, data-source indicator, optional Supabase auth, clear-all-data, limitations |

## Tech

Next.js 14 (App Router) + TypeScript + Tailwind CSS. Local data lives in
`localStorage` (`wa-activity-monitor-v1`). Supabase is optional and inert
unless its env vars are set.

## WhatsApp limitations (please read)

WhatsApp does not publish a presence API. Tools that claim to show another
person's live online status in real time either scrape WhatsApp Web (against
its terms, and a ban risk for the linked number) or fabricate data. This
project refuses both paths: if you want to track activity, log what you
personally observe, with the contact's consent.
