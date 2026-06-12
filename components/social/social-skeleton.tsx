export function SocialSkeleton() {
  return (
    <div className="flex-1 flex flex-col gap-4 px-0 pt-6 animate-pulse">
      <div className="h-10 rounded-full bg-white/[0.04]" />
      <div className="h-[140px] rounded-[24px] bg-white/[0.04]" />
      <div className="flex gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="w-[68px] h-[90px] rounded-[20px] bg-white/[0.03] flex-shrink-0" />
        ))}
      </div>
      <div className="flex-1 rounded-[24px] bg-white/[0.03]" />
    </div>
  );
}
