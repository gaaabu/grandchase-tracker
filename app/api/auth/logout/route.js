import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSessionUser, logAudit } from '@/lib/session';
import crypto from 'crypto';

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session_token')?.value;
    const userId = await getSessionUser();

    let logoutAll = false;
    try {
      const body = await request.json();
      logoutAll = body.logoutAll === true;
    } catch (e) {
      // Body might be empty
    }

    if (userId) {
      if (logoutAll) {
        await supabase.from('sessions').delete().eq('user_id', userId);
        await logAudit(userId, 'logout_all', {}, request);
      } else if (token) {
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        await supabase.from('sessions').delete().eq('token_hash', tokenHash);
        await logAudit(userId, 'logout_single', {}, request);
      }
    }

    const response = NextResponse.json({ success: true });
    response.cookies.delete('session_token');
    response.cookies.delete('session_user_id'); // clean up legacy cookie

    return response;
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
