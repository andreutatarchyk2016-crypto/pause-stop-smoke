/* Цвет фона следует за прогрессом таймера: холодный старт → тёплый финал → зелёная готовность. */

type RGB = [number, number, number];

const START: RGB = [59, 130, 246];
const MIDDLE: RGB = [245, 165, 36];
const END: RGB = [255, 107, 74];

function mix(a: RGB, b: RGB, t: number): string {
  const k = Math.min(1, Math.max(0, t));
  const channels = a.map((value, i) => Math.round(value + (b[i] - value) * k));
  return `rgb(${channels.join(", ")})`;
}

export function phaseColor(progress: number, ready: boolean): string {
  if (ready) return "#34d399";
  const p = Math.min(1, Math.max(0, progress));
  return p < 0.5 ? mix(START, MIDDLE, p / 0.5) : mix(MIDDLE, END, (p - 0.5) / 0.5);
}
