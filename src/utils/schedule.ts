import {
  addDays,
  format,
  getDay,
  isAfter,
  parse,
  startOfWeek,
  subDays,
} from "date-fns";

export const DAY_FMT = "yyyy-MM-dd";

const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MON_FIRST = [1, 2, 3, 4, 5, 6, 0];

export function clamp(value: number, min: number, max: number) {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, Math.floor(value)));
}

export function toDayKey(date: Date): string {
  return format(date, DAY_FMT);
}

export function fromDayKey(key: string): Date {
  return parse(key, DAY_FMT, new Date());
}

export type Schedule =
  | { kind: "daily" }
  | { kind: "weekdays"; weekdays: number[] }
  | { kind: "nPerWeek"; daysPerWeek: number };

export interface Subtask {
  id: number;
  name: string;
  timesPerDay: number;
}

export interface Task {
  id: number;
  name: string;
  color: string;
  createdOn: string;
  schedule: Schedule;
  timesPerDay: number;
  subtasks: Subtask[];
  streakAnchor: string | null;
}

export interface CompletionLog {
  taskId: number;
  subtaskId: number | null;
  date: string;
  count: number;
}

export function cleanSchedule(raw: unknown): Schedule {
  if (!raw || typeof raw !== "object") return { kind: "daily" };
  const value = raw as Record<string, unknown>;
  if (value.kind === "weekdays") {
    const days = Array.isArray(value.weekdays)
      ? value.weekdays.map(Number).filter((day) => day >= 0 && day <= 6)
      : [];
    const unique = Array.from(new Set(days));
    return {
      kind: "weekdays",
      weekdays: unique.length ? unique : [1, 2, 3, 4, 5],
    };
  }
  if (value.kind === "nPerWeek") {
    return {
      kind: "nPerWeek",
      daysPerWeek: clamp(Number(value.daysPerWeek) || 1, 1, 7),
    };
  }
  return { kind: "daily" };
}

export function sanitizeTask(raw: unknown): Task | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Record<string, unknown>;
  if (typeof value.name !== "string" || !value.name.trim()) return null;
  const subtasksRaw = Array.isArray(value.subtasks) ? value.subtasks : [];
  const subtasks: Subtask[] = [];
  for (const item of subtasksRaw) {
    if (!item || typeof item !== "object") continue;
    const sub = item as Record<string, unknown>;
    if (typeof sub.name !== "string" || !sub.name.trim()) continue;
    subtasks.push({
      id: Number(sub.id) || 0,
      name: sub.name.trim(),
      timesPerDay: clamp(Number(sub.timesPerDay) || 1, 1, 12),
    });
  }
  const createdOn =
    typeof value.createdOn === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value.createdOn)
      ? value.createdOn
      : toDayKey(new Date());
  const streakAnchor =
    typeof value.streakAnchor === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value.streakAnchor)
      ? value.streakAnchor
      : null;
  return {
    id: Number(value.id) || 0,
    name: value.name.trim(),
    color: typeof value.color === "string" && value.color ? value.color : "#ffb3b3",
    createdOn,
    schedule: cleanSchedule(value.schedule),
    timesPerDay: clamp(Number(value.timesPerDay) || 1, 1, 12),
    subtasks,
    streakAnchor,
  };
}

export function anchorKey(task: Task): string {
  if (task.streakAnchor && task.streakAnchor > task.createdOn) return task.streakAnchor;
  return task.createdOn;
}

export function isDayScheduled(schedule: Schedule, date: Date): boolean {
  if (schedule.kind === "daily") return true;
  if (schedule.kind === "weekdays") return schedule.weekdays.includes(getDay(date));
  return true;
}

export function isScheduledToday(task: Task, todayKey: string): boolean {
  if (task.createdOn > todayKey) return false;
  if (task.schedule.kind === "nPerWeek") return true;
  return isDayScheduled(task.schedule, fromDayKey(todayKey));
}

export interface SubtaskDay {
  id: number;
  name: string;
  count: number;
  target: number;
  met: boolean;
}

export interface DayScore {
  date: string;
  scheduled: boolean;
  manual: number;
  target: number;
  subtasks: SubtaskDay[];
  ratio: number;
  met: boolean;
}

export function loggedCount(
  logs: CompletionLog[],
  taskId: number,
  subtaskId: number | null,
  date: string
): number {
  return logs
    .filter(
      (log) => log.taskId === taskId && log.subtaskId === subtaskId && log.date === date
    )
    .reduce((sum, log) => sum + Math.max(0, log.count), 0);
}

export function scoreDay(task: Task, logs: CompletionLog[], dateKey: string): DayScore {
  const date = fromDayKey(dateKey);
  const scheduled =
    task.schedule.kind === "nPerWeek" ? true : isDayScheduled(task.schedule, date);
  const manual = loggedCount(logs, task.id, null, dateKey);
  const target = clamp(task.timesPerDay || 1, 1, 12);
  const subtasks: SubtaskDay[] = task.subtasks.map((subtask) => {
    const count = loggedCount(logs, task.id, subtask.id, dateKey);
    const subTarget = clamp(subtask.timesPerDay || 1, 1, 12);
    return {
      id: subtask.id,
      name: subtask.name,
      count,
      target: subTarget,
      met: count >= subTarget,
    };
  });

  const manualRatio = Math.min(1, manual / target);
  let ratio = manualRatio;
  let met = manual >= target;
  if (subtasks.length > 0) {
    const subRatio =
      subtasks.reduce((sum, subtask) => sum + Math.min(1, subtask.count / subtask.target), 0) /
      subtasks.length;
    ratio = Math.max(manualRatio, subRatio);
    met = met || subtasks.every((subtask) => subtask.met);
  }

  if (!scheduled) {
    return {
      date: dateKey,
      scheduled: false,
      manual,
      target,
      subtasks,
      ratio: 0,
      met: false,
    };
  }

  return { date: dateKey, scheduled: true, manual, target, subtasks, ratio, met };
}

export function metPartCount(score: DayScore): number {
  return score.subtasks.filter((subtask) => subtask.met).length;
}

export type DotKind = "none" | "off" | "done" | "today" | "missed" | "optional";

export function dotKind(task: Task, score: DayScore, todayKey: string): DotKind {
  if (score.date < task.createdOn) return "none";
  if (task.schedule.kind !== "nPerWeek" && !score.scheduled) return "off";
  if (score.met) return "done";
  if (score.date === todayKey) return "today";
  if (score.date > todayKey) return "none";
  if (task.schedule.kind === "nPerWeek") return "optional";
  return "missed";
}

export function dotLabel(task: Task, score: DayScore, todayKey: string): string {
  const kind = dotKind(task, score, todayKey);
  const day = format(fromDayKey(score.date), "EEE, MMM d");
  const names: Record<DotKind, string> = {
    none: "Not tracked",
    off: "Not scheduled",
    done: "Done",
    today: "Today",
    missed: "Missed",
    optional: "Not logged",
  };
  return `${day}: ${names[kind]}`;
}

export function recentScores(
  task: Task,
  logs: CompletionLog[],
  todayKey: string,
  count = 14
): DayScore[] {
  const scores: DayScore[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const key = toDayKey(subDays(fromDayKey(todayKey), i));
    scores.push(scoreDay(task, logs, key));
  }
  return scores;
}

export type StreakStatus = "new" | "active" | "broken";

export interface Streak {
  status: StreakStatus;
  unit: "day" | "week";
  current: number;
  previous: number;
  brokenOn: string | null;
}

function eachDay(fromKey: string, toKey: string): string[] {
  const days: string[] = [];
  let cursor = fromDayKey(fromKey);
  const end = fromDayKey(toKey);
  while (!isAfter(cursor, end)) {
    days.push(toDayKey(cursor));
    cursor = addDays(cursor, 1);
  }
  return days;
}

function evaluateDailyStreak(task: Task, logs: CompletionLog[], todayKey: string): Streak {
  const start = anchorKey(task);
  if (start > todayKey) {
    return { status: "new", unit: "day", current: 0, previous: 0, brokenOn: null };
  }
  const scheduled = eachDay(start, todayKey)
    .map((key) => ({ key, score: scoreDay(task, logs, key) }))
    .filter((day) => day.score.scheduled);
  const past = scheduled.filter((day) => day.key < todayKey);
  const firstMiss = past.find((day) => !day.score.met);
  if (firstMiss) {
    const previous = past.filter((day) => day.key < firstMiss.key && day.score.met).length;
    return {
      status: "broken",
      unit: "day",
      current: 0,
      previous,
      brokenOn: firstMiss.key,
    };
  }
  let current = 0;
  for (let i = scheduled.length - 1; i >= 0; i--) {
    const item = scheduled[i];
    if (item.key === todayKey && !item.score.met) continue;
    if (!item.score.met) break;
    current += 1;
  }
  return {
    status: current > 0 ? "active" : "new",
    unit: "day",
    current,
    previous: 0,
    brokenOn: null,
  };
}

export interface WeekResult {
  weekStart: string;
  weekEnd: string;
  metDays: number;
  required: number;
  available: number;
  state: "success" | "fail" | "open" | "ignored";
}

function evaluateWeek(
  task: Task,
  logs: CompletionLog[],
  weekStart: Date,
  todayKey: string,
  anchor: string
): WeekResult {
  const required =
    task.schedule.kind === "nPerWeek" ? clamp(task.schedule.daysPerWeek, 1, 7) : 7;
  const weekEnd = addDays(weekStart, 6);
  const weekStartKey = toDayKey(weekStart);
  const weekEndKey = toDayKey(weekEnd);
  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    const key = toDayKey(addDays(weekStart, i));
    if (key >= anchor && key <= weekEndKey) days.push(key);
  }
  const available = days.length;
  const metDays = days.filter((day) => day <= todayKey && scoreDay(task, logs, day).met).length;
  const chancesLeft = days.filter((day) => {
    if (day < todayKey) return false;
    if (day > todayKey) return true;
    return !scoreDay(task, logs, day).met;
  }).length;
  const weekEnded = weekEndKey < todayKey;
  let state: WeekResult["state"];
  if (available < required) {
    state = "ignored";
  } else if (metDays >= required) {
    state = "success";
  } else if (weekEnded || metDays + chancesLeft < required) {
    state = "fail";
  } else {
    state = "open";
  }
  return { weekStart: weekStartKey, weekEnd: weekEndKey, metDays, required, available, state };
}

function weeksCovering(anchor: string, todayKey: string): Date[] {
  const weeks: Date[] = [];
  let cursor = startOfWeek(fromDayKey(anchor), { weekStartsOn: 1 });
  const end = startOfWeek(fromDayKey(todayKey), { weekStartsOn: 1 });
  while (!isAfter(cursor, end)) {
    weeks.push(cursor);
    cursor = addDays(cursor, 7);
  }
  return weeks;
}

function evaluateWeeklyStreak(task: Task, logs: CompletionLog[], todayKey: string): Streak {
  const anchor = anchorKey(task);
  if (anchor > todayKey) {
    return { status: "new", unit: "week", current: 0, previous: 0, brokenOn: null };
  }
  const weeks = weeksCovering(anchor, todayKey).map((weekStart) =>
    evaluateWeek(task, logs, weekStart, todayKey, anchor)
  );
  const firstFailIndex = weeks.findIndex((week) => week.state === "fail");
  if (firstFailIndex >= 0) {
    let previous = 0;
    for (let i = firstFailIndex - 1; i >= 0; i--) {
      if (weeks[i].state === "success") previous += 1;
      else if (weeks[i].state === "ignored" || weeks[i].state === "open") continue;
      else break;
    }
    return {
      status: "broken",
      unit: "week",
      current: 0,
      previous,
      brokenOn: weeks[firstFailIndex].weekStart,
    };
  }
  let current = 0;
  for (let i = weeks.length - 1; i >= 0; i--) {
    if (weeks[i].state === "success") current += 1;
    else if (weeks[i].state === "open" || weeks[i].state === "ignored") continue;
    else break;
  }
  return {
    status: current > 0 ? "active" : "new",
    unit: "week",
    current,
    previous: 0,
    brokenOn: null,
  };
}

export function evaluateStreak(task: Task, logs: CompletionLog[], todayKey: string): Streak {
  if (task.schedule.kind === "nPerWeek") return evaluateWeeklyStreak(task, logs, todayKey);
  return evaluateDailyStreak(task, logs, todayKey);
}

export function currentWeek(
  task: Task,
  logs: CompletionLog[],
  todayKey: string
): WeekResult | null {
  if (task.schedule.kind !== "nPerWeek") return null;
  const anchor = anchorKey(task);
  const start = startOfWeek(fromDayKey(todayKey), { weekStartsOn: 1 });
  return evaluateWeek(task, logs, start, todayKey, anchor);
}

export function weekLine(week: WeekResult): string {
  if (week.state === "ignored") {
    return "Not enough days left this week for a full count.";
  }
  return `${week.metDays} of ${week.required} days this week`;
}

export function scheduleLabel(schedule: Schedule): string {
  if (schedule.kind === "daily") return "Every day";
  if (schedule.kind === "nPerWeek") {
    const n = clamp(schedule.daysPerWeek, 1, 7);
    return n === 1 ? "1 day a week" : `${n} days a week`;
  }
  const selected = new Set(schedule.weekdays);
  if (selected.size >= 7) return "Every day";
  return MON_FIRST.filter((day) => selected.has(day))
    .map((day) => DAY_SHORT[day])
    .join(", ");
}

export function timesLabel(times: number): string {
  const n = clamp(times, 1, 12);
  return n === 1 ? "once a day" : `${n} times a day`;
}

export function streakCopy(streak: Streak): { headline: string; detail: string } {
  const unit = streak.unit === "week" ? "week" : "day";
  const plural = (count: number) => `${count} ${unit}${count === 1 ? "" : "s"}`;
  if (streak.status === "broken") {
    const when = !streak.brokenOn
      ? ""
      : streak.unit === "week"
        ? `Missed the week of ${format(fromDayKey(streak.brokenOn), "MMM d")}.`
        : `Missed ${format(fromDayKey(streak.brokenOn), "EEE, MMM d")}.`;
    const last =
      streak.previous > 0
        ? `Last streak was ${plural(streak.previous)}.`
        : "It broke before a streak could form.";
    return { headline: "Streak broken", detail: `${last} ${when}`.trim() };
  }
  if (streak.current <= 0) {
    return {
      headline: "No streak yet",
      detail:
        streak.unit === "week"
          ? "Hit the days this week to start one."
          : "Log a scheduled day to start one.",
    };
  }
  return { headline: plural(streak.current), detail: "Current streak" };
}

export function nextTaskId(tasks: Task[]): number {
  let max = 0;
  for (const task of tasks) {
    max = Math.max(max, task.id);
    for (const subtask of task.subtasks) max = Math.max(max, subtask.id);
  }
  return max + 1;
}
