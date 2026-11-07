const APP_NAME = "lifegame";
const BASE_PATH = "/pwa-lifegame";
const STORAGE_KEY = "lifegameState";

const DAYS = [
  { label: "Sunday", short: "Sun", value: 0 },
  { label: "Monday", short: "Mon", value: 1 },
  { label: "Tuesday", short: "Tue", value: 2 },
  { label: "Wednesday", short: "Wed", value: 3 },
  { label: "Thursday", short: "Thu", value: 4 },
  { label: "Friday", short: "Fri", value: 5 },
  { label: "Saturday", short: "Sat", value: 6 },
];

const DAYS_MON_FIRST = [1, 2, 3, 4, 5, 6, 0].map(
  (value) => DAYS.find((day) => day.value === value) as (typeof DAYS)[number]
);

const COLORS = [
  { label: "Red", value: "#ffb3b3" },
  { label: "Orange", value: "#ffd699" },
  { label: "Yellow", value: "#fff4b3" },
  { label: "Green", value: "#c2f0c2" },
  { label: "Blue", value: "#b3ecff" },
  { label: "Dark Blue", value: "#b3c6e7" },
  { label: "Purple", value: "#d9d2e9" },
  { label: "Pink", value: "#ffd9eb" },
];

const TIMES_PER_DAY = [1, 2, 3, 4, 5, 6, 7, 8];
const DAYS_PER_WEEK = [1, 2, 3, 4, 5, 6, 7];

export {
  APP_NAME,
  BASE_PATH,
  COLORS,
  DAYS,
  DAYS_MON_FIRST,
  DAYS_PER_WEEK,
  STORAGE_KEY,
  TIMES_PER_DAY,
};
