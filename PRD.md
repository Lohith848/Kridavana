# Kridavana — Product Plan (working title)

*A Letterboxd-style diary for video games. Log everything you play, rate it, review it, share it with the community, and watch your taste take shape over time.*

---

## 1. Why this exists

Trackers like Backloggd, GG, and SavePoint already prove the demand for this category. This project isn't trying to out-feature them — it's an opinionated tool built for real play habits, with a UI that doesn't feel like a spreadsheet with a poster glued on.

**Differentiators to lean into:**
- Session-level logging — hours per sitting, not just a lifetime total
- Per-platform logging — the same game replayed on PC and Switch are two entries, not one overwritten row
- A rating and review experience that feels like writing a journal entry, not filling a form
- A restrained, considered visual identity (see §6) instead of a generic dashboard look
- A public social layer — reviews are community-facing with likes and comments, like Letterboxd

---

## 2. Core features

| Feature | Detail | Status |
|---|---|---|
| Game search & add | TheGamesDB-powered: official posters, description, genres, platforms, developer, publisher, content rating, trailers | ✅ Built |
| Accounts | Email/password sign up + sign in with 6-digit email OTP verification (Supabase Auth), protected routes, public profiles | ✅ Built |
| Status | Playing / Completed / Dropped / On Hold / Backlog / Wishlist | ✅ Built |
| Log entry | Platform, hours played, start/finish dates, rating (0–10, half-point precision), written review | ✅ Built |
| Diary | Every log entry, reverse-chronological, grouped by month with a date rail | ✅ Built |
| Watchlist | Games marked "want to play," toggleable from any game page | ✅ Built |
| Custom lists | Freeform named lists, ranked or unranked, games can belong to many lists | ✅ Built |
| Home stats | Total hours, average rating, completed, playing now, top platform | ✅ Built |
| Public reviews | Reviews appear on the game page for every user, newest first | ✅ Built |
| Likes & comments | One-click like toggle + threaded comments on any review | ✅ Built |
| Profiles | `/u/username` pages showing a user's public reviews | ✅ Built |
| Best 100 / Top 10 of the Year | Special pinned ranked lists | 🚧 Scaffolded (create a ranked list and pin it) |
| Year-in-Review "Wrapped" | Stats recap page | ⏳ Next |

## 3. Data model (Supabase / Postgres)

```
games            -- cached TheGamesDB data, keyed by thegamesdb_id
  id (pk), thegamesdb_id (unique), name, cover_url, summary,
  first_release_date, genres (text[]), platforms (text[]), developer,
  publishers (text[]), rating (ESRB/PEGI string), youtube

logs             -- one row per playthrough (private)
  id (pk), user_id, game_id (fk -> games), status,
  platform, rating (numeric, nullable), review (text, nullable),
  hours_played (numeric, nullable), started_on (date), finished_on (date), created_at

watchlist        -- private
  id (pk), user_id, game_id (fk -> games), added_at, note

lists            -- private
  id (pk), user_id, name, description, is_ranked (bool), is_pinned (bool), kind

list_items
  id (pk), list_id (fk -> lists), game_id (fk -> games), rank (int, nullable)

profiles         -- public
  id (pk, = auth.users.id), username (unique), bio, avatar_url, created_at

reviews          -- public (mirrored from log entries that have content)
  id (pk), user_id (fk -> profiles), game_id (fk -> games), log_id (fk -> logs),
  rating (numeric, nullable), body (text, nullable), created_at, updated_at,
  unique (user_id, game_id)

review_likes     -- public
  id (pk), review_id (fk -> reviews), user_id (fk -> profiles), unique (review_id, user_id)

review_comments  -- public
  id (pk), review_id (fk -> reviews), user_id (fk -> profiles), body, created_at
```

Full SQL with RLS policies is in `supabase/schema.sql`, ready to run in the Supabase SQL editor.
RLS: `games` + all social tables are readable by any signed-in user; `logs`/`watchlist`/`lists` are strictly per-owner.

## 4. TheGamesDB integration

- **Endpoints used:** `Games/ByGameName` (search), `Games/ByGameID` (detail), `Games/Images` (artwork selection), `Games/Videos` (trailer). Platform/genre/developer/publisher names resolve from the include maps the game endpoints return — no extra metadata requests.
- **Normalization:** every response is converted into Kridavana's internal `Game` model by `lib/thegamesdb.ts`. The UI has zero knowledge of TheGamesDB's field names, so the provider can be swapped again by rewriting that single file.
- **Security:** `THEGAMESDB_API_KEY` lives in `.env.local`, read only by the server. It is never a `NEXT_PUBLIC_` var and never reaches the browser.
- **Caching:** search responses are cached 5 minutes via Next's fetch cache; game details/images are cached long-term in the local `games` table on first view, so opening the same game never hits the API twice.
- **Resilience:** missing images fall back (boxart → fanart → banner → screenshot → "no cover"), missing fields render as empty states, images/videos failures are best-effort, and 401/403/429/5xx become friendly errors instead of crashes.
- See `lib/thegamesdb.ts` for the adapter and `app/api/games/search/route.ts` for the search endpoint.

## 5. Visual direction

- **Palette:** charcoal background (`#10121A`), raised surface (`#171A24`), off-white text (`#F3EFE6`), muted text (`#9CA0B3`), signature amber accent (`#E8A33D`) used only for ratings/highlights, teal for "Playing" status.
- **Type:** Fraunces for headings, Inter for body, JetBrains Mono for anything numeric (hours, dates, ratings) — ties the "data" of a played game to a save-file feel.
- **Signature element:** the rating control is a 21-tick horizontal meter (0–10 in half steps) rather than stars.
- **Diary layout:** a vertical date rail on the left, entries stacked like a ledger.

## 6. Setup checklist

1. Create a free Supabase project → run `supabase/schema.sql` in the SQL editor → enable Email + Password auth.
2. Get a free TheGamesDB API key at thegamesdb.net (login → API Access).
3. Copy `.env.example` → `.env.local` and fill in the two Supabase values + `THEGAMESDB_API_KEY`.
4. `npm install`, then `npm run dev`.
5. Deploy to Vercel, add the same three env vars there.

## 7. Open questions (revisit once you're using it)

- Naming — "Kridavana" is a placeholder, worth a real name pass once it feels real
- Whether "hours played" should be free-entry or a running timer
- Whether Best 100 / Top 10 of Year should auto-suggest from your 9–10 rated logs
- Whether profile bios/avatars need editing UI, and whether profiles should show watchlists/lists publicly
- Moderation — what to do about abusive comments/reviews once the community grows
