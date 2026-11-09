import { Button } from "@mui/material";
import { Streak, streakCopy } from "../utils/schedule";
import FreezeMark from "./freezemark";

function freezeCopy(count: number) {
  return count === 1 ? "1 freeze" : `${count} freezes`;
}

function FreezeCount({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-1 text-sm text-gray-700" data-testid="freeze-count">
      <FreezeMark />
      <span>{freezeCopy(count)}</span>
    </div>
  );
}

export default function StreakBlock({
  streak,
  onStartAgain,
}: {
  streak: Streak;
  onStartAgain?: () => void;
}) {
  const copy = streakCopy(streak);
  if (streak.status === "broken") {
    return (
      <div
        className="rounded-lg border border-red-200 bg-red-50 px-3 py-3"
        data-testid="streak-broken"
        role="status"
      >
        <div className="font-bold text-red-800">{copy.headline}</div>
        <div className="text-sm text-red-900 mt-1">{copy.detail}</div>
        <div className="mt-2">
          <FreezeCount count={streak.freezes} />
        </div>
        {onStartAgain ? (
          <Button
            onClick={onStartAgain}
            variant="contained"
            color="error"
            size="small"
            sx={{ mt: 1 }}
          >
            Start again
          </Button>
        ) : null}
      </div>
    );
  }
  return (
    <div>
      <div className="text-xs text-gray-500">{copy.detail}</div>
      <div className="flex items-center justify-between gap-2">
        <div className="font-bold text-lg">{copy.headline}</div>
        <FreezeCount count={streak.freezes} />
      </div>
    </div>
  );
}
