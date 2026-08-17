# Kridavana

A social diary for video games.

Kridavana is a platform for discovering, logging, rating, reviewing, and organizing the games you play.

## Features

- Game diary (playing, completed, dropped, on hold, backlog, wishlist)
- Ratings out of 10
- Reviews with likes and comments
- Watchlist
- Ranked and unranked lists
- Personal gaming statistics (hours logged, average rating, games completed)
- Passwordless sign-in via email OTP
- Game metadata and posters from TheGamesDB

## Tech Stack

| Technology | Purpose |
|---|---|
| Next.js 14 (App Router) | Application framework |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| Supabase | Database and authentication |
| TheGamesDB | Game data, metadata, and posters |

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/Lohith848/Kridavana.git
cd Kridavana
npm install
```

### 2. Set up Supabase

Create a project at https://supabase.com.

Run the database schema:

```text
supabase/schema.sql
```

If you are upgrading an existing database, run the migration instead:

```text
supabase/migrations/001_thegamesdb.sql
```

The migration preserves existing diaries, reviews, watchlists, and lists.

#### Authentication (email OTP, no passwords)

Kridavana uses **passwordless email OTP** — users enter their email, receive a 6-digit code, and are signed in automatically. New accounts are created on first sign-in, so there is no separate signup page.

1. In **Authentication → Sign In / Up**, enable **Email** and leave **Confirm email** enabled.
2. New Supabase projects no longer ship a usable built-in email service, so you **must configure Custom SMTP** under **Authentication → Emails** — otherwise OTP emails fail with `Error sending magic link email`.
   - A free option is [Resend](https://resend.com): add and verify a domain you own (SPF/DKIM records), then enter `smtp.resend.com` / port `587` / username `resend` / your `re_...` API key as the password, and a sender address on your verified domain (e.g. `noreply@yourdomain.com`).
   - For quick testing before DNS verifies, Resend's `onboarding@resend.dev` sender works but only delivers to the email address you registered with Resend.

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL (Settings → API) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase public `anon` key (Settings → API) |
| `THEGAMESDB_API_KEY` | TheGamesDB API key (https://thegamesdb.net → API Access). Server-side only — never prefix with `NEXT_PUBLIC_` |

Never commit `.env.local` — it is already gitignored.

### 4. Run it

```bash
npm run dev
```

Open http://localhost:3000, enter your email, and sign in with the 6-digit code you receive. Then search a game from the Diary page to add your first log.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm start` | Run the production build |
| `npm run lint` | Run the linter |

## Project Structure

```text
app/                  Next.js App Router pages and API routes
components/           React components (UI primitives in components/ui)
lib/                  Server helpers (Supabase clients, TheGamesDB adapter, auth)
supabase/             Database schema and migrations
```

## License

MIT
