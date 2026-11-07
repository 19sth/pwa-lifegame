import "@testing-library/jest-dom";

const originalError = console.error.bind(console);

beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation((message?: unknown) => {
    if (typeof message === "string" && message.includes("not wrapped in act")) return;
    originalError(message);
  });
});
