import { Loader2 } from "lucide-react";

export function RecordLoadingState() {
  return (
    <div className="flex-1 flex flex-col justify-center items-center text-white/50">
      <Loader2 size={32} className="animate-spin text-[#e07c30] mb-2" />
      <span className="text-[12px] font-medium tracking-wide">Checking your daily turn...</span>
    </div>
  );
}
