import { configureStore } from "@reduxjs/toolkit";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import logsReducer from "../redux/sliceLogs";
import pageReducer from "../redux/slicePage";
import tasksReducer from "../redux/sliceTasks";
import Main from "./main";
import TaskAdd from "./taskadd";

function renderAdd() {
  const store = configureStore({
    reducer: {
      page: pageReducer,
      tasks: tasksReducer,
      logs: logsReducer,
    },
  });
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={["/pwa-lifegame/add"]}>
        <Routes>
          <Route path="/pwa-lifegame/add" element={<TaskAdd />} />
          <Route path="/pwa-lifegame/" element={<Main />} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
  return store;
}

describe("add task page", () => {
  it("saves a daily task and returns home", async () => {
    const store = renderAdd();
    expect(screen.getByText("Every day, once a day. Change it anytime.")).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText("New task"), "floss");
    await userEvent.click(screen.getByRole("button", { name: "Add" }));

    expect(screen.getByText("Floss")).toBeInTheDocument();
    expect(screen.queryByLabelText("New task")).not.toBeInTheDocument();
    const saved = store.getState().tasks.tasks[0];
    expect(saved).toMatchObject({
      name: "Floss",
      schedule: { kind: "daily" },
      timesPerDay: 1,
      subtasks: [],
    });
    expect(screen.getByTestId("success-summary")).toBeInTheDocument();
  });

  it("does not save a blank name", async () => {
    const store = renderAdd();
    expect(screen.getByRole("button", { name: "Add" })).toBeDisabled();
    await userEvent.type(screen.getByLabelText("New task"), "   ");
    expect(screen.getByRole("button", { name: "Add" })).toBeDisabled();
    expect(store.getState().tasks.tasks).toHaveLength(0);
  });
});
