import { Bell, BellOff, BellRing, RotateCcw, ShieldCheck } from "lucide-react";
import { Badge, Button, Card, Stepper } from "@/components/ui";
import { needsHomeScreen, type NotificationState } from "@/lib/notifications";
import type { AppData } from "@/types";

const presets = [30, 45, 60, 90, 120];

const statusText: Record<NotificationState, string> = {
  on: "включены",
  off: "выключены",
  denied: "заблокированы",
  unsupported: "недоступны",
};

export function SettingsView({
  data,
  notificationState,
  notificationsBusy,
  onSettings,
  onToggleNotifications,
  onTestNotifications,
  onReset,
}: {
  data: AppData;
  notificationState: NotificationState;
  notificationsBusy: boolean;
  onSettings: (patch: Partial<AppData["settings"]>) => void;
  onToggleNotifications: () => void;
  onTestNotifications: () => void;
  onReset: () => void;
}) {
  const enabled = notificationState === "on";
  const statusTone =
    notificationState === "on"
      ? "good"
      : notificationState === "denied"
        ? "bad"
        : notificationState === "unsupported"
          ? "warn"
          : "neutral";

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
        <div className="card-title-row">
          <h3>Уведомления</h3>
          <Badge tone={statusTone}>{statusText[notificationState]}</Badge>
        </div>
        <p className="card-description">
          Напомним перед сигаретой, когда пачка откроется, за минуту до конца окна и в конце недели.
        </p>
        <div className="toggle-row">
          <div className="toggle-copy">
            {enabled ? <Bell size={18} /> : <BellOff size={18} />}
            <span>{enabled ? "Уведомления включены" : "Включить уведомления"}</span>
          </div>
          <button
            type="button"
            className={`toggle ${enabled ? "is-on" : ""}`}
            role="switch"
            aria-checked={enabled}
            aria-label={enabled ? "Выключить уведомления" : "Включить уведомления"}
            disabled={notificationsBusy || notificationState === "unsupported"}
            onClick={onToggleNotifications}
          >
            <span className="toggle-track"><span className="toggle-knob" /></span>
          </button>
        </div>

        <div className="notification-actions">
          <Button
            variant="ghost"
            size="sm"
            disabled={notificationsBusy || notificationState === "unsupported"}
            onClick={onTestNotifications}
          >
            <BellRing size={16} /> {enabled ? "Проверить уведомление" : "Включить и проверить"}
          </Button>
        </div>

        {enabled && (
          <div className="notification-reminder">
            <span>Напомнить за</span>
            <Stepper
              value={data.settings.reminderBeforeMin}
              min={0}
              max={60}
              step={5}
              suffix="мин"
              onChange={(v) => onSettings({ reminderBeforeMin: v })}
            />
          </div>
        )}

        {notificationState === "denied" && (
          <p className="notification-help is-warn">
            Разрешение запрещено. Включите уведомления для сайта в настройках браузера, затем вернитесь сюда.
          </p>
        )}
        {notificationState === "unsupported" && (
          <p className="notification-help">Этот браузер не поддерживает уведомления.</p>
        )}
        {needsHomeScreen() && (
          <p className="notification-help">
            На iPhone добавьте сайт «На главный экран» и открывайте Паузу оттуда — только так iOS разрешит уведомления.
          </p>
        )}
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
