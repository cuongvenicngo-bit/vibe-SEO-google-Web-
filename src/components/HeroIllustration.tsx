/**
 * Theme-aware hero artwork: a website being audited - page skeleton, competitor radar,
 * rising conversion bars and floating result cards. Follows the 60/30/10 palette: neutral
 * surfaces, brand blue for the user's site, orange only for the growth highlight.
 */
const BLUE = '#2563eb';
const BLUE_LIGHT = '#60a5fa';
const ORANGE = '#ea580c';

export function HeroIllustration({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 480 400"
      className={className}
      role="img"
      aria-label="Minh họa: website đang được phân tích, so sánh với đối thủ và tăng trưởng chuyển đổi"
    >
      <defs>
        <linearGradient id="hero-blue" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={BLUE_LIGHT} />
          <stop offset="100%" stopColor={BLUE} />
        </linearGradient>
        <filter id="hero-shadow" x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#0f172a" floodOpacity="0.1" />
        </filter>
      </defs>

      {/* Soft backdrop */}
      <circle cx="240" cy="190" r="150" fill={BLUE} opacity="0.06" />

      {/* Browser window */}
      <g filter="url(#hero-shadow)">
        <rect x="56" y="54" width="368" height="262" rx="18" className="fill-white dark:fill-slate-900" />
        <rect x="56" y="54" width="368" height="262" rx="18" fill="none" className="stroke-slate-200 dark:stroke-slate-700" strokeWidth="1.5" />
      </g>
      <path d="M56 72a18 18 0 0 1 18-18h332a18 18 0 0 1 18 18v14H56z" className="fill-slate-100 dark:fill-slate-800" />
      {[76, 91, 106].map((cx) => (
        <circle key={cx} cx={cx} cy="71" r="4.5" className="fill-slate-300 dark:fill-slate-600" />
      ))}
      <rect x="128" y="64" width="190" height="14" rx="7" className="fill-white dark:fill-slate-900" />
      <rect x="138" y="69" width="100" height="4" rx="2" className="fill-slate-300 dark:fill-slate-600" />

      {/* Page skeleton (left column) */}
      <rect x="76" y="102" width="166" height="62" rx="10" fill="url(#hero-blue)" />
      <rect x="88" y="116" width="96" height="8" rx="4" fill="#ffffff" opacity="0.95" />
      <rect x="88" y="130" width="130" height="5" rx="2.5" fill="#ffffff" opacity="0.6" />
      <rect x="88" y="145" width="44" height="11" rx="5.5" fill="#ffffff" />
      {[76, 164].map((x) => (
        <g key={x}>
          <rect x={x} y="176" width="78" height="44" rx="8" className="fill-slate-100 dark:fill-slate-800" />
          <rect x={x + 8} y="186" width="30" height="5" rx="2.5" className="fill-brand-300 dark:fill-brand-500" />
          <rect x={x + 8} y="197" width="58" height="4" rx="2" className="fill-slate-300 dark:fill-slate-600" />
          <rect x={x + 8} y="206" width="42" height="4" rx="2" className="fill-slate-300 dark:fill-slate-600" />
        </g>
      ))}

      {/* Conversion bars: blue history, orange highlight for the latest result */}
      <rect x="80" y="270" width="18" height="24" rx="4" fill={BLUE} opacity="0.35" />
      <rect x="106" y="258" width="18" height="36" rx="4" fill={BLUE} opacity="0.5" />
      <rect x="132" y="246" width="18" height="48" rx="4" fill={BLUE} opacity="0.7" />
      <rect x="158" y="236" width="18" height="58" rx="4" fill={BLUE} />
      <rect x="184" y="226" width="18" height="68" rx="4" fill={ORANGE} />

      {/* Competitor radar (right column) */}
      <g transform="translate(332 200)">
        {[62, 44, 26].map((r) => (
          <polygon key={r} points={hexPoints(r)} fill="none" className="stroke-slate-200 dark:stroke-slate-700" strokeWidth="1.2" />
        ))}
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const [x, y] = polar(62, i);
          return <line key={i} x1="0" y1="0" x2={x} y2={y} className="stroke-slate-200 dark:stroke-slate-700" strokeWidth="1" />;
        })}
        <polygon
          points={shapePoints([0.55, 0.7, 0.45, 0.6, 0.5, 0.65])}
          className="fill-slate-400/20 stroke-slate-400 dark:fill-slate-500/20 dark:stroke-slate-500"
          strokeWidth="2"
          strokeDasharray="4 3"
        />
        <polygon points={shapePoints(USER_SCORES)} fill={BLUE} fillOpacity="0.2" stroke={BLUE} strokeWidth="2.5" />
        {USER_SCORES.map((v, i) => {
          const [x, y] = polar(62 * v, i);
          return <circle key={i} cx={x} cy={y} r="3.5" fill="#ffffff" stroke={BLUE} strokeWidth="2" />;
        })}
      </g>

      {/* Floating card: SEO score */}
      <g className="hero-float">
        <g filter="url(#hero-shadow)">
          <rect x="330" y="20" width="132" height="58" rx="14" className="fill-white dark:fill-slate-800" />
        </g>
        <circle cx="358" cy="49" r="16" fill="none" className="stroke-slate-100 dark:stroke-slate-700" strokeWidth="5" />
        <circle cx="358" cy="49" r="16" fill="none" stroke={BLUE} strokeWidth="5" strokeLinecap="round" strokeDasharray="92 101" transform="rotate(-90 358 49)" />
        <text x="358" y="53" textAnchor="middle" fontSize="11" fontWeight="800" className="fill-slate-800 dark:fill-white">92</text>
        <text x="382" y="45" fontSize="10" fontWeight="600" className="fill-slate-500 dark:fill-slate-400">Điểm SEO</text>
        <text x="382" y="60" fontSize="12" fontWeight="800" className="fill-slate-800 dark:fill-white">Tốt</text>
      </g>

      {/* Floating card: competitors */}
      <g className="hero-float delay-1">
        <g filter="url(#hero-shadow)">
          <rect x="8" y="112" width="112" height="54" rx="14" className="fill-white dark:fill-slate-800" />
        </g>
        {[0, 1, 2, 3].map((i) => (
          <circle
            key={i}
            cx={30 + i * 14}
            cy="132"
            r="9"
            className={`${i === 0 ? 'fill-brand-600' : 'fill-slate-300 dark:fill-slate-600'} stroke-white dark:stroke-slate-800`}
            strokeWidth="2.5"
          />
        ))}
        <text x="20" y="157" fontSize="10.5" fontWeight="700" className="fill-slate-700 dark:fill-slate-200">5 đối thủ tự nhiên</text>
      </g>

      {/* Floating card: growth (the single orange accent) */}
      <g className="hero-float delay-2">
        <g filter="url(#hero-shadow)">
          <rect x="306" y="318" width="150" height="56" rx="14" className="fill-white dark:fill-slate-800" />
        </g>
        <rect x="318" y="330" width="32" height="32" rx="10" fill={ORANGE} />
        <path d="M325 352 L332 345 L337 349 L344 340" fill="none" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        <text x="360" y="343" fontSize="10" fontWeight="600" className="fill-slate-500 dark:fill-slate-400">Chuyển đổi</text>
        <text x="360" y="360" fontSize="15" fontWeight="900" fill={ORANGE}>+10X</text>
      </g>

      {/* Magnifier */}
      <g transform="translate(236 278)">
        <circle r="28" className="fill-white/80 dark:fill-slate-900/80" stroke={BLUE} strokeWidth="6" />
        <path d="M20 20 L40 40" stroke={BLUE} strokeWidth="9" strokeLinecap="round" />
        <path d="M-12 -6 a14 14 0 0 1 12 -10" fill="none" className="stroke-brand-200 dark:stroke-brand-700" strokeWidth="3" strokeLinecap="round" />
      </g>
    </svg>
  );
}

const USER_SCORES = [0.92, 0.8, 0.88, 0.75, 0.95, 0.85];

function polar(r: number, i: number): [number, number] {
  const angle = (Math.PI / 3) * i - Math.PI / 2;
  return [Math.cos(angle) * r, Math.sin(angle) * r];
}

function hexPoints(r: number): string {
  return [0, 1, 2, 3, 4, 5].map((i) => polar(r, i).join(',')).join(' ');
}

function shapePoints(values: number[]): string {
  return values.map((v, i) => polar(62 * v, i).join(',')).join(' ');
}
