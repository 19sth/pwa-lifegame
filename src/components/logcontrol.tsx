import { Add, Remove } from "@mui/icons-material";
import { IconButton } from "@mui/material";

export default function LogControl({
  count,
  target,
  label,
  onChange,
}: {
  count: number;
  target: number;
  label: string;
  onChange: (next: number) => void;
}) {
  const shown = Math.min(count, target);
  return (
    <div className="flex items-center">
      <IconButton
        aria-label={`Remove one ${label}`}
        size="small"
        disabled={shown <= 0}
        onClick={() => onChange(shown - 1)}
      >
        <Remove />
      </IconButton>
      <span className="min-w-[2.75rem] text-center font-bold tabular-nums">
        {shown}/{target}
      </span>
      <IconButton
        aria-label={`Log one ${label}`}
        onClick={() => onChange(shown + 1)}
        disabled={shown >= target}
        sx={{
          bgcolor: "#fde047",
          "&:hover": { bgcolor: "#facc15" },
          "&.Mui-disabled": { bgcolor: "#f3f4f6", color: "#9ca3af" },
        }}
      >
        <Add />
      </IconButton>
    </div>
  );
}
