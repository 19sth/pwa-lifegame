import { configureStore } from "@reduxjs/toolkit";
import { render, screen } from "@testing-library/react";
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

describe("main screen", () => {
  it("adds a daily task and logs it from the list", async () => {
    renderMain();
    await userEvent.type(screen.getByLabelText("New task"), "floss");
    await userEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(screen.getByText("Floss")).toBeInTheDocument();
    expect(screen.getByText(/Every day, once a day/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Log one Floss" }));
    expect(screen.getByText("Done today")).toBeInTheDocument();
    expect(screen.getByText("1 day")).toBeInTheDocument();
  });

  it("shows a broken streak, the length that was lost, and a way to start again", async () => {
    const created = toDayKey(subDays(new Date(), 3));
    const second = toDayKey(subDays(new Date(), 2));
    const task: Task = {
      id: 1,
      name: "Read",
      color: "#fff4b3",
      createdOn: created,
      schedule: { kind: "daily" },
      timesPerDay: 1,
      subtasks: [],
      streakAnchor: null,
    };
    renderMain({
      tasks: {
        tasks: [task],
        notificationMessage: "",
        notificationIsoDt: epoch,
      },
      logs: {
        logs: [
          { taskId: 1, subtaskId: null, date: created, count: 1 },
          { taskId: 1, subtaskId: null, date: second, count: 1 },
        ],
        notificationMessage: "",
        notificationIsoDt: epoch,
      },
    });

    const broken = screen.getByTestId("streak-broken");
    expect(broken).toHaveTextContent("Streak broken");
    expect(broken).toHaveTextContent("Last streak was 2 days");
    expect(broken).not.toHaveTextContent(/^0 days$/);
    expect(screen.queryByText("Nothing scheduled today.")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Start again" }));
    expect(screen.queryByTestId("streak-broken")).not.toBeInTheDocument();
    expect(screen.getByText("No streak yet")).toBeInTheDocument();
  });
});
