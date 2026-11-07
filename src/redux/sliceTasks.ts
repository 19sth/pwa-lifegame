import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { INotifyingState } from "../types";
import { COLORS } from "../utils/constants";
import {
  Schedule,
  Subtask,
  Task,
  clamp,
  cleanSchedule,
  nextTaskId,
  sanitizeTask,
  toDayKey,
} from "../utils/schedule";

export interface TasksState extends INotifyingState {
  tasks: Task[];
}

const initialState: TasksState = {
  tasks: [],
  notificationMessage: "",
  notificationIsoDt: new Date(0).toISOString(),
};

function capitalize(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return "";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function cleanSubtasks(tasks: Task[], subtasks: Subtask[]): Subtask[] {
  let next = nextTaskId(tasks);
  return subtasks
    .filter((subtask) => subtask.name.trim())
    .map((subtask) => {
      const id = subtask.id > 0 ? subtask.id : next++;
      return {
        id,
        name: subtask.name.trim(),
        timesPerDay: clamp(subtask.timesPerDay || 1, 1, 12),
      };
    });
}

export const tasksSlice = createSlice({
  name: "tasks",
  initialState,
  reducers: {
    addTask: (state, action: PayloadAction<{ name: string; color?: string }>) => {
      const name = capitalize(action.payload.name);
      if (!name) return;
      const color =
        action.payload.color || COLORS[state.tasks.length % COLORS.length].value;
      state.tasks.push({
        id: nextTaskId(state.tasks),
        name,
        color,
        createdOn: toDayKey(new Date()),
        schedule: { kind: "daily" },
        timesPerDay: 1,
        subtasks: [],
        streakAnchor: null,
      });
      state.notificationMessage = "Task added.";
      state.notificationIsoDt = new Date().toISOString();
    },
    updateTask: (
      state,
      action: PayloadAction<{
        id: number;
        name: string;
        color: string;
        schedule: Schedule;
        timesPerDay: number;
        subtasks: Subtask[];
      }>
    ) => {
      const index = state.tasks.findIndex((task) => task.id === action.payload.id);
      if (index < 0) return;
      const existing = state.tasks[index];
      const name = capitalize(action.payload.name) || existing.name;
      state.tasks[index] = {
        ...existing,
        name,
        color: action.payload.color || existing.color,
        schedule: cleanSchedule(action.payload.schedule),
        timesPerDay: clamp(action.payload.timesPerDay || 1, 1, 12),
        subtasks: cleanSubtasks(state.tasks, action.payload.subtasks),
      };
      state.notificationMessage = "Task saved.";
      state.notificationIsoDt = new Date().toISOString();
    },
    removeTask: (state, action: PayloadAction<number>) => {
      const index = state.tasks.findIndex((task) => task.id === action.payload);
      if (index < 0) {
        state.notificationMessage = "No task found.";
        state.notificationIsoDt = new Date().toISOString();
        return;
      }
      state.tasks.splice(index, 1);
      state.notificationMessage = "Task removed.";
      state.notificationIsoDt = new Date().toISOString();
    },
    startAgain: (state, action: PayloadAction<{ id: number; date: string }>) => {
      const task = state.tasks.find((item) => item.id === action.payload.id);
      if (!task) return;
      task.streakAnchor = action.payload.date;
      state.notificationMessage = "Streak started again.";
      state.notificationIsoDt = new Date().toISOString();
    },
  },
});

export function sanitizeTasksState(raw: unknown): TasksState {
  const value =
    raw && typeof raw === "object" ? (raw as { tasks?: unknown }) : { tasks: [] };
  const tasks = Array.isArray(value.tasks)
    ? value.tasks
        .map((item) => sanitizeTask(item))
        .filter((item): item is Task => item !== null)
    : [];
  return {
    tasks,
    notificationMessage: "",
    notificationIsoDt: new Date(0).toISOString(),
  };
}

export const { addTask, updateTask, removeTask, startAgain } = tasksSlice.actions;

export default tasksSlice.reducer;
