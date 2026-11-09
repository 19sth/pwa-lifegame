import { format } from "date-fns";
import { useEffect, useRef } from "react";
import {
  DayScore,
  Task,
  dotKind,
  fromDayKey,
} from "../utils/schedule";

function cardClass(kind: string) {
  if (kind === "missed") return "bg-red-50";
  if (kind === "frozen") return "bg-sky-100";
  if (kind === "done") return "bg-yellow-100";
  if (kind === "today") return "bg-white border border-black";
  return "bg-gray-100";
}

function cardLabel(kind: string) {
  if (kind === "missed") return "Missed";
  if (kind === "frozen") return "Frozen";
  if (kind === "done") return "Done";
  if (kind === "today") return "Today";
  if (kind === "off") return "Off";
  if (kind === "optional") return "Open";
  return "";
}

export default function HistoryStrip({
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
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (node) node.scrollLeft = node.scrollWidth;
  }, [task.id, todayKey, scores.length]);

  return (
    <div>
      <div className="w-full overflow-x-auto border-t-2 border-b-2 py-3" ref={ref}>
        <div className="flex no-wrap">
          {scores.map((score) => {
            const kind = dotKind(task, score, todayKey, frozenDates);
            if (kind === "none") return null;
            const date = fromDayKey(score.date);
            return (
              <div
                key={score.date}
                className={`mx-1 p-2 rounded-lg shadow-sm text-center ${cardClass(kind)}`}
                style={{ minWidth: "4.5rem" }}
              >
                <div className="text-sm font-bold">{format(date, "EEE")}</div>
                <div className="text-xs">{format(date, "MMM d")}</div>
                <div
                  className={`text-xs mt-3 font-semibold ${
                    kind === "missed" ? "text-red-800" : kind === "frozen" ? "text-sky-800" : ""
                  }`}
                >
                  {cardLabel(kind)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="text-xs text-gray-500 mt-2">
        {task.schedule.kind === "nPerWeek"
          ? "Days you log count toward the week. A failed week spends a freeze if you have one. With none left, the streak stays broken until you start again."
          : "Blue days used a streak freeze. With no freezes left, a miss stays broken until you start again."}
      </div>
    </div>
  );
}
