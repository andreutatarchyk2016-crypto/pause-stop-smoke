import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { Button, Segmented, Stepper } from "@/components/ui";

export function ManualEntrySheet({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (entry: { count: number; planned: boolean }) => void;
}) {
  const [count, setCount] = useState(1);
  const [kind, setKind] = useState<"planned" | "slip">("planned");

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="manual-title">
        <div className="modal-head">
          <div>
            <div className="section-kicker">СТАТИСТИКА</div>
            <h2 id="manual-title">Добавить сигареты</h2>
          </div>
          <button className="icon-button" aria-label="Закрыть" onClick={onClose}><X size={20} /></button>
        </div>

        <p className="modal-intro">
          Просто укажи количество — запись появится в статистике сразу. Время и интервал
          подставятся текущие, ничего настраивать не нужно.
        </p>

        <label className="field-label">Сколько сигарет?</label>
        <Stepper value={count} min={1} max={60} step={1} suffix="шт" onChange={setCount} />

        <label className="field-label">Как было?</label>
        <Segmented
          value={kind}
          options={[
            { value: "planned", label: "По графику" },
            { value: "slip", label: "Срыв" },
          ]}
          onChange={(value) => setKind(value)}
        />

        <div className="modal-actions">
          <Button variant="ghost" onClick={onClose}>Отмена</Button>
          <Button onClick={() => onSave({ count, planned: kind === "planned" })}>
            <Plus size={17} /> Добавить {count} шт.
          </Button>
        </div>
      </div>
    </div>
  );
}
