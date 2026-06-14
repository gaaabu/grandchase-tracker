import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { logAudit } from '@/lib/session';

const characterNames = [
  "Rufus", "Uno", "Lass", "Dio", "Mari", "Kallia", "Arme", "Ronan", 
  "Ryan", "Veigas", "Elesis", "Edel", "Jin", "Lire", "Asin", "Decanee", 
  "Lime", "Ai", "Rin", "Amy", "Zero", "Sieghart", "Iris", "Ley"
];

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password required' }, { status: 400 });
    }

    if (password.length < 8 || password.length > 24) {
      return NextResponse.json({ error: 'Password must be between 8 and 24 characters' }, { status: 400 });
    }
    if (!/\d/.test(password)) {
      return NextResponse.json({ error: 'Password must contain at least 1 number' }, { status: 400 });
    }

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('username')
      .ilike('username', username)
      .single();

    if (existingUser) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 400 });
    }

    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    const newUserId = crypto.randomUUID();

    // Insert user
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([{ id: newUserId, username, password: hashedPassword }])
      .select()
      .single();

    if (insertError) throw insertError;

    await logAudit(newUser.id, 'registration_success', { user_agent: request.headers.get('user-agent') }, request);

    // Generate roster for this user
    const newCharacters = characterNames.map((name, i) => ({
      id: Date.now().toString() + i, // unique enough for string ID
      user_id: newUser.id,
      name,
      level: 1,
      ta: 0,
      awakened: false,
      sort_order: i + 1
    }));

    const { error: charsError } = await supabase
      .from('characters')
      .insert(newCharacters);

    if (charsError) throw charsError;
    
    // Auto login
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await supabase.from('sessions').insert([{
      user_id: newUser.id,
      token_hash: tokenHash,
      user_agent: userAgent,
      ip_address: ip,
      expires_at: expiresAt.toISOString()
    }]);

    const response = NextResponse.json({ success: true });
    response.cookies.set('session_token', rawToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60
    });
    response.cookies.delete('session_user_id');

    return response;
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
