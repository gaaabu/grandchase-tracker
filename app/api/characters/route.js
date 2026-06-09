import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const userId = await getSessionUser();
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
    const userId = await getSessionUser();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    
    // Check if it's a bulk array update (for reordering and bulk save)
    if (Array.isArray(body)) {
      // Use Promise.all with individual updates to avoid upsert errors with missing NOT NULL columns
      const updatePromises = body.map(update => {
        const obj = {};
        if (update.sort_order !== undefined) obj.sort_order = update.sort_order;
        if (update.level !== undefined) obj.level = update.level;
        if (update.ta !== undefined) obj.ta = update.ta;
        if (update.awakened !== undefined) obj.awakened = update.awakened;
        
        return supabase
          .from('characters')
          .update(obj)
          .eq('id', update.id)
          .eq('user_id', userId);
      });

      const results = await Promise.all(updatePromises);
      const errors = results.filter(r => r.error).map(r => r.error);
      if (errors.length > 0) throw errors[0];
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
