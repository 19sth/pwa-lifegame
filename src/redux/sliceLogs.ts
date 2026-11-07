import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { INotifyingState } from "../types";
import { CompletionLog } from "../utils/schedule";

export interface LogsState extends INotifyingState {
  logs: CompletionLog[];
}

const initialState: LogsState = {
  logs: [],
  notificationMessage: "",
  notificationIsoDt: new Date(0).toISOString(),
};

export const logsSlice = createSlice({
  name: "logs",
  initialState,
  reducers: {
    setCompletion: (
      state,
      action: PayloadAction<{
        taskId: number;
        subtaskId: number | null;
        date: string;
        count: number;
      }>
    ) => {
      const { taskId, subtaskId, date } = action.payload;
      const count = Math.max(0, Math.floor(action.payload.count));
      const index = state.logs.findIndex(
        (log) => log.taskId === taskId && log.subtaskId === subtaskId && log.date === date
      );
      if (count === 0) {
        if (index >= 0) state.logs.splice(index, 1);
        return;
      }
      if (index < 0) {
        state.logs.push({ taskId, subtaskId, date, count });
        return;
      }
      state.logs[index].count = count;
    },
    removeLogsForTask: (state, action: PayloadAction<number>) => {
      state.logs = state.logs.filter((log) => log.taskId !== action.payload);
    },
  },
});

export function sanitizeLogsState(raw: unknown): LogsState {
  const value = raw && typeof raw === "object" ? (raw as { logs?: unknown }) : { logs: [] };
  const logs: CompletionLog[] = [];
  const list = Array.isArray(value.logs) ? value.logs : [];
  for (const item of list) {
    if (!item || typeof item !== "object") continue;
    const log = item as Record<string, unknown>;
    if (typeof log.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(log.date)) continue;
    const taskId = Number(log.taskId);
    if (!taskId) continue;
    const count = Math.max(0, Math.floor(Number(log.count) || 0));
    if (!count) continue;
    logs.push({
      taskId,
      subtaskId:
        log.subtaskId === null || log.subtaskId === undefined || log.subtaskId === ""
          ? null
          : Number(log.subtaskId),
      date: log.date,
      count,
    });
  }
  return {
    logs,
    notificationMessage: "",
    notificationIsoDt: new Date(0).toISOString(),
  };
}

export const { setCompletion, removeLogsForTask } = logsSlice.actions;

export default logsSlice.reducer;
