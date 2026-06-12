export function TodaySkeleton() {
  return (
    <div className="flex-1 flex flex-col gap-3 animate-pulse">
      <div className="flex-1 min-h-0 rounded-3xl bg-white/[0.04]" />
      <div className="h-[138px] rounded-[24px] bg-white/[0.03]" />
    </div>
  );
}
