import { LinearProgress } from "@mui/material";
import { format } from "date-fns";
import { useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import { setCompletion } from "../redux/sliceLogs";
import { startAgain } from "../redux/sliceTasks";
import { BASE_PATH } from "../utils/constants";
import {
  CompletionLog,
  Task,
  currentWeek,
  evaluateStreak,
  fromDayKey,
  metPartCount,
  recentScores,
  scheduleLabel,
  scoreDay,
  timesLabel,
  weekLine,
} from "../utils/schedule";
import DayDots from "./daydots";
import LogControl from "./logcontrol";
import StreakBlock from "./streakblock";
import YesterdayBackfill from "./yesterdaybackfill";

export default function TaskCard({
  task,
  logs,
  todayKey,
  allowLog,
}: {
  task: Task;
  logs: CompletionLog[];
  todayKey: string;
  allowLog: boolean;
}) {
  const dispatch = useDispatch();
  const score = scoreDay(task, logs, todayKey);
  const streak = evaluateStreak(task, logs, todayKey);
  const week = currentWeek(task, logs, todayKey);
  const partsMet = metPartCount(score);
  const broken = streak.status === "broken";

  const setCount = (subtaskId: number | null, count: number) => {
    dispatch(setCompletion({ taskId: task.id, subtaskId, date: todayKey, count }));
  };

  return (
    <div
      className="rounded-lg border border-gray-200 bg-white p-3 mb-3"
      style={{ borderLeft: broken ? "4px solid #d32f2f" : `4px solid ${task.color}` }}
      data-testid={`task-${task.id}`}
    >
      <div className="flex items-start justify-between gap-2">
        <Link to={`${BASE_PATH}/task/${task.id}`} className="grow min-w-0">
          <div className="font-semibold text-lg break-words">{task.name}</div>
          <div className="text-sm text-gray-600">
            {scheduleLabel(task.schedule)} · {timesLabel(task.timesPerDay)}
          </div>
        </Link>
        {allowLog ? (
          <LogControl
            count={score.manual}
            target={score.target}
            label={task.name}
            onChange={(count) => setCount(null, count)}
          />
        ) : null}
      </div>

      {week ? <div className="text-sm text-gray-700 mt-1">{weekLine(week)}</div> : null}

      <LinearProgress
        variant="determinate"
        value={Math.round(score.ratio * 100)}
        sx={{
          mt: 1.25,
          height: 8,
          borderRadius: 99,
          backgroundColor: "#f3f4f6",
          "& .MuiLinearProgress-bar": {
            backgroundColor: score.met ? "#333" : "#fde047",
          },
        }}
      />

      {score.met ? <div className="text-sm font-semibold mt-2">Done today</div> : null}
      {!score.met && task.subtasks.length > 0 && allowLog ? (
        <div className="text-sm mt-2">
          {partsMet} of {task.subtasks.length} parts
        </div>
      ) : null}
      {!allowLog ? <div className="text-sm text-gray-500 mt-2">Not scheduled today.</div> : null}

      <div className="mt-3">
        <StreakBlock
          streak={streak}
          onStartAgain={
            broken
              ? () => dispatch(startAgain({ id: task.id, date: todayKey }))
              : undefined
          }
        />
      </div>

      {task.streakAnchor && task.streakAnchor > task.createdOn && !broken ? (
        <div className="text-xs text-gray-500 mt-1">
          Counting from {format(fromDayKey(task.streakAnchor), "MMM d")}.
        </div>
      ) : null}

      <DayDots
        task={task}
        scores={recentScores(task, logs, todayKey, 14)}
        todayKey={todayKey}
        frozenDates={streak.unit === "day" ? streak.frozenDates : []}
      />
      <YesterdayBackfill task={task} logs={logs} todayKey={todayKey} />

      {allowLog && task.subtasks.length > 0 ? (
        <div className="mt-3 border-t border-gray-100 pt-2">
          {score.subtasks.map((subtask) => (
            <div key={subtask.id} className="flex items-center justify-between gap-2 py-1">
              <span className={`text-sm break-words ${subtask.met ? "line-through text-gray-500" : ""}`}>
                {subtask.name}
              </span>
              <LogControl
                count={subtask.count}
                target={subtask.target}
                label={subtask.name}
                onChange={(count) => setCount(subtask.id, count)}
              />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
