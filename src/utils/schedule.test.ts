import { getDay } from "date-fns";
import {
  CompletionLog,
  Task,
  cleanSchedule,
  dotKind,
  evaluateStreak,
  fromDayKey,
  metPartCount,
  scoreDay,
  streakCopy,
  streakSummary,
  successSummary,
  weekLine,
  currentWeek,
} from "./schedule";

function task(partial: Partial<Task> & Pick<Task, "createdOn" | "schedule">): Task {
  return {
    id: 1,
    name: "Read",
    color: "#fff4b3",
    timesPerDay: 1,
    subtasks: [],
    streakAnchor: null,
    ...partial,
  };
}

function log(date: string, extra: Partial<CompletionLog> = {}): CompletionLog {
  return { taskId: 1, subtaskId: null, date, count: 1, ...extra };
}

describe("sample calendar", () => {
  it("keeps the November 2026 fixtures on the expected weekdays", () => {
    expect(getDay(fromDayKey("2026-11-02"))).toBe(1);
    expect(getDay(fromDayKey("2026-11-04"))).toBe(3);
    expect(getDay(fromDayKey("2026-11-06"))).toBe(5);
    expect(getDay(fromDayKey("2026-11-07"))).toBe(6);
    expect(getDay(fromDayKey("2026-11-09"))).toBe(1);
  });
});

describe("scoreDay", () => {
  it("lets finished parts complete the parent without a direct log", () => {
    const item = task({
      createdOn: "2026-11-02",
      schedule: { kind: "daily" },
      subtasks: [
        { id: 2, name: "Chapter", timesPerDay: 1 },
        { id: 3, name: "Notes", timesPerDay: 1 },
      ],
    });
    const partial = scoreDay(item, [log("2026-11-02", { subtaskId: 2 })], "2026-11-02");
    expect(partial.met).toBe(false);
    expect(metPartCount(partial)).toBe(1);
    expect(partial.ratio).toBeCloseTo(0.5);

    const done = scoreDay(
      item,
      [log("2026-11-02", { subtaskId: 2 }), log("2026-11-02", { subtaskId: 3 })],
      "2026-11-02"
    );
    expect(done.met).toBe(true);
    expect(done.manual).toBe(0);
  });

  it("lets a direct log complete the parent while parts are open", () => {
    const item = task({
      createdOn: "2026-11-02",
      schedule: { kind: "daily" },
      subtasks: [{ id: 2, name: "Chapter", timesPerDay: 2 }],
    });
    const score = scoreDay(item, [log("2026-11-02")], "2026-11-02");
    expect(score.met).toBe(true);
    expect(score.subtasks[0].met).toBe(false);
    expect(score.ratio).toBe(1);
  });

  it("averages uneven part progress", () => {
    const item = task({
      createdOn: "2026-11-02",
      schedule: { kind: "daily" },
      subtasks: [
        { id: 2, name: "Sets", timesPerDay: 2 },
        { id: 3, name: "Stretch", timesPerDay: 1 },
      ],
    });
    const score = scoreDay(
      item,
      [log("2026-11-02", { subtaskId: 2, count: 1 }), log("2026-11-02", { subtaskId: 3 })],
      "2026-11-02"
    );
    expect(score.met).toBe(false);
    expect(score.ratio).toBeCloseTo(0.75);
  });

  it("requires the daily count when there are no parts", () => {
    const item = task({
      createdOn: "2026-11-02",
      schedule: { kind: "daily" },
      timesPerDay: 3,
    });
    expect(scoreDay(item, [log("2026-11-02", { count: 2 })], "2026-11-02").met).toBe(false);
    expect(scoreDay(item, [log("2026-11-02", { count: 3 })], "2026-11-02").met).toBe(true);
  });
});

describe("daily streaks", () => {
  const item = task({ createdOn: "2026-11-01", schedule: { kind: "daily" } });

  it("counts finished days and leaves today open", () => {
    const streak = evaluateStreak(
      item,
      [log("2026-11-01"), log("2026-11-02")],
      "2026-11-03"
    );
    expect(streak).toMatchObject({ status: "active", current: 2, unit: "day" });
  });

  it("includes today once it is logged", () => {
    const streak = evaluateStreak(
      item,
      [log("2026-11-01"), log("2026-11-02"), log("2026-11-03")],
      "2026-11-03"
    );
    expect(streak).toMatchObject({ status: "active", current: 3 });
  });

  it("stays new on the day a task is created", () => {
    const streak = evaluateStreak(
      task({ createdOn: "2026-11-07", schedule: { kind: "daily" } }),
      [],
      "2026-11-07"
    );
    expect(streak).toMatchObject({ status: "new", current: 0 });
    expect(streakCopy(streak).headline).toBe("No streak yet");
  });

  it("names a broken streak instead of showing zero", () => {
    const streak = evaluateStreak(
      item,
      [log("2026-11-01"), log("2026-11-02"), log("2026-11-03"), log("2026-11-05")],
      "2026-11-06"
    );
    expect(streak).toMatchObject({
      status: "broken",
      current: 0,
      previous: 3,
      brokenOn: "2026-11-04",
    });
    const copy = streakCopy(streak);
    expect(copy.headline).toBe("Streak broken");
    expect(copy.detail).toContain("Last streak was 3 days");
    expect(copy.detail).toContain("Missed");
    expect(copy.headline).not.toBe("0");
  });

  it("keeps the break until the anchor moves, even if later days are logged", () => {
    const broken = evaluateStreak(
      item,
      [log("2026-11-01"), log("2026-11-03")],
      "2026-11-04"
    );
    expect(broken.status).toBe("broken");
    expect(broken.previous).toBe(1);
    expect(broken.brokenOn).toBe("2026-11-02");

    const restarted = evaluateStreak(
      { ...item, streakAnchor: "2026-11-04" },
      [log("2026-11-01"), log("2026-11-03"), log("2026-11-04")],
      "2026-11-04"
    );
    expect(restarted).toMatchObject({ status: "active", current: 1, brokenOn: null });
  });

  it("ignores days that are not on the weekday schedule", () => {
    const weekdays = task({
      createdOn: "2026-11-02",
      schedule: { kind: "weekdays", weekdays: [1, 3, 5] },
    });
    const streak = evaluateStreak(
      weekdays,
      [log("2026-11-02"), log("2026-11-04"), log("2026-11-06")],
      "2026-11-07"
    );
    expect(streak).toMatchObject({ status: "active", current: 3 });
    expect(dotKind(weekdays, scoreDay(weekdays, [], "2026-11-03"), "2026-11-07")).toBe("off");
  });

  it("breaks on a missed weekday and not on the days around it", () => {
    const weekdays = task({
      createdOn: "2026-11-02",
      schedule: { kind: "weekdays", weekdays: [1, 3, 5] },
    });
    const streak = evaluateStreak(
      weekdays,
      [log("2026-11-02"), log("2026-11-04")],
      "2026-11-07"
    );
    expect(streak).toMatchObject({
      status: "broken",
      previous: 2,
      brokenOn: "2026-11-06",
    });
    expect(dotKind(weekdays, scoreDay(weekdays, [], "2026-11-06"), "2026-11-07")).toBe("missed");
  });
});

describe("days per week", () => {
  it("counts a week once the quota is met", () => {
    const item = task({
      createdOn: "2026-11-02",
      schedule: { kind: "nPerWeek", daysPerWeek: 2 },
    });
    const streak = evaluateStreak(
      item,
      [log("2026-11-02"), log("2026-11-03")],
      "2026-11-06"
    );
    expect(streak).toMatchObject({ status: "active", unit: "week", current: 1 });
    expect(weekLine(currentWeek(item, [log("2026-11-02"), log("2026-11-03")], "2026-11-06")!)).toBe(
      "2 of 2 days this week"
    );
  });

  it("stays open while enough days remain", () => {
    const item = task({
      createdOn: "2026-11-02",
      schedule: { kind: "nPerWeek", daysPerWeek: 3 },
    });
    const streak = evaluateStreak(item, [], "2026-11-06");
    expect(streak.status).toBe("new");
    expect(currentWeek(item, [], "2026-11-06")?.state).toBe("open");
  });

  it("breaks as soon as the week can no longer be saved", () => {
    const item = task({
      createdOn: "2026-11-02",
      schedule: { kind: "nPerWeek", daysPerWeek: 3 },
    });
    const streak = evaluateStreak(item, [], "2026-11-07");
    expect(streak).toMatchObject({
      status: "broken",
      unit: "week",
      previous: 0,
      brokenOn: "2026-11-02",
    });
    const copy = streakCopy(streak);
    expect(copy.headline).toBe("Streak broken");
    expect(copy.detail).toContain("week of Nov 2");
  });

  it("does not judge a partial first week that cannot fit the quota", () => {
    const item = task({
      createdOn: "2026-11-07",
      schedule: { kind: "nPerWeek", daysPerWeek: 3 },
    });
    const streak = evaluateStreak(item, [], "2026-11-07");
    expect(streak.status).toBe("new");
    expect(currentWeek(item, [], "2026-11-07")?.state).toBe("ignored");
  });

  it("carries a successful week into the next open week", () => {
    const item = task({
      createdOn: "2026-11-02",
      schedule: { kind: "nPerWeek", daysPerWeek: 2 },
    });
    const streak = evaluateStreak(
      item,
      [log("2026-11-02"), log("2026-11-03")],
      "2026-11-10"
    );
    expect(streak).toMatchObject({ status: "active", current: 1 });
  });

  it("keeps a missed week broken after a later week succeeds", () => {
    const item = task({
      createdOn: "2026-11-02",
      schedule: { kind: "nPerWeek", daysPerWeek: 2 },
    });
    const streak = evaluateStreak(
      item,
      [log("2026-11-16"), log("2026-11-17")],
      "2026-11-18"
    );
    expect(streak.status).toBe("broken");
    expect(streak.previous).toBe(0);
    expect(streak.brokenOn).toBe("2026-11-02");
  });
});

describe("cleanSchedule", () => {
  it("falls back to every day", () => {
    expect(cleanSchedule(null)).toEqual({ kind: "daily" });
    expect(cleanSchedule({ kind: "weekdays", weekdays: [] })).toEqual({
      kind: "weekdays",
      weekdays: [1, 2, 3, 4, 5],
    });
    expect(cleanSchedule({ kind: "nPerWeek", daysPerWeek: 9 })).toEqual({
      kind: "nPerWeek",
      daysPerWeek: 7,
    });
  });
});

function logsFor(taskId: number, dates: string[]): CompletionLog[] {
  return dates.map((date) => log(date, { taskId }));
}

describe("successSummary", () => {
  it("mixes daily and weekday tasks and leaves an unmet today out", () => {
    const daily = task({ id: 1, createdOn: "2026-11-02", schedule: { kind: "daily" } });
    const weekdays = task({
      id: 2,
      name: "Lift",
      createdOn: "2026-11-02",
      schedule: { kind: "weekdays", weekdays: [1, 3, 5] },
    });
    const logs = [
      ...logsFor(1, ["2026-11-02", "2026-11-03", "2026-11-04"]),
      ...logsFor(2, ["2026-11-02", "2026-11-04"]),
    ];
    expect(successSummary([daily, weekdays], logs, "2026-11-06")).toEqual({
      completed: 5,
      due: 6,
      percent: 83,
    });
  });

  it("counts today once it is met", () => {
    const daily = task({ createdOn: "2026-11-06", schedule: { kind: "daily" } });
    expect(successSummary([daily], [], "2026-11-06")).toEqual({
      completed: 0,
      due: 0,
      percent: null,
    });
    expect(successSummary([daily], [log("2026-11-06")], "2026-11-06")).toEqual({
      completed: 1,
      due: 1,
      percent: 100,
    });
  });

  it("credits an open n-per-week week without charging the days still left", () => {
    const item = task({
      createdOn: "2026-11-02",
      schedule: { kind: "nPerWeek", daysPerWeek: 3 },
    });
    expect(successSummary([item], [log("2026-11-02")], "2026-11-06")).toEqual({
      completed: 1,
      due: 1,
      percent: 100,
    });
  });

  it("scores a closed n-per-week week as met days out of the quota", () => {
    const item = task({
      createdOn: "2026-11-02",
      schedule: { kind: "nPerWeek", daysPerWeek: 3 },
    });
    expect(successSummary([item], [log("2026-11-02")], "2026-11-09")).toEqual({
      completed: 1,
      due: 3,
      percent: 33,
    });
  });

  it("ignores a partial first week that cannot fit the quota", () => {
    const item = task({
      createdOn: "2026-11-07",
      schedule: { kind: "nPerWeek", daysPerWeek: 3 },
    });
    expect(successSummary([item], [], "2026-11-07")).toEqual({
      completed: 0,
      due: 0,
      percent: null,
    });
  });

  it("shows a real zero when a closed week was missed entirely", () => {
    const item = task({
      createdOn: "2026-11-02",
      schedule: { kind: "nPerWeek", daysPerWeek: 2 },
    });
    expect(successSummary([item], [], "2026-11-09").percent).toBe(0);
  });
});

describe("streakSummary", () => {
  it("skips days with no hard obligation and does not break on an open today", () => {
    const weekdays = task({
      createdOn: "2026-11-02",
      schedule: { kind: "weekdays", weekdays: [1, 3, 5] },
    });
    const summary = streakSummary(
      [weekdays],
      [log("2026-11-02"), log("2026-11-04")],
      "2026-11-06"
    );
    expect(summary).toEqual({ days: 2, activeTasks: 1, totalTasks: 1 });
  });

  it("skips today when one task is still open and counts the days before it", () => {
    const first = task({ id: 1, createdOn: "2026-11-02", schedule: { kind: "daily" } });
    const second = task({ id: 2, name: "Walk", createdOn: "2026-11-02", schedule: { kind: "daily" } });
    const logs = [
      ...logsFor(1, ["2026-11-02", "2026-11-03", "2026-11-04"]),
      ...logsFor(2, ["2026-11-02", "2026-11-03"]),
    ];
    expect(streakSummary([first, second], logs, "2026-11-04").days).toBe(2);
  });

  it("does not let an unlogged n-per-week day break the daily streak", () => {
    const daily = task({ id: 1, createdOn: "2026-11-02", schedule: { kind: "daily" } });
    const flexible = task({
      id: 2,
      name: "Read",
      createdOn: "2026-11-02",
      schedule: { kind: "nPerWeek", daysPerWeek: 2 },
    });
    const logs = logsFor(1, ["2026-11-02", "2026-11-03", "2026-11-04", "2026-11-05", "2026-11-06"]);
    const summary = streakSummary([daily, flexible], logs, "2026-11-06");
    expect(summary.days).toBe(5);
    expect(summary.activeTasks).toBe(1);
    expect(summary.totalTasks).toBe(2);
  });

  it("is zero while any task streak is broken, then counts the run after a restart", () => {
    const daily = task({ createdOn: "2026-11-02", schedule: { kind: "daily" } });
    const logs = [log("2026-11-02"), log("2026-11-03"), log("2026-11-05"), log("2026-11-06")];
    expect(streakSummary([daily], logs, "2026-11-06").days).toBe(0);
    const restarted = { ...daily, streakAnchor: "2026-11-05" };
    expect(streakSummary([restarted], logs, "2026-11-06").days).toBe(2);
  });

  it("is zero when an n-per-week task has already broken", () => {
    const daily = task({ id: 1, createdOn: "2026-11-02", schedule: { kind: "daily" } });
    const flexible = task({
      id: 2,
      name: "Read",
      createdOn: "2026-11-02",
      schedule: { kind: "nPerWeek", daysPerWeek: 6 },
    });
    const logs = logsFor(1, [
      "2026-11-02",
      "2026-11-03",
      "2026-11-04",
      "2026-11-05",
      "2026-11-06",
      "2026-11-07",
    ]);
    expect(streakSummary([daily, flexible], logs, "2026-11-07").days).toBe(0);
  });
});
