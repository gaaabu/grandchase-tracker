"use client";

import { useState, useEffect } from 'react';

export default function History() {
  const [history, setHistory] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/history', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        const d = new Date();
        d.setUTCHours(d.getUTCHours() + 8);
        const year = d.getUTCFullYear();
        const month = String(d.getUTCMonth() + 1).padStart(2, '0');
        const day = String(d.getUTCDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;
        
        const pastHistory = { ...data };
        delete pastHistory[todayStr];
        setHistory(pastHistory);
        setIsLoading(false);
      });
  }, []);

  return (
    <main className="container">
      <header className="header">
        <h1 className="title">Tracking History</h1>
        <div className="date-display">Past Daily Clears</div>
      </header>

      {isLoading ? (
        <div className="auth-box" style={{ maxWidth: '800px', margin: '0 auto', height: '600px' }}>
          <div className="skeleton skeleton-text"></div>
          <div className="skeleton skeleton-text short"></div>
          <div className="skeleton skeleton-text"></div>
          <div className="skeleton skeleton-text"></div>
          <div className="skeleton skeleton-text short"></div>
        </div>
      ) : Object.keys(history).length === 0 ? (
        <div style={{textAlign: 'center', color: 'var(--text-secondary)', fontSize: '1.2rem', marginTop: '2rem'}}>
          No history recorded yet.
        </div>
      ) : (
        Object.keys(history).sort((a, b) => new Date(b) - new Date(a)).slice(0, 5).map(date => (
          <div key={date} style={{background: 'var(--glass-bg)', borderRadius: '24px', padding: '2rem', marginBottom: '2rem', border: '1px solid var(--glass-border)', boxShadow: 'var(--glass-shadow)'}}>
            <h2 style={{borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', marginBottom: '1.5rem', color: '#fff'}}>{new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h2>
            
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem'}}>
              {history[date].map(char => (
                <div key={char.character_name} style={{background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)'}}>
                  <h3 style={{color: 'var(--accent-secondary)', marginBottom: '1rem', fontSize: '1.25rem', fontWeight: '700'}}>{char.character_name}</h3>
                  <ul style={{listStyle: 'none', color: 'var(--text-secondary)', fontSize: '0.95rem', display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                    {char.clears.map(c => (
                      <li key={c} style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                        <span style={{color: 'var(--success)'}}>✓</span> {c}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </main>
  );
}
