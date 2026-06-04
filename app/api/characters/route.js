import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('session_user_id')?.value;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: characters, error } = await supabase
      .from('characters')
      .select('*')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true });
      
    if (error) throw error;
      
    return NextResponse.json(characters);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('session_user_id')?.value;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    
    // Check if it's a bulk array update (for reordering)
    if (Array.isArray(body)) {
      const updates = body.map(update => ({
        id: update.id,
        user_id: userId,
        sort_order: update.sort_order
      }));
      
      const { error } = await supabase
        .from('characters')
        .upsert(updates, { onConflict: 'id' });

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    // Existing single character update
    const { id, level, ta, awakened } = body;
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const updates = {};
    if (level !== undefined) updates.level = level;
    if (ta !== undefined) updates.ta = ta;
    if (awakened !== undefined) updates.awakened = awakened;

    const { error } = await supabase
      .from('characters')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
