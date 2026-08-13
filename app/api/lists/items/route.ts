import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sign in to add games to lists.' }, { status: 401 });

  const { thegamesdb_id, list_id, rank } = await req.json();

  // game must exist locally
  const { data: game } = await supabase.from('games').select('id').eq('thegamesdb_id', thegamesdb_id).single();
  if (!game) return NextResponse.json({ error: 'Game not found.' }, { status: 404 });

  // list must belong to the user
  const { data: list } = await supabase
    .from('lists')
    .select('id')
    .eq('id', list_id)
    .eq('user_id', user.id)
    .single();
  if (!list) return NextResponse.json({ error: 'List not found.' }, { status: 404 });

  const { error } = await supabase
    .from('list_items')
    .upsert({ list_id, game_id: game.id, rank: rank ?? null }, { onConflict: 'list_id,game_id' });

  if (error) {
    console.error(error);
    return NextResponse.json({ error: 'Could not add to list.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
