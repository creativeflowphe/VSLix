import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  try {
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
    const body = await request.json();
    const { name, url, autoplay, showFakeBar, barColor, duration, format, width, height, bytes } = body;

    if (!name || !url) {
      return NextResponse.json(
        { error: 'Nome e URL são obrigatórios' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('videos')
      .insert({
        name,
        url,
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
