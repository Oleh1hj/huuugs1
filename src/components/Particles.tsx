export function Particles() {
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
      {Array.from({ length: 16 }, (_, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${(i * 23 + 7) % 100}%`, top: `${(i * 37 + 13) % 100}%`,
          width: 2 + (i % 3) * 1.5, height: 2 + (i % 3) * 1.5,
          borderRadius: '50%',
          background: 'radial-gradient(circle,#a8e6cf,#56ab91)',
          opacity: 0.1 + (i % 4) * 0.07,
          animation: `fp${i % 3} ${7 + (i % 5) * 2}s ${(i % 4) * 2}s ease-in-out infinite`,
        }} />
      ))}
    </div>
  );
}
