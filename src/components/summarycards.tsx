import { CompletionLog, Task, streakSummary, successSummary } from "../utils/schedule";

export default function SummaryCards({
  tasks,
  logs,
  todayKey,
}: {
  tasks: Task[];
  logs: CompletionLog[];
  todayKey: string;
}) {
  const success = successSummary(tasks, logs, todayKey);
  const streak = streakSummary(tasks, logs, todayKey);
  const successDetail =
    success.due === 0
      ? "No scheduled days yet."
      : `${success.completed} of ${success.due} scheduled days`;
  const streakDetail =
    streak.days === 0 ? "No streak yet" : streak.days === 1 ? "day" : "days";

  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden" data-testid="success-summary">
        <div className="p-3">
          <div className="text-xs text-gray-500">Success</div>
          <div className="text-4xl font-bold leading-none mt-1">
            {success.percent === null ? "—" : `${success.percent}%`}
          </div>
          <div className="text-sm text-gray-600 mt-2">{successDetail}</div>
        </div>
        <div className="h-1 bg-yellow-300" />
      </div>
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden" data-testid="streak-summary">
        <div className="p-3">
          <div className="text-xs text-gray-500">Streak</div>
          <div className="text-4xl font-bold leading-none mt-1">{streak.days}</div>
          <div className="text-sm text-gray-600 mt-2">{streakDetail}</div>
          <div className="text-sm mt-1">
            {streak.activeTasks} of {streak.totalTasks} tasks on a streak
          </div>
        </div>
        <div className="h-1 bg-yellow-300" />
      </div>
    </div>
  );
}
