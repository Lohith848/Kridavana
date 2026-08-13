
Kridavana

A social diary for video games.

Kridavana is a Letterboxd-inspired platform for discovering, tracking, rating, reviewing, and organizing the games you play.

---

Overview

Kridavana lets you build a personal history of your gaming life.

Track games you've played, rate them out of 10, write reviews, maintain a watchlist, create ranked lists, and interact with other players through likes and comments.

---

Features

- Game diary and play history
- Ratings from 1–10
- Reviews and community discussions
- Personal watchlist
- Custom ranked lists
- Likes and comments
- Gaming statistics
- Email authentication with OTP verification
- Game discovery powered by TheGamesDB

---

Stack

Layer| Technology
Framework| Next.js 14
Language| TypeScript
Styling| Tailwind CSS
Database| PostgreSQL
Authentication| Supabase Auth
Game Data| TheGamesDB
Deployment| Vercel

---

Getting Started

Requirements

- Node.js
- npm
- Supabase project
- TheGamesDB API key

Installation

git clone <repository-url>
cd kridavana
npm install

Environment

Create ".env.local":

NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
THEGAMESDB_API_KEY=your_thegamesdb_api_key

The TheGamesDB key is server-side only and must never use the "NEXT_PUBLIC_" prefix.

---

Database

Create a Supabase project and run:

supabase/schema.sql

For existing installations, use:

supabase/migrations/001_thegamesdb.sql

The migration updates the game-data structure without removing existing diaries, reviews, watchlists, or lists.

---

Authentication

Kridavana uses Supabase Authentication with email and password.

New accounts are verified using a 6-digit email OTP rather than a confirmation link.

Configure the following in Supabase:

Authentication
└── Emails
    └── Templates
        └── Confirm signup

Use "{{ .Token }}" in the email template to display the verification code.

OTP generation and verification are handled by Supabase Auth. Kridavana does not store verification codes.

---

Game Data

Kridavana uses TheGamesDB for game metadata.

The API is accessed exclusively from the server through:

lib/thegamesdb.ts

This keeps the API key out of the client and allows the game-data layer to be replaced independently from the rest of the application.

---

Development

Start the development server:

npm run dev

Then open:

http://localhost:3000

---

Project Structure

kridavana/
├── app/
│   ├── login/
│   ├── signup/
│   ├── verify-email/
│   └── ...
│
├── lib/
│   ├── supabase/
│   └── thegamesdb.ts
│
├── supabase/
│   ├── schema.sql
│   └── migrations/
│
├── public/
├── .env.example
├── package.json
└── README.md

---

Deployment

Kridavana is designed to run on Vercel.

1. Push the repository to GitHub.
2. Import the project into Vercel.
3. Add the required environment variables.
4. Deploy.

---

Vision

Kridavana is built around a simple idea:

«Your gaming history deserves to be remembered.»

Not just what you played, but what you thought about it.

---

Status

In development

More features and community functionality are actively being built.
