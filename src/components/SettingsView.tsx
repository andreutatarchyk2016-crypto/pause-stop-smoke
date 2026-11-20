import { RotateCcw, ShieldCheck } from "lucide-react";
import { Badge, Button, Card, Stepper } from "@/components/ui";
import type { AppData } from "@/types";

const presets = [30, 45, 60, 90, 120];

export function SettingsView({
  data,
  onSettings,
  onReset,
}: {
  data: AppData;
  onSettings: (patch: Partial<AppData["settings"]>) => void;
  onReset: () => void;
}) {
  return (
    <div className="view">
      <div className="view-heading">
        <div>
          <div className="section-kicker">НАСТРОЙКИ</div>
          <h2 className="section-title">Свой ритм</h2>
        </div>
      </div>

      <Card>
        <div className="card-title-row"><h3>Интервал между сигаретами</h3><Badge tone="warn">главное</Badge></div>
        <p className="card-description">Пачка открывается ровно за это время. После этого выходит сигарета — у тебя 5 минут, чтобы записать её.</p>
        <Stepper
          value={data.settings.intervalMin}
          min={5}
          max={480}
          step={5}
          suffix="мин"
          onChange={(v) => onSettings({ intervalMin: v })}
        />
        <div className="presets">
          {presets.map((min) => (
            <button
              key={min}
              className={`preset ${data.settings.intervalMin === min ? "is-active" : ""}`}
              onClick={() => onSettings({ intervalMin: min })}
            >
              {min} мин
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <div className="card-title-row"><h3>Цель на день</h3></div>
        <p className="card-description">Ориентир, чтобы видеть прогресс. Без жёстких ограничений.</p>
        <Stepper
          value={data.settings.dailyGoal}
          min={1}
          max={60}
          step={1}
          suffix="сигарет"
          onChange={(v) => onSettings({ dailyGoal: v })}
        />
      </Card>

      <Card>
        <div className="card-title-row"><h3>Данные</h3><ShieldCheck size={18} /></div>
        <p className="card-description">
          Всё хранится только в этом браузере. Никуда не отправляется, аккаунт не нужен.
          После первого открытия приложение работает и без сети.
        </p>
        <Button variant="danger" onClick={onReset}>
          <RotateCcw size={17} /> Начать заново
        </Button>
      </Card>
    </div>
  );
}
