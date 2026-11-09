import { configureStore } from "@reduxjs/toolkit";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { subDays } from "date-fns";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import logsReducer, { LogsState } from "../redux/sliceLogs";
import pageReducer from "../redux/slicePage";
import tasksReducer, { TasksState } from "../redux/sliceTasks";
import { Task, toDayKey } from "../utils/schedule";
import Main from "./main";

function renderMain(state?: { tasks?: TasksState; logs?: LogsState }) {
  const store = configureStore({
    reducer: {
      page: pageReducer,
      tasks: tasksReducer,
      logs: logsReducer,
    },
    preloadedState: state,
  });
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={["/pwa-lifegame/"]}>
        <Routes>
          <Route path="/pwa-lifegame/" element={<Main />} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
  return store;
}

const epoch = new Date(0).toISOString();

function taskState(tasks: Task[], logs: LogsState["logs"] = []): { tasks: TasksState; logs: LogsState } {
  return {
    tasks: { tasks, notificationMessage: "", notificationIsoDt: epoch },
    logs: { logs, notificationMessage: "", notificationIsoDt: epoch },
  };
}

describe("main screen", () => {
  it("points an empty list at the add page", async () => {
    const store = renderMain();
    expect(screen.queryByLabelText("New task")).not.toBeInTheDocument();
    expect(screen.queryByText(/Type a name and add it/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Every day, once a day/)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Add a task." })).toHaveAttribute(
      "href",
      "/pwa-lifegame/add"
    );
    await waitFor(() => {
      expect(store.getState().page.navItems).toEqual([
        { icon: "ImportExport", link: "/pwa-lifegame/importexport" },
        { icon: "Add", link: "/pwa-lifegame/add" },
      ]);
    });
  });

  it("logs a task and shows the success and streak summaries", async () => {
    const today = toDayKey(new Date());
    const item: Task = {
      id: 1,
      name: "Floss",
      color: "#fff4b3",
      createdOn: today,
      schedule: { kind: "daily" },
      timesPerDay: 1,
      subtasks: [],
      streakAnchor: null,
    };
    renderMain(taskState([item]));
    expect(screen.getByTestId("success-summary")).toHaveTextContent("—");
    expect(screen.getByTestId("success-summary")).toHaveTextContent("No scheduled days yet.");
    expect(screen.getByTestId("streak-summary")).toHaveTextContent("No streak yet");
    expect(screen.getByTestId("streak-summary")).toHaveTextContent("0 of 1 tasks on a streak");

    expect(screen.queryByTestId("yesterday-backfill")).not.toBeInTheDocument();
    expect(screen.getByTestId("freeze-count")).toHaveTextContent("1 freeze");

    await userEvent.click(screen.getByRole("button", { name: "Log one Floss" }));
    expect(screen.getByText("Done today")).toBeInTheDocument();
    expect(screen.getByTestId("success-summary")).toHaveTextContent("100%");
    expect(screen.getByTestId("success-summary")).toHaveTextContent("1 of 1 scheduled days");
    expect(screen.getByTestId("streak-summary")).toHaveTextContent("1 of 1 tasks on a streak");
  });

  it("shows a broken streak, the length that was lost, and a way to start again", async () => {
    const created = toDayKey(subDays(new Date(), 4));
    const second = toDayKey(subDays(new Date(), 3));
    const item: Task = {
      id: 1,
      name: "Read",
      color: "#fff4b3",
      createdOn: created,
      schedule: { kind: "daily" },
      timesPerDay: 1,
      subtasks: [],
      streakAnchor: null,
    };
    renderMain(
      taskState(
        [item],
        [
          { taskId: 1, subtaskId: null, date: created, count: 1 },
          { taskId: 1, subtaskId: null, date: second, count: 1 },
        ]
      )
    );

    const broken = screen.getByTestId("streak-broken");
    expect(broken).toHaveTextContent("Streak broken");
    expect(broken).toHaveTextContent("Last streak was 2 days");
    expect(broken).not.toHaveTextContent(/^0 days$/);
    expect(screen.queryByText("Nothing scheduled today.")).not.toBeInTheDocument();
    expect(screen.getByTestId("streak-summary")).toHaveTextContent("0");
    expect(screen.getByTestId("streak-summary")).toHaveTextContent("No streak yet");

    await userEvent.click(screen.getByRole("button", { name: "Start again" }));
    expect(screen.queryByTestId("streak-broken")).not.toBeInTheDocument();
    expect(screen.getAllByText("No streak yet").length).toBeGreaterThan(0);
    expect(screen.getByTestId("freeze-count")).toHaveTextContent("1 freeze");
  });

  it("shows a frozen day and fills yesterday back in", async () => {
    const created = toDayKey(subDays(new Date(), 2));
    const yesterday = toDayKey(subDays(new Date(), 1));
    const item: Task = {
      id: 1,
      name: "Floss",
      color: "#fff4b3",
      createdOn: created,
      schedule: { kind: "daily" },
      timesPerDay: 1,
      subtasks: [],
      streakAnchor: null,
    };
    const store = renderMain(
      taskState([item], [{ taskId: 1, subtaskId: null, date: created, count: 1 }])
    );

    expect(screen.getByText("1 day")).toBeInTheDocument();
    expect(screen.getByTestId("freeze-count")).toHaveTextContent("0 freezes");
    expect(screen.getByLabelText(/Frozen/)).toBeInTheDocument();
    expect(screen.getByTestId("yesterday-backfill")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Log one Floss yesterday" }));

    expect(store.getState().logs.logs).toContainEqual({
      taskId: 1,
      subtaskId: null,
      date: yesterday,
      count: 1,
    });
    expect(screen.getByText("2 days")).toBeInTheDocument();
    expect(screen.getByTestId("freeze-count")).toHaveTextContent("1 freeze");
    expect(screen.queryByLabelText(/Frozen/)).not.toBeInTheDocument();
    expect(screen.getByTestId("yesterday-backfill")).toHaveTextContent("Filled in");
  });
});
