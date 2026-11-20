import { Check, Flame, ShieldAlert, SkipForward, TrendingDown } from "lucide-react";
import { CigarettePack, type PackPhase } from "@/components/CigarettePack";
import { Badge, Button, Card } from "@/components/ui";
import { dayKey, weekStartKey } from "@/lib/time";
import { countEvents } from "@/lib/stats";
import type { AppData } from "@/types";

export function TimerView({
  data,
  now,
  remaining,
  windowRemaining,
  progress,
  windowProgress,
  packPhase,
  onSmoke,
  onSkip,
  onOpenSettings,
}: {
  data: AppData;
  now: number;
  remaining: number;
  windowRemaining: number;
  progress: number;
  windowProgress: number;
  packPhase: PackPhase;
  onSmoke: (planned: boolean) => void;
  onSkip: () => void;
  onOpenSettings: () => void;
}) {
  const today = dayKey(now);
  const week = weekStartKey(now);
  const todayEvents = data.events.filter((e) => dayKey(e.at) === today);
  const weekEvents = data.events.filter((e) => weekStartKey(e.at) === week);
  const slips = countEvents(weekEvents, false);
  const goal = data.settings.dailyGoal;
  const goalPct = Math.min(100, Math.round((countEvents(todayEvents) / goal) * 100));
  const last = data.events.at(-1);

  const title =
    packPhase === "waiting"
      ? "Пачка открывается"
      : packPhase === "open"
        ? "Сигарета вышла — решай"
        : "Окурок улетает";
  const badge =
    packPhase === "waiting" ? "ожидание" : packPhase === "open" ? "окно 5 минут" : "новый круг";

  return (
    <div className="view timer-view">
      <Card className="hero-card">
        <div className="hero-top">
          <div>
            <div className="section-kicker">ГЛАВНЫЙ ТАЙМЕР</div>
            <h2 className="section-title">{title}</h2>
          </div>
          <Badge tone={packPhase === "waiting" ? "warn" : "good"}>{badge}</Badge>
        </div>

        <CigarettePack
          phase={packPhase}
          progress={progress}
          windowProgress={windowProgress}
          remaining={packPhase === "waiting" ? remaining : windowRemaining}
          intervalMin={data.settings.intervalMin}
        />

        <div className="hero-actions">
          {packPhase === "open" ? (
            <>
              <Button onClick={() => onSmoke(true)} className="wide">
                <Check size={18} /> Я покурил(а)
              </Button>
              <Button variant="ghost" onClick={onSkip}>
                <SkipForward size={16} /> Не курил — пропустить
              </Button>
            </>
          ) : packPhase === "waiting" ? (
            <Button variant="danger" onClick={() => onSmoke(false)} className="wide">
              <Flame size={18} /> Записать срыв
            </Button>
          ) : null}
          <Button variant="ghost" onClick={onOpenSettings}>
            Изменить интервал
          </Button>
        </div>

        <p className="hero-footnote">
          {last
            ? `Последняя запись: ${last.count || 1} шт. · ${last.planned ? "по графику" : "срыв"}`
            : "Записей пока нет. Пропущенные окна в статистику не попадают."}
        </p>
      </Card>

      <div className="stat-grid">
        <Card className="mini-stat">
          <TrendingDown size={18} className="stat-icon stat-icon-accent" />
          <div className="stat-value">
            {countEvents(todayEvents)}<span>/{goal}</span>
          </div>
          <div className="stat-label">сигарет сегодня</div>
          <div className="mini-bar"><span style={{ width: `${goalPct}%` }} /></div>
        </Card>
        <Card className="mini-stat">
          <ShieldAlert size={18} className="stat-icon stat-icon-bad" />
          <div className="stat-value">{slips}</div>
          <div className="stat-label">срывов за неделю</div>
          <div className="stat-sub">без осуждения — просто факт</div>
        </Card>
        <Card className="mini-stat">
          <Flame size={18} className="stat-icon stat-icon-warn" />
          <div className="stat-value">{countEvents(weekEvents)}</div>
          <div className="stat-label">сигарет за неделю</div>
          <div className="stat-sub">план: {goal * 7} в неделю</div>
        </Card>
      </div>
    </div>
  );
}
