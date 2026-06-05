import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getLastReset } from '@/lib/timeUtils';

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('session_user_id')?.value;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Fetch clears from the last 14 days to keep the query fast
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString();

    const { data: clears, error } = await supabase
      .from('clears')
      .select('*')
      .eq('user_id', userId)
      .gte('date', twoWeeksAgo);
      
    if (error) throw error;

    // Filter clears to only those that happened AFTER the most recent reset
    const now = new Date();
    const activeClears = clears.filter(c => {
      const resetTime = getLastReset(c.dungeon_name, now);
      
      // We must handle legacy dates '2026-06-05' and new ISO strings '2026-06-05T...Z'
      // By wrapping c.date in new Date(), JS handles both perfectly!
      // However, legacy '2026-06-05' parses as UTC midnight.
      const clearTime = new Date(c.date);
      
      return clearTime >= resetTime;
    });
    
    return NextResponse.json(activeClears);
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
    const { character_id, dungeon_name, cleared } = body;
    
    if (!character_id || !dungeon_name) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const now = new Date();
    const lastReset = getLastReset(dungeon_name, now);

    if (cleared) {
      // Check if a clear ALREADY exists in the current active reset cycle
      const { data: existing } = await supabase
        .from('clears')
        .select('id')
        .eq('user_id', userId)
        .eq('character_id', character_id)
        .eq('dungeon_name', dungeon_name)
        .gte('date', lastReset.toISOString())
        .limit(1);
        
      if (!existing || existing.length === 0) {
        // Save the exact UTC timestamp of the clear
        const { error } = await supabase
          .from('clears')
          .insert([{ user_id: userId, character_id, dungeon_name, date: now.toISOString() }]);
        if (error) throw error;
      }
    } else {
      // Uncheck: Delete any clears that happened DURING this current reset cycle
      const { error } = await supabase
        .from('clears')
        .delete()
        .eq('user_id', userId)
        .eq('character_id', character_id)
        .eq('dungeon_name', dungeon_name)
        .gte('date', lastReset.toISOString());
      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
