import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase';
import crypto from 'crypto';

/**
 * Validates the session_token cookie against the database
 * @returns {Promise<string|null>} The user_id if valid, null otherwise
 */
export async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session_token')?.value;
  
  if (!token) return null;

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const { data: session, error } = await supabase
    .from('sessions')
    .select('user_id, expires_at')
    .eq('token_hash', tokenHash)
    .single();

  if (error || !session) return null;

  if (new Date(session.expires_at) < new Date()) {
    // Optionally: delete the expired session from the database here
    return null; 
  }

  return session.user_id;
}

/**
 * Silently logs an audit event to the database
 */
export async function logAudit(userId, action, details = {}, request = null) {
  let ip_address = null;
  if (request) {
    ip_address = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  }

  // Fire and forget (do not throw if it fails)
  await supabase.from('audit_logs').insert([{
    user_id: userId,
    action,
    details,
    ip_address
  }]);
}
