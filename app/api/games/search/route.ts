import { NextRequest, NextResponse } from 'next/server';
import { searchGames } from '@/lib/thegamesdb';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q');

  if (!q || q.trim().length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const games = await searchGames(q);

    const results = games.map((g) => ({
      thegamesdb_id: g.id,
      name: g.name,
      summary: g.summary,
      cover_url: g.cover_url,
      first_release_date: g.first_release_date,
      genres: g.genres,
      platforms: g.platforms,
      developer: g.developer,
      rating: g.rating
    }));

    return NextResponse.json({ results });
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : 'Game search failed';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
