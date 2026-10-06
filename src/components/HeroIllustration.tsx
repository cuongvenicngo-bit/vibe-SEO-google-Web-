/**
 * Theme-aware hero artwork: a website being audited — page skeleton, competitor radar,
 * rising conversion bars and floating result cards. Pure SVG so it stays crisp and follows
 * light/dark mode through Tailwind fill/stroke utilities.
 */
export function HeroIllustration({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 480 400"
      className={className}
      role="img"
      aria-label="Minh họa: website đang được phân tích, so sánh với đối thủ và tăng trưởng chuyển đổi"
    >
      <defs>
        <linearGradient id="hero-aurora" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2794f7" />
          <stop offset="55%" stopColor="#8255fb" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
        <linearGradient id="hero-bar" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#8255fb" />
          <stop offset="100%" stopColor="#2794f7" />
        </linearGradient>
        <linearGradient id="hero-warm" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
        <filter id="hero-shadow" x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#4b26ab" floodOpacity="0.18" />
        </filter>
      </defs>

      {/* Glow behind the window */}
      <circle cx="240" cy="190" r="150" fill="url(#hero-aurora)" opacity="0.14" />

      {/* Browser window */}
      <g filter="url(#hero-shadow)">
        <rect x="56" y="54" width="368" height="262" rx="18" className="fill-white dark:fill-slate-900" />
        <rect x="56" y="54" width="368" height="262" rx="18" fill="none" className="stroke-slate-200 dark:stroke-slate-700" strokeWidth="1.5" />
      </g>
      <path d="M56 72a18 18 0 0 1 18-18h332a18 18 0 0 1 18 18v14H56z" className="fill-slate-100 dark:fill-slate-800" />
      <circle cx="76" cy="71" r="4.5" fill="#f43f5e" />
      <circle cx="91" cy="71" r="4.5" fill="#f59e0b" />
      <circle cx="106" cy="71" r="4.5" fill="#10b981" />
      <rect x="128" y="64" width="190" height="14" rx="7" className="fill-white dark:fill-slate-900" />
      <circle cx="139" cy="71" r="3.5" fill="#10b981" />
      <rect x="148" y="69" width="90" height="4" rx="2" className="fill-slate-300 dark:fill-slate-600" />

      {/* Page skeleton (left column) */}
      <rect x="76" y="102" width="166" height="62" rx="10" fill="url(#hero-aurora)" opacity="0.9" />
      <rect x="88" y="116" width="96" height="8" rx="4" fill="#ffffff" opacity="0.95" />
      <rect x="88" y="130" width="130" height="5" rx="2.5" fill="#ffffff" opacity="0.6" />
      <rect x="88" y="145" width="44" height="11" rx="5.5" fill="#ffffff" />
      <rect x="76" y="176" width="78" height="44" rx="8" className="fill-slate-100 dark:fill-slate-800" />
      <rect x="164" y="176" width="78" height="44" rx="8" className="fill-slate-100 dark:fill-slate-800" />
      <rect x="84" y="186" width="30" height="5" rx="2.5" className="fill-brand-300 dark:fill-brand-500" />
      <rect x="84" y="197" width="58" height="4" rx="2" className="fill-slate-300 dark:fill-slate-600" />
      <rect x="84" y="206" width="44" height="4" rx="2" className="fill-slate-300 dark:fill-slate-600" />
      <rect x="172" y="186" width="30" height="5" rx="2.5" className="fill-ocean-300 dark:fill-ocean-500" />
      <rect x="172" y="197" width="58" height="4" rx="2" className="fill-slate-300 dark:fill-slate-600" />
      <rect x="172" y="206" width="40" height="4" rx="2" className="fill-slate-300 dark:fill-slate-600" />

      {/* Conversion bars */}
      <g>
        <rect x="80" y="270" width="18" height="24" rx="4" fill="url(#hero-bar)" opacity="0.45" />
        <rect x="106" y="258" width="18" height="36" rx="4" fill="url(#hero-bar)" opacity="0.6" />
        <rect x="132" y="246" width="18" height="48" rx="4" fill="url(#hero-bar)" opacity="0.75" />
        <rect x="158" y="236" width="18" height="58" rx="4" fill="url(#hero-bar)" opacity="0.9" />
        <rect x="184" y="230" width="18" height="64" rx="4" fill="url(#hero-warm)" />
        <path d="M84 262 L114 250 L140 238 L166 226 L196 216" fill="none" stroke="#ec4899" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M188 212 L198 215 L193 224" fill="none" stroke="#ec4899" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* Competitor radar (right column) */}
      <g transform="translate(332 200)">
        <circle r="70" className="radar-pulse" fill="none" stroke="#8255fb" strokeWidth="2" />
        {[62, 44, 26].map((r) => (
          <polygon
            key={r}
            points={hexPoints(r)}
            fill="none"
            className="stroke-slate-200 dark:stroke-slate-700"
            strokeWidth="1.2"
          />
        ))}
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const [x, y] = polar(62, i);
          return <line key={i} x1="0" y1="0" x2={x} y2={y} className="stroke-slate-200 dark:stroke-slate-700" strokeWidth="1" />;
        })}
        <polygon points={shapePoints([0.55, 0.7, 0.45, 0.6, 0.5, 0.65])} fill="#f59e0b" fillOpacity="0.22" stroke="#f59e0b" strokeWidth="2" />
        <polygon points={shapePoints([0.92, 0.8, 0.88, 0.75, 0.95, 0.85])} fill="#8255fb" fillOpacity="0.28" stroke="#8255fb" strokeWidth="2.5" />
        {[0.92, 0.8, 0.88, 0.75, 0.95, 0.85].map((v, i) => {
          const [x, y] = polar(62 * v, i);
          return <circle key={i} cx={x} cy={y} r="3.5" fill="#ffffff" stroke="#8255fb" strokeWidth="2" />;
        })}
      </g>

      {/* Floating card: SEO score */}
      <g className="hero-float">
        <g filter="url(#hero-shadow)">
          <rect x="330" y="20" width="132" height="58" rx="14" className="fill-white dark:fill-slate-800" />
        </g>
        <circle cx="358" cy="49" r="16" fill="none" className="stroke-slate-100 dark:stroke-slate-700" strokeWidth="5" />
        <circle
          cx="358"
          cy="49"
          r="16"
          fill="none"
          stroke="url(#hero-aurora)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray="92 101"
          transform="rotate(-90 358 49)"
        />
        <text x="358" y="53" textAnchor="middle" fontSize="11" fontWeight="800" className="fill-slate-800 dark:fill-white">92</text>
        <text x="382" y="45" fontSize="10" fontWeight="600" className="fill-slate-500 dark:fill-slate-400">Điểm SEO</text>
        <text x="382" y="60" fontSize="12" fontWeight="800" fill="#10b981">Xuất sắc</text>
      </g>

      {/* Floating card: competitors */}
      <g className="hero-float delay-1">
        <g filter="url(#hero-shadow)">
          <rect x="8" y="112" width="112" height="54" rx="14" className="fill-white dark:fill-slate-800" />
        </g>
        {['#2794f7', '#8255fb', '#ec4899', '#f59e0b'].map((c, i) => (
          <circle key={c} cx={30 + i * 14} cy="132" r="9" fill={c} className="stroke-white dark:stroke-slate-800" strokeWidth="2.5" />
        ))}
        <text x="20" y="157" fontSize="10.5" fontWeight="700" className="fill-slate-700 dark:fill-slate-200">5 đối thủ tự nhiên</text>
      </g>

      {/* Floating card: growth */}
      <g className="hero-float delay-2">
        <g filter="url(#hero-shadow)">
          <rect x="306" y="318" width="150" height="56" rx="14" className="fill-white dark:fill-slate-800" />
        </g>
        <rect x="318" y="330" width="32" height="32" rx="10" fill="url(#hero-warm)" />
        <path d="M325 352 L332 345 L337 349 L344 340" fill="none" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        <text x="360" y="343" fontSize="10" fontWeight="600" className="fill-slate-500 dark:fill-slate-400">Chuyển đổi</text>
        <text x="360" y="360" fontSize="15" fontWeight="900" fill="url(#hero-aurora)">+10X</text>
      </g>

      {/* Magnifier */}
      <g className="hero-float delay-1" transform="translate(236 278)">
        <circle r="28" className="fill-white/70 dark:fill-slate-900/70" stroke="url(#hero-aurora)" strokeWidth="6" />
        <circle r="28" fill="url(#hero-aurora)" opacity="0.12" />
        <path d="M20 20 L40 40" stroke="url(#hero-aurora)" strokeWidth="9" strokeLinecap="round" />
        <path d="M-12 -6 a14 14 0 0 1 12 -10" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
      </g>

      {/* Sparkles */}
      <path d="M40 300 l4 -10 l4 10 l10 4 l-10 4 l-4 10 l-4 -10 l-10 -4z" fill="#f59e0b" opacity="0.85" className="hero-float" />
      <path d="M440 120 l3 -7 l3 7 l7 3 l-7 3 l-3 7 l-3 -7 l-7 -3z" fill="#2794f7" opacity="0.85" className="hero-float delay-2" />
    </svg>
  );
}

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
