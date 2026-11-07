import tasksReducer, { addTask, updateTask } from "./sliceTasks";

describe("tasks reducer", () => {
  it("creates a daily task that is done once per day", () => {
    const next = tasksReducer(undefined, addTask({ name: "  floss" }));
    expect(next.tasks).toHaveLength(1);
    expect(next.tasks[0]).toMatchObject({
      name: "Floss",
      schedule: { kind: "daily" },
      timesPerDay: 1,
      subtasks: [],
      streakAnchor: null,
    });
    expect(next.notificationMessage).toBe("Task added.");
  });

  it("saves a schedule and nested parts", () => {
    const created = tasksReducer(undefined, addTask({ name: "Train" }));
    const task = created.tasks[0];
    const next = tasksReducer(
      created,
      updateTask({
        id: task.id,
        name: task.name,
        color: task.color,
        schedule: { kind: "nPerWeek", daysPerWeek: 2 },
        timesPerDay: 3,
        subtasks: [
          { id: 0, name: "Squat", timesPerDay: 1 },
          { id: 0, name: "Hinge", timesPerDay: 1 },
        ],
      })
    );
    expect(next.tasks[0].schedule).toEqual({ kind: "nPerWeek", daysPerWeek: 2 });
    expect(next.tasks[0].timesPerDay).toBe(3);
    expect(next.tasks[0].subtasks.map((subtask) => subtask.name)).toEqual(["Squat", "Hinge"]);
    expect(new Set(next.tasks[0].subtasks.map((subtask) => subtask.id)).size).toBe(2);
  });
});
