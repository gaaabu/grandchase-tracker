"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (res.ok) {
      router.push('/summary');
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error || 'Failed to login');
      setIsLoading(false);
    }
  };

  return (
    <main className="container auth-container">
      <div className="auth-box">
        <h1 className="title" style={{ textAlign: 'center', marginBottom: '2rem' }}>GrandChase Tracker</h1>
        <form onSubmit={handleLogin} className="auth-form">
          {error && <div className="error-message">{error}</div>}
          <div className="form-group">
            <label>Username</label>
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
          </div>
          <button type="submit" className="btn-primary" disabled={isLoading} style={{ width: '100%', marginTop: '1rem', padding: '1rem', fontSize: '1.1rem' }}>
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '2rem' }}>
          Don't have an account? <Link href="/register" style={{ color: 'var(--accent-primary)', textDecoration: 'underline', fontWeight: 'bold' }}>Register here</Link>
        </p>
      </div>
    </main>
  );
}
