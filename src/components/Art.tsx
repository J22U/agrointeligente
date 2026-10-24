export const Hills = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 800 300" preserveAspectRatio="xMidYMax slice" className={className} aria-hidden="true">
    <circle cx="640" cy="92" r="44" fill="#f2c14e" />
    <path d="M0 190 C120 140 240 150 360 185 S620 215 800 150 V300 H0Z" fill="#7fb06f" />
    <path d="M0 225 C140 185 260 200 400 225 S650 250 800 205 V300 H0Z" fill="#3f7d3a" />
    <path d="M0 262 C160 235 300 250 450 266 S680 280 800 250 V300 H0Z" fill="#1f4d2b" />
    <g fill="none" stroke="#cfe3b4" strokeWidth="1.6" opacity=".5">
      <path d="M0 207 C140 167 260 180 400 207 S650 234 800 187" />
      <path d="M0 240 C150 207 280 222 420 246 S660 264 800 230" />
      <path d="M0 276 C160 252 300 264 450 280 S680 292 800 268" />
    </g>
  </svg>
)
export const Logo = ({ size = 28 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
    <path d="M16 29V14" stroke="#6b4f3a" strokeWidth="2.6" strokeLinecap="round" />
    <path d="M16 16C16 9.5 11 6 4.5 6c0 6.5 4.5 10.5 11.5 10Z" fill="#3f7d3a" />
    <path d="M16 19c0-5.5 4-9 11.5-9 0 6.5-4.5 9.5-11.5 9Z" fill="#8fc66b" />
  </svg>
)
