import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { Button, Stepper } from "@/components/ui";
import { weekLabel } from "@/lib/time";
import { countEvents, weekEvents } from "@/lib/stats";
import type { AppData, ReviewResult } from "@/types";

const options: { value: ReviewResult; label: string; hint: string }[] = [
  { value: "good", label: "По графику", hint: "Почти всё шло по плану" },
  { value: "partial", label: "Почти", hint: "Были отдельные сложные дни" },
  { value: "bad", label: "Были срывы", hint: "Неделя далась тяжело" },
];

export function WeeklyReviewModal({
  data,
  week,
  onClose,
  onSubmit,
}: {
  data: AppData;
  week: string;
  onClose: () => void;
  onSubmit: (review: {
    result: ReviewResult;
    slips: number;
    note: string;
    nextIntervalMin: number;
  }) => void;
}) {
  const start = new Date(`${week}T00:00:00`);
  const events = weekEvents(data.events, start);
  const actualSlips = countEvents(events, false);
  const existing = data.reviews.find((r) => r.weekStart === week);

  const [result, setResult] = useState<ReviewResult>(existing?.result ?? (actualSlips === 0 ? "good" : actualSlips <= 2 ? "partial" : "bad"));
  const [slips, setSlips] = useState(existing?.slips ?? actualSlips);
  const [note, setNote] = useState(existing?.note ?? "");
  const [interval, setInterval] = useState(existing?.nextIntervalMin ?? data.settings.intervalMin);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="review-title">
        <div className="modal-head">
          <div>
            <div className="section-kicker">ИТОГИ НЕДЕЛИ</div>
            <h2 id="review-title">{weekLabel(start)}</h2>
          </div>
          <button className="icon-button" aria-label="Закрыть" onClick={onClose}><X size={20} /></button>
        </div>

        <p className="modal-intro">Короткий опрос: без оценки и давления. Просто посмотрим, что получилось.</p>

        <label className="field-label">Удалось идти по графику?</label>
        <div className="review-options">
          {options.map((option) => (
            <button
              key={option.value}
              className={`review-option ${result === option.value ? "is-active" : ""}`}
              onClick={() => setResult(option.value)}
            >
              <span className="radio-dot" />
              <span><strong>{option.label}</strong><small>{option.hint}</small></span>
            </button>
          ))}
        </div>

        <div className="field-row">
          <div>
            <label className="field-label">Срывов за неделю</label>
            <Stepper value={slips} min={0} max={200} step={1} suffix="" onChange={setSlips} />
          </div>
          <div>
            <label className="field-label">Интервал на следующую неделю</label>
            <Stepper value={interval} min={15} max={480} step={5} suffix="мин" onChange={setInterval} />
          </div>
        </div>

        <label className="field-label" htmlFor="review-note">Что помогло или мешало?</label>
        <textarea
          id="review-note"
          className="textarea"
          rows={3}
          placeholder="Например: вечером после работы было сложнее всего…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        <div className="modal-actions">
          <Button variant="ghost" onClick={onClose}>Позже</Button>
          <Button onClick={() => onSubmit({ result, slips, note: note.trim(), nextIntervalMin: interval })}>
            <Check size={17} /> Сохранить итоги
          </Button>
        </div>
      </div>
    </div>
  );
}
