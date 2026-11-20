import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { Button, Segmented, Stepper } from "@/components/ui";

function toLocalInput(ts: number) {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

export function ManualEntrySheet({
  now,
  intervalMin,
  onClose,
  onSave,
}: {
  now: number;
  intervalMin: number;
  onClose: () => void;
  onSave: (entry: { at: number; planned: boolean; intervalMin: number }) => void;
}) {
  const initial = toLocalInput(now);
  const [date, setDate] = useState(initial.date);
  const [time, setTime] = useState(initial.time);
  const [kind, setKind] = useState<"planned" | "slip">("planned");
  const [interval, setInterval] = useState(intervalMin);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function setAgo(minutes: number) {
    const value = toLocalInput(Date.now() - minutes * 60_000);
    setDate(value.date);
    setTime(value.time);
    setError(null);
  }

  function save() {
    const at = new Date(`${date}T${time}`).getTime();
    if (!date || !time || !Number.isFinite(at)) {
      setError("Укажи дату и время");
      return;
    }
    if (at > Date.now() + 60_000) {
      setError("Нельзя добавить запись в будущем");
      return;
    }
    onSave({ at, planned: kind === "planned", intervalMin: interval });
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="manual-title">
        <div className="modal-head">
          <div>
            <div className="section-kicker">СТАТИСТИКА</div>
            <h2 id="manual-title">Добавить запись</h2>
          </div>
          <button className="icon-button" aria-label="Закрыть" onClick={onClose}><X size={20} /></button>
        </div>

        <p className="modal-intro">
          Запиши сигарету, которую курил(а) раньше, или исправь пропущенную. Статистика пересчитается сама.
        </p>

        <label className="field-label" htmlFor="manual-date">Дата</label>
        <input
          id="manual-date"
          className="input"
          type="date"
          value={date}
          max={toLocalInput(Date.now()).date}
          onChange={(event) => { setDate(event.target.value); setError(null); }}
        />

        <label className="field-label" htmlFor="manual-time">Время</label>
        <input
          id="manual-time"
          className="input"
          type="time"
          value={time}
          onChange={(event) => { setTime(event.target.value); setError(null); }}
        />
        <div className="quick-times">
          <button onClick={() => setAgo(0)}>Сейчас</button>
          <button onClick={() => setAgo(15)}>15 мин назад</button>
          <button onClick={() => setAgo(60)}>Час назад</button>
        </div>

        <label className="field-label">Как было?</label>
        <Segmented
          value={kind}
          options={[
            { value: "planned", label: "По графику" },
            { value: "slip", label: "Срыв" },
          ]}
          onChange={(value) => setKind(value)}
        />

        <label className="field-label">Интервал</label>
        <Stepper value={interval} min={5} max={480} step={5} suffix="мин" onChange={setInterval} />

        {error && <p className="form-error">{error}</p>}

        <div className="modal-actions">
          <Button variant="ghost" onClick={onClose}>Отмена</Button>
          <Button onClick={save}><Plus size={17} /> Добавить</Button>
        </div>
      </div>
    </div>
  );
}
