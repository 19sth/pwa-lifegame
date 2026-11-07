import { Button, TextField } from "@mui/material";
import { FormEvent, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import TaskCard from "../components/taskcard";
import MuTakoz from "../components/mutakoz";
import { updatePageState } from "../redux/slicePage";
import { addTask } from "../redux/sliceTasks";
import { RootState } from "../redux/store";
import { BASE_PATH } from "../utils/constants";
import {
  Task,
  evaluateStreak,
  isScheduledToday,
  scoreDay,
} from "../utils/schedule";
import useTodayKey from "../utils/useTodayKey";

function bucket(task: Task, logs: RootState["logs"]["logs"], todayKey: string) {
  const streak = evaluateStreak(task, logs, todayKey);
  if (streak.status === "broken") return 0;
  const today = isScheduledToday(task, todayKey);
  const score = scoreDay(task, logs, todayKey);
  if (today && !score.met) return 1;
  if (today && score.met) return 2;
  return 3;
}

export default function Main() {
  const dispatch = useDispatch();
  const tasks = useSelector((state: RootState) => state.tasks.tasks);
  const logs = useSelector((state: RootState) => state.logs.logs);
  const todayKey = useTodayKey();
  const [name, setName] = useState("");

  useEffect(() => {
    dispatch(
      updatePageState({
        navItems: [{ icon: "ImportExport", link: `${BASE_PATH}/importexport` }],
        title: "",
      })
    );
  }, [dispatch]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    dispatch(addTask({ name }));
    setName("");
  };

  const ordered = [...tasks].sort((a, b) => {
    const rank = bucket(a, logs, todayKey) - bucket(b, logs, todayKey);
    if (rank !== 0) return rank;
    return a.id - b.id;
  });
  const broken = ordered.filter((task) => bucket(task, logs, todayKey) === 0);
  const todayTasks = ordered.filter((task) => {
    const rank = bucket(task, logs, todayKey);
    return rank === 1 || rank === 2;
  });
  const other = ordered.filter((task) => bucket(task, logs, todayKey) === 3);
  const scheduledCount = tasks.filter((task) => isScheduledToday(task, todayKey)).length;

  return (
    <div>
      <form onSubmit={submit} className="flex gap-2 items-start">
        <TextField
          className="grow"
          size="small"
          label="New task"
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoComplete="off"
        />
        <Button type="submit" variant="contained" size="large" disabled={!name.trim()}>
          Add
        </Button>
      </form>
      <div className="text-xs text-gray-500 mt-2">Every day, once a day. Change it anytime.</div>

      {tasks.length === 0 ? (
        <div className="text-center text-lg mt-10">
          There is no task.
          <br />
          Type a name and add it.
        </div>
      ) : (
        <div className="mt-6">
          {broken.length > 0 ? (
            <section className="mb-4">
              <div className="font-bold text-lg mb-2">Streak broken</div>
              {broken.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  logs={logs}
                  todayKey={todayKey}
                  allowLog={isScheduledToday(task, todayKey)}
                />
              ))}
            </section>
          ) : null}

          {todayTasks.length > 0 || scheduledCount === 0 ? (
            <section className="mb-4">
              <div className="font-bold text-lg mb-2">Today</div>
              {todayTasks.length === 0 ? (
                <div className="text-sm text-gray-500 mb-3">Nothing scheduled today.</div>
              ) : (
                todayTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    logs={logs}
                    todayKey={todayKey}
                    allowLog
                  />
                ))
              )}
            </section>
          ) : null}

          {other.length > 0 ? (
            <section>
              <div className="font-bold text-lg mb-2">Other days</div>
              {other.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  logs={logs}
                  todayKey={todayKey}
                  allowLog={false}
                />
              ))}
            </section>
          ) : null}
        </div>
      )}
      <MuTakoz />
    </div>
  );
}
