import './globals.css';
import { cookies } from 'next/headers';
import Navbar from '@/components/Navbar';

export const metadata = {
  title: 'GrandChase Tracker',
  description: 'Track your daily dungeon runs across all characters.',
};

export default async function RootLayout({ children }) {
  const cookieStore = await cookies();
  const session = cookieStore.get('session_token');

  return (
    <html lang="en">
      <body style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {session && <Navbar />}
        <div style={{ flex: 1 }}>
          {children}
        </div>
        <footer style={{ textAlign: 'center', padding: '2rem', borderTop: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
          <p>Developed with <span style={{ color: 'var(--status-danger)' }}>&lt;3</span> by Gab</p>
          <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
            <a href="https://github.com/gaaabu" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 'bold' }}>
              Visit my GitHub Profile!
            </a>
          </p>
        </footer>
      </body>
    </html>
  );
}
