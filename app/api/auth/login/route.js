import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { logAudit } from '@/lib/session';

const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export async function POST(request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    // 1. Rate Limiting Check
    if (ip !== 'unknown') {
      const { data: rl } = await supabase.from('rate_limits').select('*').eq('ip_address', ip).single();
      
      if (rl) {
        const lastAttempt = new Date(rl.last_attempt);
        const lockoutTime = new Date(lastAttempt.getTime() + LOCKOUT_MINUTES * 60000);
        
        if (rl.attempts >= MAX_ATTEMPTS && new Date() < lockoutTime) {
          return NextResponse.json({ error: 'Too many failed attempts. Try again later.' }, { status: 429 });
        }
        
        // Reset attempts if lockout period expired
        if (new Date() >= lockoutTime) {
          await supabase.from('rate_limits').update({ attempts: 0 }).eq('ip_address', ip);
        }
      }
    }

    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password required' }, { status: 400 });
    }

    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    
    const { data: user, error } = await supabase
      .from('users')
      .select('id')
      .ilike('username', username)
      .eq('password', hashedPassword)
      .single();
    
    // 2. Failed Login Handling
    if (error || !user) {
      if (ip !== 'unknown') {
        const { data: existingRl } = await supabase.from('rate_limits').select('attempts').eq('ip_address', ip).single();
        if (existingRl) {
          await supabase.from('rate_limits').update({ attempts: existingRl.attempts + 1, last_attempt: new Date().toISOString() }).eq('ip_address', ip);
        } else {
          await supabase.from('rate_limits').insert([{ ip_address: ip, attempts: 1 }]);
        }
      }
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    // 3. Successful Login (Reset Rate Limits)
    if (ip !== 'unknown') {
      await supabase.from('rate_limits').delete().eq('ip_address', ip);
    }

    // 4. Generate Session Token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    // 5. Passive Session Cleanup
    await supabase.from('sessions').delete().eq('user_id', user.id).lt('expires_at', new Date().toISOString());

    // 6. Save Session to DB
    await supabase.from('sessions').insert([{
      user_id: user.id,
      token_hash: tokenHash,
      user_agent: userAgent,
      ip_address: ip,
      expires_at: expiresAt.toISOString()
    }]);

    // 7. Write to Audit Logs
    await logAudit(user.id, 'login_success', { user_agent: userAgent }, request);

    // 8. Set Cookie with Raw Token
    const response = NextResponse.json({ success: true });
    response.cookies.set('session_token', rawToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 // 30 days in seconds
    });
    
    // Clear the old legacy cookie just in case
    response.cookies.delete('session_user_id');

    return response;
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
