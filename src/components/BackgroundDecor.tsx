/* Декоративный слой фона: дым, орбиты, текстура, стекло и рябь при записи.
   Ничего не перехватывает — весь слой живёт позади содержимого. */

export function BackgroundDecor({
  ready,
  progress,
  rippleKey,
}: {
  ready: boolean;
  progress: number;
  rippleKey: number;
}) {
  return (
    <div className={`bg-decor ${ready ? "is-ready" : ""}`} aria-hidden="true">
      <div className="bg-nebula bg-nebula-a" />
      <div className="bg-nebula bg-nebula-b" />
      <div className="bg-nebula bg-nebula-c" style={{ opacity: 0.25 + progress * 0.45 }} />

      <svg className="bg-orbits" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="orbit-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" style={{ stopColor: "var(--phase)" }} />
            <stop offset="100%" stopColor="#c084fc" />
          </linearGradient>
        </defs>
        <g transform="translate(500 500)">
          <circle className="orbit orbit-1" r="330" />
          <circle className="orbit orbit-2" r="410" />
          <circle className="orbit orbit-3" r="485" />
          <circle className="orbit-dot orbit-dot-1" r="6" cx="330" cy="0" />
          <circle className="orbit-dot orbit-dot-2" r="4" cx="-410" cy="0" />
        </g>
      </svg>

      <svg className="bg-smoke" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
        <path className="bg-wisp bg-wisp-1" d="M120 820 C 60 650 210 600 130 450 C 70 330 220 260 150 90" />
        <path className="bg-wisp bg-wisp-2" d="M1080 820 C 1160 660 1000 590 1090 430 C 1160 320 1010 250 1080 80" />
        <path className="bg-wisp bg-wisp-3" d="M620 840 C 540 690 700 610 600 460 C 520 340 690 250 610 100" />
      </svg>

      <div className="bg-texture" />
      {rippleKey > 0 && <div key={rippleKey} className="bg-ripple" />}
    </div>
  );
}
