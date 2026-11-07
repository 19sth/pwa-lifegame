import { Middleware, configureStore } from "@reduxjs/toolkit";
import { STORAGE_KEY } from "../utils/constants";
import logsReducer, { LogsState, sanitizeLogsState } from "./sliceLogs";
import pageReducer from "./slicePage";
import tasksReducer, { TasksState, sanitizeTasksState } from "./sliceTasks";

const localStorageMiddleware: Middleware = (storeApi) => (next) => (action) => {
  const result = next(action);
  const state = storeApi.getState() as { tasks: TasksState; logs: LogsState };
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ tasks: state.tasks, logs: state.logs })
  );
  return result;
};

const reHydrateStore = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return {
      tasks: sanitizeTasksState(parsed.tasks),
      logs: sanitizeLogsState(parsed.logs),
    };
  } catch {
    return undefined;
  }
};

export const store = configureStore({
  reducer: {
    page: pageReducer,
    tasks: tasksReducer,
    logs: logsReducer,
  },
  preloadedState: reHydrateStore(),
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(localStorageMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
