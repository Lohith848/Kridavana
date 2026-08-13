
# Kridavana

A social diary for video games.

Kridavana is a Letterboxd-inspired platform for discovering, logging, rating, reviewing, and organizing the games you play.

## Features

- Game diary
- Ratings out of 10
- Reviews
- Watchlist
- Ranked lists
- Likes and comments
- Personal gaming statistics
- Email OTP verification

## Tech Stack

| Technology | Purpose |
|---|---|
| Next.js 14 | Application framework |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| Supabase | Database and authentication |
| TheGamesDB | Game data and metadata |

## Getting Started

### 1. Clone and install

```bash
git clone <repository-url>
cd kridavana
npm install
```

### 2. Configure Supabase

Create a project at https://supabase.com.

Run the database schema from:

```text
supabase/schema.sql
```

If you are upgrading an existing database, run:

```text
supabase/migrations/001_thegamesdb.sql
```

The migration preserves existing diaries, reviews, watchlists, and lists.

In Supabase Authentication, enable:

- Email
- Password
- Confirm email

Copy the project URL and public/anon key from the Supabase API settings.

### 3. Configure email OTP

Kridavana uses a six-digit email OTP instead of a confirmation link.

In:

```text
Supabase → Authentication → Emails → Templates → Confirm signup
```

use the following template:

```html
<h2>Kridavana</h2>
<p>Verify your email</p>
<p>Your verification code is:</p>
<h1 style="letter-spacing: 4px;">{{ .Token }}</h1>
<p>Enter this code in Kridavana to verify your account.</p>
<p>If you didn't create a Kridavana account, you can ignore this email.</p>
```

Supabase generates and validates the OTP. Kridavana does not store verification codes.

### 4. Configure TheGamesDB

Create an account at https://thegamesdb.net and generate an API key.

The key is used only on the server and must never be exposed to the browser.

### 5. Environment variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
THEGAMESDB_API_KEY=your_thegamesdb_api_key
```

Do not prefix `THEGAMESDB_API_KEY` with `NEXT_PUBLIC_`.

### 6. Run locally

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Create an account, verify your email, and start logging games.

## Project Structure

```text
app/
├── page.tsx
├── login/
│   └── page.tsx
├── signup/
│   └── page.tsx
└── verify-email/
    └── page.tsx

lib/
├── supabase/
└── thegamesdb.ts

supabase/
├── schema.sql
└── migrations/
    └── 001_thegamesdb.sql
```

## Deployment

Kridavana is designed to deploy on Vercel.

1. Push the repository to GitHub.
2. Import the repository into Vercel.
3. Add the required environment variables.
4. Deploy.

## Status

Kridavana is currently under active development.

## Author

LOHITH G

