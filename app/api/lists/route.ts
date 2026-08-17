import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sign in to create lists.' }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const { name, description, is_ranked } = body as any;
  if (!name || name.trim().length === 0) {
    return NextResponse.json({ error: 'Give the list a name.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('lists')
    .insert({
      user_id: user.id,
      name: name.trim().slice(0, 100),
      description: description?.trim().slice(0, 500) || null,
      is_ranked: !!is_ranked
    })
    .select('id')
    .single();

  if (error) {
    console.error(error);
    return NextResponse.json({ error: 'Could not create the list.' }, { status: 500 });
  }

  return NextResponse.json({ id: data.id });
}

export async function GET() {
  const supabase = createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ lists: [] });

  const { data: lists } = await supabase
    .from('lists')
    .select('id, name')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100);

  return NextResponse.json({ lists: lists ?? [] });
}
