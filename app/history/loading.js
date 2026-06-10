export default function Loading() {
  return (
    <main className="container">
      <div className="skeleton skeleton-title"></div>
      <div className="auth-box" style={{ maxWidth: '800px', margin: '0 auto', height: '600px' }}>
        <div className="skeleton skeleton-text"></div>
        <div className="skeleton skeleton-text short"></div>
        <div className="skeleton skeleton-text"></div>
        <div className="skeleton skeleton-text"></div>
        <div className="skeleton skeleton-text short"></div>
      </div>
    </main>
  );
}
