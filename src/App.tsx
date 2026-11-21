import { useEffect, useState } from "react";
import { BarChart3, CalendarCheck2, CheckCircle2, Cigarette, Settings as SettingsIcon, Timer, type LucideIcon } from "lucide-react";
import { BackgroundDecor } from "@/components/BackgroundDecor";
import { type PackPhase } from "@/components/CigarettePack";
import { ManualEntrySheet } from "@/components/ManualEntrySheet";
import { SettingsView } from "@/components/SettingsView";
import { StatsView } from "@/components/StatsView";
import { TimerView } from "@/components/TimerView";
import { WeeksView } from "@/components/WeeksView";
import { WeeklyReviewModal } from "@/components/WeeklyReviewModal";
import { Segmented } from "@/components/ui";
import {
  notificationState,
  requestNotifications,
  scheduleLocalNotifications,
  showLocalNotification,
  type NotificationState,
} from "@/lib/notifications";
import { SMOKE_WINDOW_MS } from "@/lib/schedule";
import { phaseColor } from "@/lib/phase";
import { addDays, weekStart, weekStartKey } from "@/lib/time";
import { loadData, resetData, saveData } from "@/lib/storage";
import type { AppData, ReviewResult, Settings } from "@/types";

type Tab = "timer" | "stats" | "weeks" | "settings";

function reviewTargetWeek(now: number): string {
  const date = new Date(now);
  if (date.getDay() === 0 && date.getHours() >= 18) return weekStartKey(now);
  return weekStartKey(addDays(weekStart(now), -7));
}

export default function App() {
  const [data, setData] = useState<AppData>(loadData);
  const [now, setNow] = useState(() => Date.now());
  const [tab, setTab] = useState<Tab>("timer");
  const [reviewWeek, setReviewWeek] = useState<string | null>(null);
  const [manualEntry, setManualEntry] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [rippleKey, setRippleKey] = useState(0);
  const [permission, setPermission] = useState<NotificationState>(() => notificationState());
  const [notificationBusy, setNotificationBusy] = useState(false);

  useEffect(() => saveData(data), [data]);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const timer = window.setInterval(tick, 1000);
    window.addEventListener("focus", tick);
    document.addEventListener("visibilitychange", tick);
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {});
    }
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", tick);
      document.removeEventListener("visibilitychange", tick);
    };
  }, []);

  useEffect(() => {
    setPermission(notificationState());
  }, []);

  // Пока приложение открыто, напоминания работают через localStorage-расписание.
  // Фоновая доставка подключается отдельно, когда доступен push-сервис.
  useEffect(() => scheduleLocalNotifications(data, showLocalNotification), [data]);

  // Опрос за прошедшую неделю — один раз, при открытии приложения.
  useEffect(() => {
    const target = reviewTargetWeek(Date.now());
    if (data.events.length && !data.reviews.some((r) => r.weekStart === target) && data.promptedWeek !== target) {
      setReviewWeek(target);
      setData((prev) => ({ ...prev, promptedWeek: target }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timeout);
  }, [toast]);

  const intervalMs = data.settings.intervalMin * 60_000;
  const cycleStart = data.cycleStart;
  const nextAt = cycleStart + intervalMs;
  const windowEnd = nextAt + SMOKE_WINDOW_MS;
  const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

  const remaining = Math.max(0, nextAt - now);
  const windowRemaining = Math.max(0, windowEnd - now);
  const progress = clamp01((now - cycleStart) / intervalMs);
  const windowProgress = clamp01((now - nextAt) / SMOKE_WINDOW_MS);
  const packPhase: PackPhase = now < nextAt ? "waiting" : now < windowEnd ? "open" : "butt";
  const ready = packPhase !== "waiting";

  useEffect(() => {
    document.documentElement.style.setProperty("--phase", phaseColor(progress, ready));
  }, [progress, ready]);

  // Окно сигареты прошло: окурок улетает, новый интервал начинается без записи в статистику.
  useEffect(() => {
    if (packPhase !== "butt") return;
    const timeout = window.setTimeout(() => {
      setData((prev) => ({ ...prev, cycleStart: Date.now() }));
      setRippleKey((key) => key + 1);
      setToast("Окно прошло — отсчёт начался заново. Ничего не записано.");
    }, 850);
    return () => clearTimeout(timeout);
  }, [packPhase, cycleStart]);

  function updateSettings(patch: Partial<Settings>) {
    setData((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }));
  }

  const notificationStatus: NotificationState =
    permission === "unsupported" || permission === "denied"
      ? permission
      : data.settings.pushEnabled && permission === "on"
        ? "on"
        : "off";

  async function toggleNotifications() {
    if (notificationBusy) return;
    if (data.settings.pushEnabled) {
      updateSettings({ pushEnabled: false });
      setToast("Уведомления выключены");
      return;
    }
    setNotificationBusy(true);
    try {
      await requestNotifications();
      setPermission(notificationState());
      updateSettings({ pushEnabled: true });
      setToast("Уведомления включены");
    } catch (error) {
      setPermission(notificationState());
      setToast(error instanceof Error ? error.message : "Не удалось включить уведомления");
    } finally {
      setNotificationBusy(false);
    }
  }

  async function sendTestNotification() {
    const sent = await showLocalNotification(
      "Тест уведомлений",
      "Если вы это видите — уведомления работают.",
      "test",
    );
    setToast(sent ? "Тестовое уведомление показано" : "Не удалось показать уведомление");
  }

  function logSmoke(planned: boolean) {
    const at = Date.now();
    const event = {
      id: crypto.randomUUID(),
      at,
      planned,
      intervalMin: data.settings.intervalMin,
      count: 1,
    };
    setData((prev) => ({
      ...prev,
      cycleStart: at,
      events: [...prev.events, event],
    }));
    setRippleKey((key) => key + 1);
    setToast(planned ? "Записано. Отсчёт начался заново." : "Срыв записан. Продолжаем дальше — без осуждения.");
    setNow(at);
  }

  function skipWindow() {
    const at = Date.now();
    setData((prev) => ({ ...prev, cycleStart: at }));
    setNow(at);
    setToast("Пропущено — в статистике ничего не записано");
  }

  // Ручная запись — это сигареты, выкуренные сейчас: просто число, без ввода времени.
  function addManualEntry(entry: { count: number; planned: boolean }) {
    const at = Date.now();
    setData((prev) => ({
      ...prev,
      cycleStart: at,
      events: [
        ...prev.events,
        {
          id: crypto.randomUUID(),
          at,
          planned: entry.planned,
          intervalMin: prev.settings.intervalMin,
          count: entry.count,
        },
      ],
    }));
    setNow(at);
    setManualEntry(false);
    setRippleKey((key) => key + 1);
    setToast(`Добавлено ${entry.count} шт. — статистика обновлена`);
  }

  function deleteEvent(id: string) {
    if (!window.confirm("Удалить эту запись из статистики?")) return;
    setData((prev) => {
      const deleted = prev.events.find((event) => event.id === id);
      const events = prev.events.filter((event) => event.id !== id);
      const last = events.at(-1);
      const cycleStart =
        deleted && prev.cycleStart <= deleted.at ? (last?.at ?? prev.startedAt) : prev.cycleStart;
      return { ...prev, events, cycleStart };
    });
    setToast("Запись удалена из статистики");
  }

  function submitReview(review: {
    result: ReviewResult;
    slips: number;
    note: string;
    nextIntervalMin: number;
  }) {
    if (!reviewWeek) return;
    const next = {
      weekStart: reviewWeek,
      ...review,
      createdAt: Date.now(),
    };
    setData((prev) => ({
      ...prev,
      reviews: [...prev.reviews.filter((r) => r.weekStart !== reviewWeek), next],
      settings: { ...prev.settings, intervalMin: review.nextIntervalMin },
      promptedWeek: reviewWeek,
    }));
    setReviewWeek(null);
    setToast("Итоги недели сохранены");
  }

  function reset() {
    if (!window.confirm("Удалить все записи, итоги недель и настройки? Это нельзя отменить.")) return;
    setData(resetData());
    setTab("timer");
    setToast("Данные очищены — можно начать заново");
  }

  const tabs: { value: Tab; label: string; icon: LucideIcon }[] = [
    { value: "timer", label: "Таймер", icon: Timer },
    { value: "stats", label: "Статистика", icon: BarChart3 },
    { value: "weeks", label: "Недели", icon: CalendarCheck2 },
    { value: "settings", label: "Настройки", icon: SettingsIcon },
  ];

  return (
    <div className="app-shell">
      <BackgroundDecor ready={ready} progress={progress} rippleKey={rippleKey} />

      <header className="app-header">
        <div className="brand">
          <div className="brand-mark"><Cigarette size={22} strokeWidth={2.2} /></div>
          <div className="brand-text"><strong>Пауза</strong><span>контроль курения</span></div>
        </div>
        <div className="header-right">
          <div className={`header-status ${ready ? "is-ready" : ""}`}>
            <span className="status-dot" />
            {ready ? "Можно" : "Ожидание"}
          </div>
          <Segmented
            className="header-tabs"
            value={tab}
            options={tabs.map(({ value, label, icon: Icon }) => ({
              value,
              label: <span className="tab-label"><Icon size={16} /> {label}</span>,
            }))}
            onChange={(value) => setTab(value as Tab)}
          />
        </div>
      </header>

      <main className="app-main">
        {tab === "timer" && (
          <TimerView
            data={data}
            now={now}
            remaining={remaining}
            windowRemaining={windowRemaining}
            progress={progress}
            windowProgress={windowProgress}
            packPhase={packPhase}
            onSmoke={logSmoke}
            onSkip={skipWindow}
            onOpenSettings={() => setTab("settings")}
          />
        )}
        {tab === "stats" && (
          <StatsView
            data={data}
            now={now}
            onAdd={() => setManualEntry(true)}
            onDelete={deleteEvent}
          />
        )}
        {tab === "weeks" && <WeeksView data={data} now={now} onOpenReview={setReviewWeek} />}
        {tab === "settings" && (
          <SettingsView
            data={data}
            notificationState={notificationStatus}
            notificationsBusy={notificationBusy}
            onSettings={updateSettings}
            onToggleNotifications={toggleNotifications}
            onTestNotifications={sendTestNotification}
            onReset={reset}
          />
        )}
      </main>

      <footer className="app-footer">
        <CheckCircle2 size={15} /> Данные остаются в твоём браузере · без аккаунта и облака
      </footer>

      <nav className="bottom-nav" aria-label="Разделы">
        {tabs.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            className={`bottom-nav-item ${tab === value ? "is-active" : ""}`}
            onClick={() => setTab(value)}
          >
            <Icon size={21} strokeWidth={tab === value ? 2.4 : 1.8} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {manualEntry && (
        <ManualEntrySheet
          onClose={() => setManualEntry(false)}
          onSave={addManualEntry}
        />
      )}

      {reviewWeek && (
        <WeeklyReviewModal
          data={data}
          week={reviewWeek}
          onClose={() => setReviewWeek(null)}
          onSubmit={submitReview}
        />
      )}

      {toast && <div className="toast"><CheckCircle2 size={17} /> {toast}</div>}
    </div>
  );
}
