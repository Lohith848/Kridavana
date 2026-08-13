-- Migration: RAWG → TheGamesDB (run once in the Supabase SQL editor)
--
-- Renames the games cache's external id column and adds TheGamesDB fields.
-- User data (logs, watchlist, lists, list_items, reviews) is untouched — it
-- references games.id, which does not change. Old cached game rows simply
-- become unreachable orphans; they'll be re-fetched from TheGamesDB the next
-- time someone opens the game. Nothing is deleted.

alter table games rename column rawg_id to thegamesdb_id;

alter table games add column if not exists publishers text[] default '{}';
alter table games add column if not exists rating text;
alter table games add column if not exists youtube text;

-- The RAWG-specific Metacritic column is no longer used. It's safe to drop,
-- but leaving it harms nothing — uncomment to remove it.
-- alter table games drop column if exists metacritic;
