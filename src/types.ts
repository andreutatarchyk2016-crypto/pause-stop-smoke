export type ReviewResult = "good" | "partial" | "bad";

export type Settings = {
  intervalMin: number;
  dailyGoal: number;
  reminderBeforeMin: number;
  pushEnabled: boolean;
};

export type SmokeEvent = {
  id: string;
  at: number;
  planned: boolean;
  intervalMin: number;
};

export type WeekReview = {
  weekStart: string;
  result: ReviewResult;
  slips: number;
  note: string;
  nextIntervalMin: number;
  createdAt: number;
};

export type AppData = {
  version: 1;
  deviceId: string;
  startedAt: number;
  /** Начало текущего цикла: может сдвинуться и без записи, если окно сигареты истекло. */
  cycleStart: number;
  settings: Settings;
  events: SmokeEvent[];
  reviews: WeekReview[];
  promptedWeek?: string;
};
