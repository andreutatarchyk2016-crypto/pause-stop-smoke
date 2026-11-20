import { BarChart3, Clock3, Download, Plus, ShieldCheck, ShieldX, Trash2 } from "lucide-react";
import { Badge, Button, Card } from "@/components/ui";
import { dayKey, formatDay, formatDuration, formatTime } from "@/lib/time";
import { countEvents, disciplineStreak, lastDays, longestGap, weekEvents } from "@/lib/stats";
import type { AppData } from "@/types";

export function StatsView({
  data,
  now,
  onAdd,
  onDelete,
}: {
  data: AppData;
  now: number;
  onAdd: () => void;
  onDelete: (id: string) => void;
}) {
  const week = weekEvents(data.events, now);
  const slips = countEvents(week, false);
  const totalSmoked = countEvents(data.events);
  const streak = disciplineStreak(data, now);
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  const best = longestGap(week, Math.max(start.getTime(), data.startedAt));
  const days = lastDays(data, now, 7);
  const max = Math.max(1, ...days.map((d) => d.total));

  function exportCsv() {
    const lines = [
      "дата;время;статус;интервал_мин;кол-во",
      ...[...data.events]
        .sort((a, b) => a.at - b.at)
        .map((e) =>
          [
            dayKey(e.at),
            formatTime(e.at),
            e.planned ? "по графику" : "срыв",
            e.intervalMin,
            e.count || 1,
          ].join(";"),
        ),
    ];
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pause-statistics-${dayKey(now)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="view">
      <div className="view-heading">
        <div>
          <div className="section-kicker">СТАТИСТИКА</div>
          <h2 className="section-title">Как идут дела</h2>
        </div>
        <div className="heading-actions">
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download size={16} /> CSV
          </Button>
          <Button variant="primary" size="sm" onClick={onAdd}>
            <Plus size={16} /> Добавить
          </Button>
        </div>
      </div>

      <div className="stat-grid">
        <Card className="mini-stat">
          <ShieldCheck size={18} className="stat-icon stat-icon-good" />
          <div className="stat-value">{streak}<span> дн.</span></div>
          <div className="stat-label">серия по графику</div>
        </Card>
        <Card className="mini-stat">
          <Clock3 size={18} className="stat-icon stat-icon-accent" />
          <div className="stat-value">{best ? formatDuration(best) : "—"}</div>
          <div className="stat-label">лучший интервал</div>
        </Card>
        <Card className="mini-stat">
          <ShieldX size={18} className="stat-icon stat-icon-bad" />
          <div className="stat-value">{slips}</div>
          <div className="stat-label">срывов за неделю</div>
        </Card>
        <Card className="mini-stat">
          <BarChart3 size={18} className="stat-icon stat-icon-warn" />
          <div className="stat-value">{countEvents(week)}</div>
          <div className="stat-label">сигарет за неделю</div>
        </Card>
      </div>

      <Card>
        <div className="card-title-row">
          <h3>Последние 7 дней</h3>
          <span className="muted">по графику / срывы</span>
        </div>
        <div className="chart">
          {days.map((day) => (
            <div className="chart-column" key={day.key}>
              <div className="chart-bars" style={{ height: `${Math.max(4, (day.total / max) * 132)}px` }}>
                {day.slip > 0 && (
                  <span className="bar bar-slip" style={{ flex: day.slip }} title={`Срывы: ${day.slip}`} />
                )}
                {day.planned > 0 && (
                  <span className="bar bar-planned" style={{ flex: day.planned }} title={`По графику: ${day.planned}`} />
                )}
              </div>
              <span className="chart-label">{day.label}</span>
              <span className="chart-value">{day.total || "·"}</span>
            </div>
          ))}
        </div>
        <div className="chart-legend">
          <span><i className="dot dot-good" /> по графику</span>
          <span><i className="dot dot-bad" /> срыв</span>
        </div>
      </Card>

      <Card>
        <div className="card-title-row">
          <h3>Последние записи</h3>
          <span className="muted">{totalSmoked} шт. всего</span>
        </div>
        {data.events.length === 0 ? (
          <p className="empty">Записей пока нет. Нажми «Добавить», чтобы внести сигареты, или «Я покурил(а)» на таймере.</p>
        ) : (
          <div className="event-list">
            {[...data.events]
              .reverse()
              .slice(0, 8)
              .map((event) => (
                <div className="event-row" key={event.id}>
                  <div className="event-time">{formatDay(event.at)} <span>{event.count || 1} шт.</span></div>
                  <div className="event-meta">интервал {event.intervalMin} мин</div>
                  <Badge tone={event.planned ? "good" : "bad"}>
                    {event.planned ? "по графику" : "срыв"}
                  </Badge>
                  <button
                    className="event-delete"
                    aria-label={`Удалить запись от ${formatDay(event.at)} ${formatTime(event.at)}`}
                    title="Удалить запись"
                    onClick={() => onDelete(event.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
          </div>
        )}
      </Card>
    </div>
  );
}
