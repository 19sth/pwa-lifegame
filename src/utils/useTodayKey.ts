import { useEffect, useState } from "react";
import { toDayKey } from "./schedule";

export default function useTodayKey(): string {
  const [key, setKey] = useState(() => toDayKey(new Date()));

  useEffect(() => {
    const update = () => setKey(toDayKey(new Date()));
    const id = window.setInterval(update, 60_000);
    document.addEventListener("visibilitychange", update);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", update);
    };
  }, []);

  return key;
}
