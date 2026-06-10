"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const hasValidLength = password.length >= 8 && password.length <= 24;
  const hasNumber = /\d/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (!username) return setError('Username is required');
    if (!password) return setError('Password is required');
    if (!hasValidLength) return setError('Password must be 8-24 characters');
    if (!hasNumber) return setError('Password must contain at least 1 number');
    if (password !== confirmPassword) return setError('Passwords do not match');

    setIsLoading(true);

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (res.ok) {
      router.push('/summary');
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error || 'Failed to register');
      setIsLoading(false);
    }
  };

  return (
    <main className="container auth-container">
      <div className="auth-box">
        <h1 className="title" style={{ textAlign: 'center', marginBottom: '2rem' }}>Create Account</h1>
        <form onSubmit={handleRegister} className="auth-form">
          {error && <div className="error-message">{error}</div>}
          <div className="form-group">
            <label>GrandChase Username</label>
            <input 
              type="text" 
              className="stat-input" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              required 
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              className="stat-input" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
            />
            <div className="password-requirements" style={{ marginTop: '0.75rem', fontSize: '0.85rem' }}>
              <div style={{ color: hasValidLength ? 'var(--status-done)' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                {hasValidLength ? '✓' : '○'} 8-24 characters
              </div>
              <div style={{ color: hasNumber ? 'var(--status-done)' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {hasNumber ? '✓' : '○'} At least 1 number
              </div>
            </div>
          </div>
          <div className="form-group">
            <label>Confirm Password</label>
            <input 
              type="password" 
              className="stat-input" 
              value={confirmPassword} 
              onChange={e => setConfirmPassword(e.target.value)} 
              required 
            />
            <div className="password-requirements" style={{ marginTop: '0.75rem', fontSize: '0.85rem' }}>
              <div style={{ color: passwordsMatch ? 'var(--status-done)' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                {passwordsMatch ? '✓' : '○'} Passwords match
              </div>
            </div>
          </div>
          <button type="submit" className="btn-primary" disabled={isLoading} style={{ width: '100%', marginTop: '1rem', padding: '1rem', fontSize: '1.1rem' }}>
            {isLoading ? 'Registering...' : 'Register'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '2rem' }}>
          Already have an account? <Link href="/" style={{ color: 'var(--accent-primary)', textDecoration: 'underline', fontWeight: 'bold' }}>Login here</Link>
        </p>
      </div>
    </main>
  );
}
