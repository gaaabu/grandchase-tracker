export default function Loading() {
  return (
    <main className="container">
      <div className="skeleton skeleton-title"></div>
      <div className="characters-grid">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="skeleton skeleton-card"></div>
        ))}
      </div>
    </main>
  );
}
