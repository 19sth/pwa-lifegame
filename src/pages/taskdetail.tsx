import CircleIcon from "@mui/icons-material/Circle";
import Delete from "@mui/icons-material/Delete";
import {
  Button,
  ButtonGroup,
  Container,
  IconButton,
  MenuItem,
  Modal,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useParams } from "react-router-dom";
import HistoryStrip from "../components/historystrip";
import LogControl from "../components/logcontrol";
import MuTakoz from "../components/mutakoz";
import StreakBlock from "../components/streakblock";
import { setCompletion, removeLogsForTask } from "../redux/sliceLogs";
import { updatePageState } from "../redux/slicePage";
import { removeTask, startAgain, updateTask } from "../redux/sliceTasks";
import { RootState } from "../redux/store";
import { BASE_PATH, COLORS, DAYS_MON_FIRST, DAYS_PER_WEEK, TIMES_PER_DAY } from "../utils/constants";
import {
  Schedule,
  Subtask,
  currentWeek,
  evaluateStreak,
  isScheduledToday,
  recentScores,
  scheduleLabel,
  scoreDay,
  timesLabel,
  weekLine,
} from "../utils/schedule";
import useTodayKey from "../utils/useTodayKey";

export default function TaskDetail() {
  const { id } = useParams();
  const taskId = parseInt(id || "", 10);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const tasks = useSelector((state: RootState) => state.tasks.tasks);
  const logs = useSelector((state: RootState) => state.logs.logs);
  const task = tasks.find((item) => item.id === taskId);
  const today = useTodayKey();

  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0].value);
  const [schedule, setSchedule] = useState<Schedule>({ kind: "daily" });
  const [timesPerDay, setTimesPerDay] = useState(1);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [partName, setPartName] = useState("");
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    dispatch(updatePageState({ navItems: [], title: "edit" }));
  }, [dispatch]);

  useEffect(() => {
    if (!task) return;
    setName(task.name);
    setColor(task.color);
    setSchedule(task.schedule);
    setTimesPerDay(task.timesPerDay);
    setSubtasks(task.subtasks);
  }, [task]);

  if (!task) {
    return (
      <div className="text-center">
        There is no task.
        <div className="mt-3">
          <Link className="font-bold underline" to={`${BASE_PATH}/`}>
            Back
          </Link>
        </div>
      </div>
    );
  }

  const score = scoreDay(task, logs, today);
  const streak = evaluateStreak(task, logs, today);
  const week = currentWeek(task, logs, today);
  const allowLog = isScheduledToday(task, today);
  const history = recentScores(task, logs, today, 28);

  const setKind = (kind: Schedule["kind"]) => {
    setSchedule((prev) => {
      if (kind === "daily") return { kind: "daily" };
      if (kind === "weekdays") {
        return {
          kind: "weekdays",
          weekdays: prev.kind === "weekdays" ? prev.weekdays : [1, 2, 3, 4, 5],
        };
      }
      return {
        kind: "nPerWeek",
        daysPerWeek: prev.kind === "nPerWeek" ? prev.daysPerWeek : 3,
      };
    });
  };

  const toggleWeekday = (day: number) => {
    setSchedule((prev) => {
      if (prev.kind !== "weekdays") return prev;
      const has = prev.weekdays.includes(day);
      const next = has ? prev.weekdays.filter((value) => value !== day) : [...prev.weekdays, day];
      if (next.length === 0) return prev;
      return { kind: "weekdays", weekdays: next };
    });
  };

  const addPart = () => {
    const trimmed = partName.trim();
    if (!trimmed) return;
    setSubtasks((current) => [...current, { id: 0, name: trimmed, timesPerDay: 1 }]);
    setPartName("");
  };

  return (
    <div>
      <Link to={`${BASE_PATH}/`} className="text-sm underline">
        Today
      </Link>

      <MuTakoz height="1rem" />
      <HistoryStrip task={task} scores={history} todayKey={today} />

      <div className="text-3xl font-semibold my-5 w-full break-words">
        <span style={{ borderBottom: `5px solid ${task.color}` }}>{task.name}</span>
      </div>

      <div className="text-sm text-gray-600 mb-3">
        {scheduleLabel(task.schedule)} · {timesLabel(task.timesPerDay)}
      </div>
      {week ? <div className="text-sm mb-3">{weekLine(week)}</div> : null}

      <StreakBlock
        streak={streak}
        onStartAgain={
          streak.status === "broken"
            ? () => dispatch(startAgain({ id: task.id, date: today }))
            : undefined
        }
      />

      <MuTakoz height="1rem" />

      {allowLog ? (
        <div className="rounded-lg border border-gray-200 p-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="font-semibold">Today</div>
              <div className="text-sm text-gray-600">
                {score.met ? "Done today" : "Log the task, or finish its parts."}
              </div>
            </div>
            <LogControl
              count={score.manual}
              target={score.target}
              label={task.name}
              onChange={(count) =>
                dispatch(
                  setCompletion({ taskId: task.id, subtaskId: null, date: today, count })
                )
              }
            />
          </div>
          {score.subtasks.map((subtask) => (
            <div key={subtask.id} className="flex items-center justify-between gap-2 mt-2">
              <span className={`text-sm ${subtask.met ? "line-through text-gray-500" : ""}`}>
                {subtask.name}
              </span>
              <LogControl
                count={subtask.count}
                target={subtask.target}
                label={subtask.name}
                onChange={(count) =>
                  dispatch(
                    setCompletion({
                      taskId: task.id,
                      subtaskId: subtask.id,
                      date: today,
                      count,
                    })
                  )
                }
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-gray-500">Not scheduled today.</div>
      )}

      <MuTakoz />
      <div className="font-bold text-lg mb-3">Edit</div>

      <TextField
        label="Name"
        className="w-full"
        value={name}
        onChange={(event) => setName(event.target.value)}
        autoComplete="off"
      />
      <MuTakoz height="1rem" />

      <div className="text-sm mb-2">Schedule</div>
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["daily", "Every day"],
            ["weekdays", "Weekdays"],
            ["nPerWeek", "Per week"],
          ] as Array<[Schedule["kind"], string]>
        ).map(([kind, label]) => {
          const selected = schedule.kind === kind;
          return (
            <button
              type="button"
              key={kind}
              onClick={() => setKind(kind)}
              className={`px-3 py-2 rounded-full border text-sm ${
                selected
                  ? "bg-yellow-300 border-yellow-300 font-semibold"
                  : "bg-white border-gray-300"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {schedule.kind === "weekdays" ? (
        <div className="flex flex-wrap gap-1 mt-3">
          {DAYS_MON_FIRST.map((day) => {
            const selected = schedule.weekdays.includes(day.value);
            return (
              <button
                type="button"
                key={day.value}
                onClick={() => toggleWeekday(day.value)}
                className={`px-3 py-2 rounded-full border text-sm ${
                  selected
                    ? "bg-yellow-300 border-yellow-300 font-semibold"
                    : "bg-white border-gray-300"
                }`}
              >
                {day.short}
              </button>
            );
          })}
        </div>
      ) : null}

      {schedule.kind === "nPerWeek" ? (
        <TextField
          select
          className="w-full"
          sx={{ mt: 2 }}
          label="Days per week"
          value={schedule.daysPerWeek}
          onChange={(event) =>
            setSchedule({ kind: "nPerWeek", daysPerWeek: Number(event.target.value) })
          }
        >
          {DAYS_PER_WEEK.map((count) => (
            <MenuItem key={count} value={count}>
              {count}
            </MenuItem>
          ))}
        </TextField>
      ) : null}

      <MuTakoz height="1rem" />
      <TextField
        select
        className="w-full"
        label="Times per day"
        value={timesPerDay}
        onChange={(event) => setTimesPerDay(Number(event.target.value))}
      >
        {TIMES_PER_DAY.map((count) => (
          <MenuItem key={count} value={count}>
            {count === 1 ? "Once" : `${count} times`}
          </MenuItem>
        ))}
      </TextField>

      <MuTakoz height="1rem" />
      <TextField
        select
        className="w-full"
        label="Color"
        value={color}
        onChange={(event) => setColor(event.target.value)}
      >
        {COLORS.map((item) => (
          <MenuItem key={item.value} value={item.value}>
            <CircleIcon sx={{ color: item.value }} className="mr-3" />
            <span>{item.label}</span>
          </MenuItem>
        ))}
      </TextField>

      <MuTakoz />
      <div className="font-semibold mb-1">Parts</div>
      <div className="text-sm text-gray-600 mb-3">
        Optional. Finishing every part completes the task. You can still log the task itself.
      </div>
      {subtasks.map((subtask, index) => (
        <div key={`${subtask.id}-${index}`} className="mb-3">
          <TextField
            fullWidth
            size="small"
            label="Part"
            value={subtask.name}
            onChange={(event) =>
              setSubtasks((current) =>
                current.map((item, itemIndex) =>
                  itemIndex === index ? { ...item, name: event.target.value } : item
                )
              )
            }
          />
          <div className="flex items-center gap-2 mt-1">
            <TextField
              select
              size="small"
              label="Times"
              value={subtask.timesPerDay}
              onChange={(event) =>
                setSubtasks((current) =>
                  current.map((item, itemIndex) =>
                    itemIndex === index
                      ? { ...item, timesPerDay: Number(event.target.value) }
                      : item
                  )
                )
              }
              sx={{ width: 120 }}
            >
              {TIMES_PER_DAY.map((count) => (
                <MenuItem key={count} value={count}>
                  {count}
                </MenuItem>
              ))}
            </TextField>
            <IconButton
              aria-label={`Remove ${subtask.name || "part"}`}
              onClick={() =>
                setSubtasks((current) => current.filter((_, itemIndex) => itemIndex !== index))
              }
            >
              <Delete />
            </IconButton>
          </div>
        </div>
      ))}
      <div className="flex gap-2">
        <TextField
          className="grow"
          size="small"
          label="New part"
          value={partName}
          onChange={(event) => setPartName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addPart();
            }
          }}
        />
        <Button type="button" onClick={addPart} disabled={!partName.trim()}>
          Add
        </Button>
      </div>

      <MuTakoz />
      <Button
        className="w-full"
        variant="contained"
        size="large"
        onClick={() => {
          dispatch(
            updateTask({
              id: task.id,
              name,
              color,
              schedule,
              timesPerDay,
              subtasks,
            })
          );
        }}
      >
        Save
      </Button>

      <MuTakoz height="1rem" />
      <Button variant="outlined" color="error" onClick={() => setShowDelete(true)}>
        Delete
      </Button>

      <Modal
        open={showDelete}
        onClose={() => setShowDelete(false)}
        className="flex justify-center items-center p-2"
      >
        <Container
          maxWidth="sm"
          className="w-full bg-white rounded px-2 py-5 flex flex-col items-center"
        >
          <Typography>Will you delete this task?</Typography>
          <MuTakoz />
          <ButtonGroup variant="text">
            <Button
              color="error"
              onClick={() => {
                dispatch(removeTask(task.id));
                dispatch(removeLogsForTask(task.id));
                navigate(`${BASE_PATH}/`);
              }}
            >
              Delete
            </Button>
            <Button onClick={() => setShowDelete(false)}>Cancel</Button>
          </ButtonGroup>
        </Container>
      </Modal>
      <MuTakoz />
    </div>
  );
}
