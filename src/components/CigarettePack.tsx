import { useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { formatCountdown, formatMinutes } from "@/lib/time";

const CIRCUMFERENCE = 2 * Math.PI * 176;

export type PackPhase = "waiting" | "open" | "butt";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function CigarettePack({
  phase,
  progress,
  windowProgress,
  remaining,
  intervalMin,
}: {
  phase: PackPhase;
  progress: number;
  windowProgress: number;
  remaining: number;
  intervalMin: number;
}) {
  const [rotation, setRotation] = useState({ x: -8, y: -20 });
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ x: number; y: number; rx: number; ry: number } | null>(null);

  const p = clamp(progress, 0, 1);
  const w = clamp(windowProgress, 0, 1);
  const open = phase !== "waiting";
  const ready = open && phase !== "butt";

  // Крышка открывается постепенно, пока идёт интервал; в момент «можно» пачка уже открыта.
  const lidAngle = 118 * (open ? 1 : p);
  const innerRise = open ? 0 : 10 * p;
  // Пепел растёт в пользовательских единицах SVG (тело сигареты ~1300), дым сдвигается в CSS-пикселях.
  const ash = w * 880;
  const ashScale = Math.max(0.002, ash / 1300);
  const smokeShift = w * 112;

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!open) return;
    drag.current = {
      x: event.clientX,
      y: event.clientY,
      rx: rotation.x,
      ry: rotation.y,
    };
    setDragging(true);
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      /* Некоторые браузеры не поддерживают захват для синтетических событий */
    }
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!drag.current) return;
    const dx = event.clientX - drag.current.x;
    const dy = event.clientY - drag.current.y;
    setRotation({
      x: clamp(drag.current.rx - dy * 0.45, -70, 70),
      y: drag.current.ry + dx * 0.55,
    });
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    drag.current = null;
    setDragging(false);
    try {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    } catch {
      /* Захват мог быть недоступен */
    }
  }

  return (
    <div className={`dial pack-dial phase-${phase}`}>
      <svg className="dial-ring" viewBox="0 0 400 400" aria-hidden="true">
        <defs>
          <linearGradient id="ring-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffd166" />
            <stop offset="45%" stopColor="#ff7a59" />
            <stop offset="100%" stopColor="#c084fc" />
          </linearGradient>
          <linearGradient id="ring-gradient-open" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="55%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
        </defs>
        <circle cx="200" cy="200" r="176" className="ring-track" />
        <circle
          cx="200"
          cy="200"
          r="176"
          className="ring-fill"
          stroke={`url(#${ready || phase === "butt" ? "ring-gradient-open" : "ring-gradient"})`}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - (phase === "waiting" ? p : 1 - w))}
          transform="rotate(-90 200 200)"
        />
        <circle cx="200" cy="24" r="4.5" fill={ready ? "#67e8f9" : "#ffd166"} className="ring-cap" />
      </svg>

      <div className="pack-scene">
        <div
          className="pack-rig"
          style={
            {
              "--lid-angle": `${lidAngle}deg`,
              "--inner-rise": `${innerRise}px`,
            } as CSSProperties
          }
        >
          <div className="pack-box">
            <div className="pack-face pack-front">
              <div className="pack-seam" />
              <div className="pack-label">
                <div className="pack-label-kicker">THE EMBER COLLECTION</div>
                <div className="pack-label-brand">EMBER</div>
                <div className="pack-label-rule"><i /><b>◆</b><i /></div>
                <div className="pack-label-sub">NOIR</div>
                <div className="pack-label-size">20 · KING SIZE</div>
              </div>
              <div className="pack-foot">
                <span>20</span>
                <small>CIGARETTES</small>
              </div>
            </div>
            <div className="pack-face pack-back" />
            <div className="pack-face pack-left" />
            <div className="pack-face pack-right">
              <div className="pack-side-label" />
              <div className="pack-barcode" aria-hidden="true">
                {[2, 1, 3, 1, 2, 4, 1, 2, 3, 1, 2].map((width, i) => (
                  <i key={i} style={{ width }} />
                ))}
              </div>
              <span className="pack-side-count">20</span>
            </div>
            <div className="pack-face pack-bottom" />
            <div className="pack-inside">
              {[0, 1, 2].map((i) => (
                <span key={i} className="pack-inner-cig" style={{ left: `${26 + i * 26}px` }} />
              ))}
            </div>
          </div>

          <div className="pack-lid">
            <div className="lid-face lid-top" />
            <div className="lid-face lid-front">
              <div className="pack-emblem"><span /></div>
              <span className="lid-brand">MMXXVI</span>
              <div className="pack-cellophane" />
            </div>
            <div className="lid-face lid-back" />
            <div className="lid-face lid-left" />
            <div className="lid-face lid-right" />
            <div className="lid-lip" />
          </div>
        </div>

        {open && (
          <div
            className={`cig-interactive ${dragging ? "is-dragging" : ""} ${phase === "butt" ? "is-butt" : ""}`}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            role="img"
            aria-label="Сигарета, которую можно повернуть пальцем"
            style={
              {
                "--rx": `${rotation.x}deg`,
                "--ry": `${rotation.y}deg`,
                "--ash": ash,
                "--ash-scale": ashScale,
                "--smoke-shift": `${smokeShift}px`,
              } as CSSProperties
            }
          >
            <div className="cig-orbit">
              <div className="cig-turn" style={{ animationPlayState: dragging ? "paused" : "running" }}>
                <svg className="cig-object" viewBox="0 -40 128 1380" role="presentation">
                  <defs>
                    <linearGradient id="cig-paper" x1="0" y1="0" x2="128" y2="0" gradientUnits="userSpaceOnUse">
                      <stop offset="0" stopColor="#3b362f" />
                      <stop offset="0.04" stopColor="#6f685c" />
                      <stop offset="0.12" stopColor="#a99f90" />
                      <stop offset="0.28" stopColor="#d2c9b9" />
                      <stop offset="0.44" stopColor="#ded5c5" />
                      <stop offset="0.6" stopColor="#d2c8b8" />
                      <stop offset="0.76" stopColor="#b3a998" />
                      <stop offset="0.9" stopColor="#877e6f" />
                      <stop offset="0.98" stopColor="#625b50" />
                      <stop offset="1" stopColor="#38342d" />
                    </linearGradient>
                    <linearGradient id="cig-filter" x1="0" y1="0" x2="128" y2="0" gradientUnits="userSpaceOnUse">
                      <stop offset="0" stopColor="#2c1e12" />
                      <stop offset="0.06" stopColor="#5f432a" />
                      <stop offset="0.2" stopColor="#97714b" />
                      <stop offset="0.38" stopColor="#bb9367" />
                      <stop offset="0.52" stopColor="#c9a276" />
                      <stop offset="0.68" stopColor="#b08a5f" />
                      <stop offset="0.84" stopColor="#86633f" />
                      <stop offset="0.96" stopColor="#5a3f26" />
                      <stop offset="1" stopColor="#2a1c10" />
                    </linearGradient>
                    <linearGradient id="cig-tipping" x1="0" y1="0" x2="128" y2="0" gradientUnits="userSpaceOnUse">
                      <stop offset="0" stopColor="#4e4840" />
                      <stop offset="0.1" stopColor="#9c9385" />
                      <stop offset="0.25" stopColor="#ded5c6" />
                      <stop offset="0.43" stopColor="#f2ecdd" />
                      <stop offset="0.64" stopColor="#e4dccc" />
                      <stop offset="0.84" stopColor="#b8ae9d" />
                      <stop offset="0.96" stopColor="#7d7567" />
                      <stop offset="1" stopColor="#4c463d" />
                    </linearGradient>
                    <linearGradient id="cig-burn" x1="0" y1="0" x2="0" y2="150" gradientUnits="userSpaceOnUse">
                      <stop offset="0" stopColor="#3a2a1e" stopOpacity="0.8" />
                      <stop offset="0.35" stopColor="#5c412a" stopOpacity="0.4" />
                      <stop offset="1" stopColor="#8a6a48" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="cig-rim" x1="0" y1="0" x2="0" y2="260" gradientUnits="userSpaceOnUse">
                      <stop offset="0" stopColor="#ff9a45" stopOpacity="0.5" />
                      <stop offset="0.45" stopColor="#ff7a26" stopOpacity="0.15" />
                      <stop offset="1" stopColor="#ff6a1f" stopOpacity="0" />
                    </linearGradient>
                    <radialGradient id="cig-ash" cx="0.42" cy="0.3" r="0.82">
                      <stop offset="0" stopColor="#a19788" />
                      <stop offset="0.5" stopColor="#897f71" />
                      <stop offset="1" stopColor="#615950" />
                    </radialGradient>
                    <radialGradient id="cig-ember-core">
                      <stop offset="0" stopColor="#fff8e2" />
                      <stop offset="0.3" stopColor="#ffd27e" />
                      <stop offset="0.6" stopColor="#ff8a2a" />
                      <stop offset="0.85" stopColor="#e85a10" />
                      <stop offset="1" stopColor="#a3300a" />
                    </radialGradient>
                    <clipPath id="cig-clip">
                      <path d="M0 3 L128 37 L128 1320 A64 14 0 0 1 0 1320 Z" />
                    </clipPath>
                    <clipPath id="cig-face-clip">
                      <ellipse cx="64" cy="20" rx="66" ry="14" />
                    </clipPath>
                  </defs>

                  <g clipPath="url(#cig-clip)">
                    <rect x="0" y="0" width="128" height="960" fill="url(#cig-paper)" />
                    {[10, 22, 39, 58, 78, 96, 113].map((x) => (
                      <line key={x} x1={x} y1="30" x2={x} y2="960" stroke="#7a7164" strokeWidth="0.6" opacity="0.14" />
                    ))}
                    <rect x="10" y="40" width="8" height="820" rx="4" fill="#fff" opacity="0.07" />
                    <rect x="0" y="0" width="128" height="150" fill="url(#cig-burn)" />
                    <rect x="0" y="0" width="128" height="260" fill="url(#cig-rim)" style={{ mixBlendMode: "screen" }} />
                    <rect x="114" y="10" width="10" height="330" fill="url(#cig-rim)" opacity="0.5" style={{ mixBlendMode: "screen" }} />
                    <rect x="0" y="952" width="128" height="28" fill="url(#cig-tipping)" />
                    <rect x="0" y="952" width="128" height="1.6" fill="#3a2c1e" opacity="0.28" />
                    <rect x="0" y="978" width="128" height="2" fill="#2a2118" opacity="0.2" />
                    <rect x="0" y="961" width="128" height="1" fill="#8a6a3e" opacity="0.35" />
                    <rect x="0" y="963" width="128" height="0.7" fill="#8a6a3e" opacity="0.22" />
                    <rect x="0" y="980" width="128" height="350" fill="url(#cig-filter)" />
                    {[16, 30, 48, 66, 84, 102, 116].map((x) => (
                      <line key={`f${x}`} x1={x} y1="990" x2={x} y2="1320" stroke="#3a2415" strokeWidth="0.7" opacity="0.16" />
                    ))}
                    <rect x="12" y="1000" width="7" height="290" rx="3.5" fill="#fff" opacity="0.11" />
                    <rect x="0" y="1302" width="128" height="18" fill="#000" opacity="0.16" />
                  </g>

                  <path d="M0 1320 A64 14 0 0 0 128 1320" fill="none" stroke="#0d0805" strokeWidth="3" opacity="0.6" />
                  <path d="M3 1315 A64 14 0 0 0 125 1315" fill="none" stroke="#f0e3cc" strokeWidth="1.2" opacity="0.22" />

                  <g className="cig-dyn-ash" clipPath="url(#cig-clip)">
                    <rect x="0" y="20" width="128" height="1300" fill="url(#cig-ash)" />
                    <rect x="0" y="20" width="128" height="1300" fill="#8a8072" opacity="0.18" />
                    {[16, 42, 70, 96].map((x, i) => (
                      <line key={`a${x}`} x1={x} y1="26" x2={x + (i % 2 ? 4 : -3)} y2="1320" stroke="#5a5044" strokeWidth="0.8" opacity="0.25" />
                    ))}
                  </g>

                  <g className="cig-dyn-cap">
                    <g transform="rotate(15 64 20)">
                      <ellipse cx="64" cy="20" rx="66" ry="14" fill="#1b1411" />
                      <path
                        d="M2 19 C4 11 14 6 27 5 C41 3 56 4 70 6 C86 7 102 10 114 15 C121 18 124 22 120 25 C110 28 96 25 82 24 C66 23 50 26 36 24 C22 22 10 25 4 22 Z"
                        fill="url(#cig-ash)"
                      />
                      <g clipPath="url(#cig-face-clip)" opacity="0.8">
                        {[
                          [28, 16, 1.1], [52, 12, 0.8], [74, 18, 1.3], [92, 14, 0.9],
                          [40, 22, 0.7], [66, 24, 1], [104, 21, 0.8], [18, 20, 0.9],
                          [58, 18, 0.6], [84, 24, 1.1], [34, 10, 0.7], [112, 18, 1.2],
                        ].map(([cx, cy, r], i) => (
                          <circle key={i} cx={cx} cy={cy} r={r} fill={i % 2 ? "#c8bead" : "#8a8072"} opacity="0.45" />
                        ))}
                      </g>
                      <g strokeLinecap="round" fill="none" stroke="#5a5044">
                        <path d="M26 14 L32 20 L28 24" strokeWidth="0.8" opacity="0.35" />
                        <path d="M56 10 L60 16 L56 20" strokeWidth="0.8" opacity="0.3" />
                        <path d="M78 15 L83 21" strokeWidth="0.7" opacity="0.3" />
                      </g>
                      <path d="M82 24 C90 20 102 19 112 21 C122 23 128 27 127 31 C126 35 116 35 106 33 C94 31 82 28 82 24 Z" fill="#241b15" opacity="0.9" />
                      <path d="M100 28 C102 22 110 19 117 21 C124 23 128 27 126 31 C124 34 115 33 108 31 C102 30 99 30 100 28 Z" fill="url(#cig-ember-core)" opacity="0.95" />
                      <ellipse cx="118" cy="28" rx="6" ry="2.4" fill="#fff6dc" opacity="0.85" />
                      <ellipse cx="119" cy="28" rx="2.6" ry="1" fill="#fffdf2" />
                      <path d="M28 29 C50 33 76 34 96 32" stroke="#ff5a12" strokeWidth="4" fill="none" opacity="0.4" />
                      <path d="M32 30 C52 34 76 35 94 33" stroke="#ff9a3c" strokeWidth="1.5" fill="none" opacity="0.75" />
                      <ellipse cx="106" cy="26" rx="30" ry="8" fill="#ff6a1a" opacity="0.28" />
                      <ellipse cx="116" cy="27" rx="14" ry="5" fill="#ff8a2a" opacity="0.25" />
                    </g>
                  </g>
                </svg>
              </div>
            </div>
            <svg className="cig-smoke" viewBox="0 0 60 110" aria-hidden="true">
              <defs>
                <linearGradient id="smoke-a" x1="30" y1="105" x2="36" y2="8" gradientUnits="userSpaceOnUse">
                  <stop offset="0" stopColor="#ffc79a" stopOpacity="0.55" />
                  <stop offset="0.2" stopColor="#f2ecdd" stopOpacity="0.45" />
                  <stop offset="0.65" stopColor="#c3c8d2" stopOpacity="0.14" />
                  <stop offset="1" stopColor="#aab4c4" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="smoke-b" x1="40" y1="105" x2="50" y2="12" gradientUnits="userSpaceOnUse">
                  <stop offset="0" stopColor="#ffd2a8" stopOpacity="0.5" />
                  <stop offset="0.3" stopColor="#e9e6df" stopOpacity="0.35" />
                  <stop offset="1" stopColor="#b8c0ce" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="smoke-c" x1="22" y1="105" x2="16" y2="18" gradientUnits="userSpaceOnUse">
                  <stop offset="0" stopColor="#e8d2bd" stopOpacity="0.35" />
                  <stop offset="0.5" stopColor="#b9bcc6" stopOpacity="0.14" />
                  <stop offset="1" stopColor="#9aa3b4" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path className="cig-wisp w0" d="M32 108 C 18 90 44 76 28 58 C 14 42 40 28 30 8" />
              <path className="cig-wisp w1" d="M30 100 C 18 82 40 70 27 52 C 16 38 38 26 28 10" />
              <path className="cig-wisp w2" d="M36 100 C 48 84 28 72 42 54 C 52 42 34 30 44 14" />
              <path className="cig-wisp w3" d="M24 100 C 12 86 30 74 20 58 C 10 46 28 34 20 20" />
            </svg>
            {ready && (
              <div className="cig-sparks">
                {[0, 1, 2, 3, 4].map((i) => (
                  <span key={i} style={{ animationDelay: `${i * 0.3}s`, left: `${16 + i * 13}px` }} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="dial-content pack-copy">
        <div className="pack-copy-top">
          <div className="dial-eyebrow">
            {phase === "waiting" ? "ПАЧКА ОТКРЫВАЕТСЯ" : phase === "butt" ? "ОКУРОК УЛЕТАЕТ" : "СИГАРЕТА ВЫШЛА"}
          </div>
          <div className="dial-time" aria-live="off">{formatCountdown(remaining)}</div>
        </div>
        <div className="dial-caption">
          {phase === "waiting"
            ? `Пачка откроется через ${formatMinutes(intervalMin)}. Покрути сигарету, когда она выйдет.`
            : phase === "butt"
              ? "Ничего не записано — отсчёт начался заново"
              : "Покрути сигарету пальцем · 5 минут до окурка"}
        </div>
      </div>
    </div>
  );
}
