export default function Loading() {
  return (
    <main className="container">
      <div className="skeleton skeleton-title"></div>
      
      <div className="toolbar" style={{ height: '50px' }}>
        <div className="skeleton skeleton-text short" style={{ width: '200px' }}></div>
      </div>
      
      <div className="characters-grid">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="skeleton skeleton-card"></div>
        ))}
      </div>
    </main>
  );
}
