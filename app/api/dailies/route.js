import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getResetWindow } from '@/lib/timeUtils';

export const dynamic = 'force-dynamic';

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
      const { lastReset, nextReset } = getResetWindow(c.dungeon_name, now);
      
      // We must handle legacy dates '2026-06-05' and new ISO strings '2026-06-05T...Z'
      const clearTime = new Date(c.date);
      
      // Strict boundary check: completely ignore future clears from time-traveling
      return clearTime >= lastReset && clearTime < nextReset;
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
    const { lastReset, nextReset } = getResetWindow(dungeon_name, now);

    if (cleared) {
      // Check if a clear ALREADY exists in the current active reset cycle
      const { data: existing } = await supabase
        .from('clears')
        .select('id')
        .eq('user_id', userId)
        .eq('character_id', character_id)
        .eq('dungeon_name', dungeon_name)
        .gte('date', lastReset.toISOString())
        .lt('date', nextReset.toISOString())
        .limit(1);
        
      if (!existing || existing.length === 0) {
        // Save the exact UTC timestamp of the clear
        const { error } = await supabase
          .from('clears')
          .insert([{ user_id: userId, character_id, dungeon_name, date: now.toISOString() }]);
        if (error) throw error;
      }
    } else {
      // Uncheck: Delete any clears that happened EXACTLY DURING this current reset cycle
      const { error } = await supabase
        .from('clears')
        .delete()
        .eq('user_id', userId)
        .eq('character_id', character_id)
        .eq('dungeon_name', dungeon_name)
        .gte('date', lastReset.toISOString())
        .lt('date', nextReset.toISOString());
      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
