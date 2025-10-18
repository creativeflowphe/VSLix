import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const getSupabase = () => createServerComponentClient({ cookies });

export async function GET() {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, video_url, autoplay, showFakeBar, barColor, duration, format, width, height, bytes } = body;

    if (!name || !video_url) {
      return NextResponse.json(
        { error: 'Nome e video_url são obrigatórios' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('videos')
      .insert({
        name,
        video_url,
        autoplay: autoplay ?? true,
        show_fake_bar: showFakeBar ?? false,
        bar_color: barColor || '#8b5cf6',
        duration: duration || 0,
        format: format || 'mp4',
        width: width || 0,
        height: height || 0,
        size: bytes || 0,
        views: 0,
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, video: data });
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao salvar vídeo' },
      { status: 500 }
    );
  }
}
