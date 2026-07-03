import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { supabase } from '@/lib/supabase';

export async function GET(request) {
  try {
    const userId = await getSessionUser();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { data, error } = await supabase.from('users').select('username').eq('id', userId).single();
    
    if (error || !data) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json({ id: userId, username: data.username });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
