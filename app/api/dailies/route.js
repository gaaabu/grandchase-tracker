import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('session_user_id')?.value;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    
    if (!date) return NextResponse.json({ error: 'Date is required' }, { status: 400 });

    const { data: clears, error } = await supabase
      .from('clears')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date);
      
    if (error) throw error;
    
    return NextResponse.json(clears);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('session_user_id')?.value;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { character_id, dungeon_name, date, cleared } = body;
    
    if (!character_id || !dungeon_name || !date) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    if (cleared) {
      // Check if exists first to avoid duplicates
      const { data: existing } = await supabase
        .from('clears')
        .select('id')
        .eq('user_id', userId)
        .eq('character_id', character_id)
        .eq('dungeon_name', dungeon_name)
        .eq('date', date)
        .single();
        
      if (!existing) {
        const { error } = await supabase
          .from('clears')
          .insert([{ user_id: userId, character_id, dungeon_name, date }]);
        if (error) throw error;
      }
    } else {
      const { error } = await supabase
        .from('clears')
        .delete()
        .eq('user_id', userId)
        .eq('character_id', character_id)
        .eq('dungeon_name', dungeon_name)
        .eq('date', date);
      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
