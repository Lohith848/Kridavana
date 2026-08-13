import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const thegamesdbId = Number(req.nextUrl.searchParams.get('thegamesdb_id'));
  if (!thegamesdbId) return NextResponse.json({ error: 'thegamesdb_id is required' }, { status: 400 });

  // local games row id
  const { data: localGame } = await supabase.from('games').select('id').eq('thegamesdb_id', thegamesdbId).single();
  if (!localGame) return NextResponse.json({ reviews: [] });

  const { data: reviews, error } = await supabase
    .from('reviews')
    .select(
      `id, rating, body, created_at, updated_at,
       profiles(username),
       review_likes(count),
       review_comments(count)`
    )
    .eq('game_id', localGame.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error(error);
    return NextResponse.json({ error: 'Could not load reviews.' }, { status: 500 });
  }

  let likedIds = new Set<number>();
  if (user) {
    const { data: likes } = await supabase
      .from('review_likes')
      .select('review_id')
      .in(
        'review_id',
        (reviews ?? []).map((r: any) => r.id)
      )
      .eq('user_id', user.id);
    likedIds = new Set((likes ?? []).map((l: any) => l.review_id));
  }

  const out = (reviews ?? []).map((r: any) => ({
    id: r.id,
    rating: r.rating,
    body: r.body,
    created_at: r.created_at,
    username: r.profiles?.username ?? 'unknown',
    like_count: r.review_likes?.[0]?.count ?? 0,
    comment_count: r.review_comments?.[0]?.count ?? 0,
    liked_by_me: likedIds.has(r.id)
  }));

  return NextResponse.json({ reviews: out });
}
