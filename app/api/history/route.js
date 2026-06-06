import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const DUNGEONS = {
  'crucible': 'Crucible',
  'sod': 'Sanctum of Destruction',
  'wl': 'Wizards Labyrinth',
  'berkas': 'Berkas Lair',
  'tod': 'Tower of Disappearance',
  'loj': 'Land of Judgement',
  'infinity': 'Infinity Cloister',
  'abyssal': 'Abyssal Path',
  'void_invasion': 'Void Invasion',
  'void_taint': 'Void Taint',
  'void_nightmare': 'Void Nightmare'
};

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('session_user_id')?.value;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: clears, error: clearsError } = await supabase
      .from('clears')
      .select('*')
      .eq('user_id', userId);
      
    if (clearsError) throw clearsError;

    const { data: characters, error: charsError } = await supabase
      .from('characters')
      .select('id, name')
      .eq('user_id', userId);
      
    if (charsError) throw charsError;

    const charMap = {};
    characters.forEach(c => charMap[c.id] = c.name);

    // Group by date (converted to PHT to ensure accurate calendar days)
    const history = {};
    clears.forEach(clear => {
      const d = new Date(clear.date);
      d.setUTCHours(d.getUTCHours() + 8); // Convert UTC to PHT (UTC+8)
      
      const year = d.getUTCFullYear();
      const month = String(d.getUTCMonth() + 1).padStart(2, '0');
      const day = String(d.getUTCDate()).padStart(2, '0');
      const clearDate = `${year}-${month}-${day}`;

      if (!history[clearDate]) history[clearDate] = {};
      if (!history[clearDate][clear.character_id]) history[clearDate][clear.character_id] = [];
      
      history[clearDate][clear.character_id].push(DUNGEONS[clear.dungeon_name] || clear.dungeon_name);
    });

    const formattedHistory = {};
    Object.keys(history).forEach(date => {
      formattedHistory[date] = [];
      Object.keys(history[date]).forEach(charId => {
        formattedHistory[date].push({
          character_name: charMap[charId] || 'Unknown',
          clears: history[date][charId]
        });
      });
    });

    return NextResponse.json(formattedHistory);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
