type ProgressBarProps = {
  value: number;
};

export function ProgressBar(props: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, props.value));
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div
        className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
