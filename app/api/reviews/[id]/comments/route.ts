import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const reviewId = Number(params.id);

  const { data: comments, error } = await supabase
    .from('review_comments')
    .select('id, body, created_at, profiles(username)')
    .eq('review_id', reviewId)
    .order('created_at', { ascending: true })
    .limit(100);

  if (error) return NextResponse.json({ error: 'Could not load comments.' }, { status: 500 });

  return NextResponse.json({
    comments: (comments ?? []).map((c: any) => ({
      id: c.id,
      body: c.body,
      created_at: c.created_at,
      username: c.profiles?.username ?? 'unknown'
    }))
  });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sign in to comment.' }, { status: 401 });

  const reviewId = Number(params.id);
  const { body } = await req.json();
  if (!body || body.trim().length === 0) {
    return NextResponse.json({ error: 'Comment cannot be empty.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('review_comments')
    .insert({ review_id: reviewId, user_id: user.id, body: body.trim().slice(0, 1000) })
    .select('id, body, created_at, profiles(username)')
    .single();

  if (error) return NextResponse.json({ error: 'Could not post comment.' }, { status: 500 });

  const created = data as unknown as { id: number; body: string; created_at: string; profiles: { username: string } };
  return NextResponse.json({
    comment: {
      id: created.id,
      body: created.body,
      created_at: created.created_at,
      username: created.profiles?.username ?? 'unknown'
    }
  });
}
