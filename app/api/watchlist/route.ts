import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sign in to use the watchlist.' }, { status: 401 });

  const { thegamesdb_id } = await req.json();

  const { data: game } = await supabase.from('games').select('id').eq('thegamesdb_id', thegamesdb_id).single();
  if (!game) return NextResponse.json({ error: 'Game not found.' }, { status: 404 });

  const { data: existing } = await supabase
    .from('watchlist')
    .select('id')
    .eq('user_id', user.id)
    .eq('game_id', game.id)
    .maybeSingle();

  if (existing) {
    await supabase.from('watchlist').delete().eq('id', existing.id);
    return NextResponse.json({ on_watchlist: false });
  }

  await supabase.from('watchlist').insert({ user_id: user.id, game_id: game.id });
  return NextResponse.json({ on_watchlist: true });
}
