export const FREEZE_DOT = {
  background: "#bae6fd",
  border: "2px solid #0369a1",
};

export default function FreezeMark({ size = 10 }: { size?: number }) {
  return (
    <span
      aria-hidden
      className="inline-block shrink-0"
      style={{
        width: size,
        height: size,
        borderRadius: 2,
        background: FREEZE_DOT.background,
        border: FREEZE_DOT.border,
      }}
    />
  );
}
