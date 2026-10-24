export type Tramo = 'amanecer' | 'dia' | 'tarde' | 'noche'
export const tramoActual = (): Tramo => { const h = new Date().getHours(); return h < 5 || h >= 19 ? 'noche' : h < 9 ? 'amanecer' : h < 17 ? 'dia' : 'tarde' }
const P = {
  amanecer: { a: '#fde9c9', b: '#e3efcf', sun: '#f6b94a', ov: 0, x: 180, y: 178 },
  dia: { a: '#cfe8f2', b: '#eef6e4', sun: '#f7d154', ov: 0, x: 620, y: 128 },
  tarde: { a: '#f9d9b0', b: '#efe6c6', sun: '#f08f3a', ov: 0.06, x: 660, y: 168 },
  noche: { a: '#1c3a4a', b: '#2f5a52', sun: '#f4f0d8', ov: 0.34, x: 620, y: 120 },
}
const stars = [[90, 40], [210, 90], [330, 30], [450, 75], [540, 25], [700, 60], [760, 120], [150, 130]]
export const Scene = ({ tramo, className, slice }: { tramo: Tramo; className?: string; slice?: boolean }) => {
  const p = P[tramo]
  return (
    <svg viewBox="0 0 800 300" preserveAspectRatio={slice ? 'xMidYMax slice' : 'xMidYMax meet'} className={className} aria-hidden="true">
      <defs><linearGradient id={`sky-${tramo}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={p.a} /><stop offset="1" stopColor={p.b} /></linearGradient></defs>
      <rect width="800" height="300" fill={`url(#sky-${tramo})`} />
      {tramo === 'noche' && stars.map(([x, y]) => <circle key={x} cx={x} cy={y} r="1.8" fill="#f4f0d8" opacity=".8" />)}
      <circle cx={p.x} cy={p.y} r="78" fill={p.sun} opacity=".14" /><circle cx={p.x} cy={p.y} r="54" fill={p.sun} opacity=".22" /><circle cx={p.x} cy={p.y} r="34" fill={p.sun} />
      {tramo !== 'noche' && <g fill="#fff" opacity=".75"><ellipse cx="190" cy="120" rx="42" ry="10" /><ellipse cx="226" cy="112" rx="28" ry="9" /><ellipse cx="470" cy="140" rx="36" ry="8" /></g>}
      {tramo === 'dia' && <path d="M330 100 q8-8 16 0 q8-8 16 0 M372 118 q6-6 12 0 q6-6 12 0" stroke="#35503a" strokeWidth="2" fill="none" strokeLinecap="round" />}
      <path d="M0 205 L90 160 L170 196 L270 140 L380 202 L470 166 L560 206 L680 150 L800 196 V300 H0Z" fill="#9cc3a0" />
      <path d="M0 220 C150 184 300 198 450 218 S700 228 800 204 V300 H0Z" fill="#6fa35f" />
      <g><rect x="505" y="192" width="40" height="26" fill="#f3e9d2" /><path d="M500 193 L525 172 L550 193Z" fill="#8a5a3b" /><rect x="520" y="203" width="9" height="15" fill="#6b4f3a" />
        <rect x="598" y="196" width="4" height="22" fill="#6b4f3a" /><circle cx="600" cy="190" r="15" fill="#2f6b3a" /><rect x="138" y="201" width="3" height="17" fill="#6b4f3a" /><circle cx="139.500" cy="196" r="11" fill="#2f6b3a" /></g>
      <path d="M0 300 V236 C200 218 500 218 800 234 V300Z" fill="#3f7d3a" />
      <g stroke="#a9d58a" strokeWidth="1.6" opacity=".55">{Array.from({ length: 17 }, (_, i) => i - 8).map(i => <line key={i} x1={400 + i * 12} y1="226" x2={400 + i * 85} y2="300" />)}</g>
      <path d="M0 300 V276 C250 262 550 264 800 278 V300Z" fill="#1f4d2b" />
      {p.ov > 0 && <rect width="800" height="300" fill="#0b1d2a" opacity={p.ov} />}
    </svg>
  )
}
export const Logo = ({ size = 28 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
    <path d="M16 29V14" stroke="#6b4f3a" strokeWidth="2.6" strokeLinecap="round" />
    <path d="M16 16C16 9.5 11 6 4.5 6c0 6.5 4.5 10.5 11.5 10Z" fill="#3f7d3a" />
    <path d="M16 19c0-5.5 4-9 11.5-9 0 6.5-4.5 9.5-11.5 9Z" fill="#8fc66b" />
  </svg>
)
