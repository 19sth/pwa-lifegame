import { DayScore, DotKind, Task, dotKind, dotLabel } from "../utils/schedule";
import { FREEZE_DOT } from "./freezemark";

const DOT_STYLE: Record<DotKind, { background: string; border: string }> = {
  none: { background: "transparent", border: "1px solid transparent" },
  off: { background: "#e5e7eb", border: "1px solid #e5e7eb" },
  optional: { background: "#e5e7eb", border: "1px solid #e5e7eb" },
  done: { background: "#fde047", border: "1px solid #ca8a04" },
  today: { background: "#fff", border: "2px solid #333" },
  missed: { background: "#d32f2f", border: "1px solid #d32f2f" },
  frozen: FREEZE_DOT,
};

export default function DayDots({
  task,
  scores,
  todayKey,
  frozenDates = [],
}: {
  task: Task;
  scores: DayScore[];
  todayKey: string;
  frozenDates?: readonly string[];
}) {
  return (
    <div className="flex gap-1 mt-2" aria-label="Recent days">
      {scores.map((score) => {
        const kind = dotKind(task, score, todayKey, frozenDates);
        const style = DOT_STYLE[kind];
        const label = dotLabel(task, score, todayKey, frozenDates);
        return (
          <span
            key={score.date}
            title={label}
            aria-label={label}
            className="inline-block"
            style={{
              width: 12,
              height: 12,
              background: style.background,
              border: style.border,
              borderRadius: kind === "frozen" ? 2 : 999,
            }}
          />
        );
      })}
    </div>
  );
}
