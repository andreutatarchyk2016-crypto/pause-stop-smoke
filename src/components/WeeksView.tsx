import { CalendarCheck2, ChevronRight, ClipboardList } from "lucide-react";
import { Badge, Button, Card } from "@/components/ui";
import { addDays, formatDay, weekLabel, weekStart, weekStartKey } from "@/lib/time";
import { countEvents, weekEvents } from "@/lib/stats";
import type { AppData, ReviewResult } from "@/types";

const resultLabel: Record<ReviewResult, string> = {
  good: "По графику",
  partial: "Почти получилось",
  bad: "Были срывы",
};

export function WeeksView({
  data,
  now,
  onOpenReview,
}: {
  data: AppData;
  now: number;
  onOpenReview: (week: string) => void;
}) {
  const start = weekStart(now);
  const key = weekStartKey(now);
  const events = weekEvents(data.events, now);
  const total = countEvents(events);
  const slips = countEvents(events, false);
  const review = data.reviews.find((r) => r.weekStart === key);
  const passed = Math.min(7, Math.floor((now - start.getTime()) / 86_400_000) + 1);
  const adherence = total ? Math.round(((total - slips) / total) * 100) : 100;

  return (
    <div className="view">
      <div className="view-heading">
        <div>
          <div className="section-kicker">НЕДЕЛИ</div>
          <h2 className="section-title">Итоги и планы</h2>
        </div>
        <Badge tone="neutral">{weekLabel(start)}</Badge>
      </div>

      <Card className="week-summary">
        <div className="week-progress-head">
          <CalendarCheck2 size={20} />
          <span>Текущая неделя · день {passed} из 7</span>
        </div>
        <div className="week-progress">
          <span style={{ width: `${(passed / 7) * 100}%` }} />
        </div>
        <div className="week-metrics">
          <div><strong>{total}</strong><span>сигарет</span></div>
          <div><strong>{slips}</strong><span>срывов</span></div>
          <div><strong>{adherence}%</strong><span>по графику</span></div>
        </div>
        {review ? (
          <div className="review-done">
            <Badge tone="good">{resultLabel[review.result]}</Badge>
            <span>Опрос заполнен · срывов: {review.slips} · интервал дальше: {review.nextIntervalMin} мин</span>
          </div>
        ) : (
          <Button onClick={() => onOpenReview(key)}>
            <ClipboardList size={17} /> Заполнить опрос недели
          </Button>
        )}
      </Card>

      <Card>
        <div className="card-title-row">
          <h3>История недель</h3>
          <span className="muted">{data.reviews.length} опросов</span>
        </div>
        {data.reviews.length === 0 ? (
          <p className="empty">Первый опрос появится здесь в конце недели. Мы также напомним уведомлением, если оно включено.</p>
        ) : (
          <div className="review-list">
            {[...data.reviews]
              .sort((a, b) => b.weekStart.localeCompare(a.weekStart))
              .map((item) => {
                const startDay = new Date(`${item.weekStart}T00:00:00`);
                return (
                  <button className="review-row" key={item.weekStart} onClick={() => onOpenReview(item.weekStart)}>
                    <div>
                      <strong>{weekLabel(startDay)}</strong>
                      <span>{formatDay(addDays(startDay, 6).getTime())} · срывов {item.slips}</span>
                    </div>
                    <Badge tone={item.result === "good" ? "good" : item.result === "partial" ? "warn" : "bad"}>
                      {resultLabel[item.result]}
                    </Badge>
                    <ChevronRight size={16} />
                  </button>
                );
              })}
          </div>
        )}
      </Card>

      <p className="hint-card">
        Опрос открывается сам в воскресенье вечером (если включены уведомления) или в понедельник при открытии приложения.
        Здесь его можно заполнить в любой момент.
      </p>
    </div>
  );
}
