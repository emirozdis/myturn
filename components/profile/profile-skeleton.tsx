export function ProfileSkeleton() {
  return (
    <div className="flex-1 flex flex-col gap-4 px-4 pt-4 animate-pulse">
      <div className="flex gap-4 items-start">
        <div className="w-[100px] h-[100px] rounded-full bg-white/[0.05] flex-shrink-0" />
        <div className="flex-1 flex flex-col gap-2 pt-2">
          <div className="h-6 w-32 rounded-lg bg-white/[0.05]" />
          <div className="h-4 w-20 rounded-lg bg-white/[0.03]" />
          <div className="h-3 w-40 rounded-lg bg-white/[0.03]" />
        </div>
      </div>
      <div className="h-[90px] rounded-[18px] bg-white/[0.04]" />
      <div className="h-[160px] rounded-[18px] bg-white/[0.03]" />
      <div className="flex-1 rounded-[18px] bg-white/[0.03]" />
    </div>
  );
}
