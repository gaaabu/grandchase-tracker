import { readDb } from '@/lib/db';
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

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('session_user_id')?.value;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = readDb();
    const clears = db.daily_clears.filter(c => c.user_id === userId);
    const characters = db.characters;

    const charMap = {};
    characters.forEach(c => charMap[c.id] = c.name);

    // Group by date
    const history = {};
    clears.forEach(clear => {
      if (!history[clear.date]) history[clear.date] = {};
      if (!history[clear.date][clear.character_id]) history[clear.date][clear.character_id] = [];
      
      history[clear.date][clear.character_id].push(DUNGEONS[clear.dungeon_name] || clear.dungeon_name);
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
