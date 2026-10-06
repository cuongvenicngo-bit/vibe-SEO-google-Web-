import { useEffect, useRef, type CSSProperties } from 'react';

const PETALS = [
  { x: 4, delay: -2, duration: 19, drift: 58, size: 9, rotate: 14 },
  { x: 12, delay: -13, duration: 24, drift: -42, size: 12, rotate: 66 },
  { x: 20, delay: -6, duration: 22, drift: 38, size: 8, rotate: 124 },
  { x: 29, delay: -18, duration: 27, drift: -54, size: 11, rotate: 38 },
  { x: 38, delay: -9, duration: 21, drift: 46, size: 10, rotate: 98 },
  { x: 47, delay: -22, duration: 29, drift: -34, size: 13, rotate: 152 },
  { x: 56, delay: -4, duration: 23, drift: 52, size: 9, rotate: 21 },
  { x: 64, delay: -16, duration: 26, drift: -48, size: 11, rotate: 83 },
  { x: 72, delay: -11, duration: 20, drift: 44, size: 8, rotate: 132 },
  { x: 80, delay: -25, duration: 30, drift: -56, size: 12, rotate: 47 },
  { x: 87, delay: -7, duration: 24, drift: 36, size: 10, rotate: 108 },
  { x: 94, delay: -20, duration: 28, drift: -40, size: 9, rotate: 171 },
] as const;

type PetalStyle = CSSProperties & {
  '--petal-x': string;
  '--petal-delay': string;
  '--petal-duration': string;
  '--petal-drift': string;
  '--petal-drift-end': string;
  '--petal-size': string;
  '--petal-height': string;
  '--petal-rotate': string;
};

export function DarkSakuraPetals() {
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const syncVisibility = () => {
      if (layerRef.current) {
        layerRef.current.dataset.paused = document.hidden ? 'true' : 'false';
      }
    };

    syncVisibility();
    document.addEventListener('visibilitychange', syncVisibility);
    return () => document.removeEventListener('visibilitychange', syncVisibility);
  }, []);

  return (
    <div ref={layerRef} className="sakura-petals" aria-hidden="true">
      {PETALS.map((petal, index) => (
        <span
          key={index}
          className="sakura-petal"
          style={
            {
              '--petal-x': `${petal.x}vw`,
              '--petal-delay': `${petal.delay}s`,
              '--petal-duration': `${petal.duration}s`,
              '--petal-drift': `${petal.drift}px`,
              '--petal-drift-end': `${petal.drift * -0.42}px`,
              '--petal-size': `${petal.size}px`,
              '--petal-height': `${petal.size * 0.72}px`,
              '--petal-rotate': `${petal.rotate}deg`,
            } as PetalStyle
          }
        />
      ))}
    </div>
  );
}
