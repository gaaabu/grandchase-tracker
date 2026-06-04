"use client";
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  };

  return (
    <nav className="navbar">
      <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
        <span className="brand-logo">GC Tracker</span>
        <Link href="/summary" className="nav-link">Summary</Link>
        <Link href="/edit" className="nav-link">Edit Dailies</Link>
        <Link href="/history" className="nav-link">History</Link>
      </div>
      <button onClick={handleLogout} className="logout-btn">Logout</button>
    </nav>
  );
}
