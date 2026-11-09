import { useDispatch } from "react-redux";
import { setCompletion } from "../redux/sliceLogs";
import {
  CompletionLog,
  Task,
  canBackfillDate,
  scoreDay,
  yesterdayBackfill,
  yesterdayKey,
} from "../utils/schedule";
import LogControl from "./logcontrol";

export default function YesterdayBackfill({
  task,
  logs,
  todayKey,
}: {
  task: Task;
  logs: CompletionLog[];
  todayKey: string;
}) {
  const dispatch = useDispatch();
  const date = yesterdayKey(todayKey);
  if (!canBackfillDate(task, date, todayKey)) return null;
  const score = scoreDay(task, logs, date);

  return (
    <div
      className="mt-3 flex items-center justify-between gap-2 rounded-lg border border-gray-200 px-2 py-2"
      data-testid="yesterday-backfill"
    >
      <div>
        <div className="text-sm font-semibold">Yesterday</div>
        <div className="text-xs text-gray-500">
          {score.met ? "Filled in" : "Did it yesterday? Fill it in."}
        </div>
      </div>
      <LogControl
        count={score.manual}
        target={score.target}
        label={`${task.name} yesterday`}
        onChange={(count) => {
          const action = yesterdayBackfill(task, todayKey, date, count);
          if (action) dispatch(setCompletion(action));
        }}
      />
    </div>
  );
}
