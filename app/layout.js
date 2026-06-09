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
      <body>
        {session && <Navbar />}
        {children}
      </body>
    </html>
  );
}
