import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Sign in to log a game.' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const { thegamesdb_id, status, platform, rating, review, hours_played, started_on, finished_on, log_id } = body as any;

  const { data: game, error: gameError } = await supabase
    .from('games')
    .select('id')
    .eq('thegamesdb_id', thegamesdb_id)
    .single();

  if (gameError || !game) {
    return NextResponse.json({ error: 'Game not found — open it from search first.' }, { status: 404 });
  }

  const payload = {
    user_id: user.id,
    game_id: game.id,
    status,
    platform: platform || null,
    rating: rating ?? null,
    review: review || null,
    hours_played: hours_played ?? null,
    started_on: started_on || null,
    finished_on: finished_on || null
  };

  const { data, error } = log_id
    ? await supabase.from('logs').update(payload).eq('id', log_id).eq('user_id', user.id).select().single()
    : await supabase.from('logs').insert(payload).select().single();

  if (error) {
    console.error(error);
    return NextResponse.json({ error: 'Could not save the log entry.' }, { status: 500 });
  }

  // Mirror the entry into the public reviews feed whenever it has a rating
  // and/or a written review. Comment/like counts survive edits because we
  // upsert on (user_id, game_id) instead of deleting.
  if (rating != null || (review && review.trim().length > 0)) {
    const { error: upsertError } = await supabase.from('reviews').upsert(
      {
        user_id: user.id,
        game_id: game.id,
        log_id: data.id,
        rating: rating ?? null,
        body: (review && review.trim().length > 0 ? review : null)
      },
      { onConflict: 'user_id,game_id' }
    );
    if (upsertError) {
      // Log but don't fail the request — the log itself was saved successfully
      console.error('Review upsert failed:', upsertError);
    }
  }

  return NextResponse.json({ log: data });
}

export async function DELETE(req: NextRequest) {
  const supabase = createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Sign in to delete log entries.' }, { status: 401 });
  }

  const logId = Number(req.nextUrl.searchParams.get('id'));
  if (!logId) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  // detach any public review from this log before deleting it
  await supabase
    .from('reviews')
    .update({ log_id: null })
    .eq('log_id', logId)
    .eq('user_id', user.id);

  const { error } = await supabase.from('logs').delete().eq('id', logId).eq('user_id', user.id);
  if (error) {
    console.error(error);
    return NextResponse.json({ error: 'Could not delete the log entry.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
