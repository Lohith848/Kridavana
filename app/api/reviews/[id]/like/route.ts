import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sign in to like reviews.' }, { status: 401 });

  const reviewId = Number(params.id);

  const { data: existing } = await supabase
    .from('review_likes')
    .select('id')
    .eq('review_id', reviewId)
    .eq('user_id', user.id)
    .maybeSingle();

  let liked = false;
  if (existing) {
    const { error } = await supabase.from('review_likes').delete().eq('id', existing.id);
    if (error) return NextResponse.json({ error: 'Could not unlike.' }, { status: 500 });
  } else {
    const { error } = await supabase.from('review_likes').insert({ review_id: reviewId, user_id: user.id });
    if (error) return NextResponse.json({ error: 'Could not like.' }, { status: 500 });
    liked = true;
  }

  const { count } = await supabase
    .from('review_likes')
    .select('id', { count: 'exact', head: true })
    .eq('review_id', reviewId);

  return NextResponse.json({ liked, like_count: count ?? 0 });
}
