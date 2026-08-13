# Kridavana

A Letterboxd-style diary for video games — log everything you play, rate it out of 10, review it, keep a watchlist, build ranked lists, and share reviews with the community (likes + comments). Full plan in `PRD.md`.

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS · Supabase (Postgres + Auth) · TheGamesDB API

## Setup

1. **Supabase**
   - Create a free project at supabase.com.
   - Open the SQL editor, paste in `supabase/schema.sql`, run it.
   - **Already have data?** Run `supabase/migrations/001_thegamesdb.sql` instead — it renames the external id column and adds the new fields without touching your logs, reviews, watchlist, or lists.
   - In Authentication settings, enable Email auth (Email + Password).
   - Copy the Project URL and `anon` public key from Settings → API.

2. **Email verification via OTP (required for signup to work)**
   - Keep **Confirm email** enabled under Authentication → Sign In / Up (accounts must be verified — do not disable it).
   - Open **Authentication → Emails → Templates → Confirm signup** and replace the body with a template that shows the 6-digit code using `{{ .Token }}` instead of the confirmation-link button (see the template below).
   - Kridavana never sees or stores the code — Supabase Auth generates it, emails it, and validates it via `supabase.auth.verifyOtp({ type: 'signup' })`.

3. **TheGamesDB** (replaces the previous API — free, server-side only)
   - Go to https://thegamesdb.net, log in (or register), and grab your API key from the API Access page.
   - The key is used only by the server (`lib/thegamesdb.ts`) — never prefix it with `NEXT_PUBLIC_`.

4. **Local env**
   ```bash
   cp .env.example .env.local
   # fill in the two Supabase values and THEGAMESDB_API_KEY
   ```

5. **Run it**
   ```bash
   npm install
   npm run dev
   ```
   Open http://localhost:3000, sign up for an account (Supabase auth), then search a game from the Diary page.

   > **Confirm signup email template (OTP)** — paste this into **Authentication → Emails → Templates → Confirm signup** so the email shows the code instead of a link:
   >
   > ```html
   > <h2>Kridavana</h2>
   > <p>Verify your email</p>
   > <p>Your verification code is:</p>
   > <h1 style="letter-spacing: 4px;">{{ .Token }}</h1>
   > <p>Enter this code in Kridavana to verify your account.</p>
   > <p>If you didn't create a Kridavana account, you can ignore this email.</p>
   > ```

6. **Deploy**
   Push to a GitHub repo, import into Vercel, add the same three env vars in the Vercel project settings.

## Project structure

```
app/
  page.tsx                 home dashboard + stats
  login/page.tsx           sign in
  signup/page.tsx          sign up
  verify-email/page.tsx    email OTP verification (6-digit code)
  diary/page.tsx           full log, search-to-add
  watchlist/page.tsx
  lists/page.tsx           list index (pinned + custom)
  lists/new/page.tsx       create a list
  lists/[id]/page.tsx      single list
  game/[id]/page.tsx       game detail + log form + community reviews ([id] = TheGamesDB id)
  u/[username]/page.tsx    public profile (reviews)
  api/games/search/route.ts
  api/logs/route.ts
  api/watchlist/route.ts
  api/lists/route.ts        GET lists / POST create list
  api/lists/items/route.ts  add a game to a list
  api/reviews/route.ts      list public reviews for a game
  api/reviews/[id]/like/route.ts
  api/reviews/[id]/comments/route.ts
components/
  game-card.tsx
  game-search.tsx
  log-form.tsx
  nav.tsx                  nav + auth menu
  review-card feed (review-feed.tsx)   community review with like/comment UI
  ui/rating-meter.tsx      signature 0–10 tick-meter rating control
lib/
  thegamesdb.ts            TheGamesDB adapter (server-only) — the only file that talks to the provider
  supabase/client.ts       browser client
  supabase/server.ts       server component / route handler client
supabase/
  schema.sql               full DB schema + RLS policies (fresh install)
  migrations/001_thegamesdb.sql   upgrade an existing install
```

## What's built

- TheGamesDB game search + caching (posters, descriptions, genres, platforms, developer, publisher, content rating, trailers)
- Email/password auth with sign in / sign up + 6-digit OTP email verification
- Log CRUD (status/platform/rating/review/hours/dates), diary ledger view
- Watchlist, custom lists (+ create page), add-to-list from the game page
- Public community reviews with likes and comments
- Public profiles at `/u/username`
- Home stats: total hours, average rating, completed, currently playing, most-played platform

## Architecture

```
Kridavana UI (React components)
        ↓  fetch() to Kridavana's own routes only
Kridavana server (route handlers + server components)
        ↓  lib/thegamesdb.ts adapter (normalizes everything)
TheGamesDB API
        ↓
game data (posters, descriptions, genres, …)
```

The UI never sees a TheGamesDB response shape directly — `lib/thegamesdb.ts` converts everything into Kridavana's internal `Game` model (`{ id, name, summary, cover_url, first_release_date, genres, platforms, developer, publishers, rating, youtube }`). Swapping providers later means rewriting that one file (plus the `thegamesdb_id` column name).
