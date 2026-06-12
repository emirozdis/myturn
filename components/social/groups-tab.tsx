"use client";

import { motion } from "framer-motion";
import { Users, ArrowRight, Flame, Loader2, Copy } from "lucide-react";
import { ACCENT } from "@/lib/theme";
import { glassStyle } from "@/components/shared/glass-style";

type GroupsTabProps = {
  joinCode: string;
  onJoinCodeChange: (value: string) => void;
  onJoin: () => void;
  joining: boolean;
  enrollMsg: string;
  groups: any[];
  loadingDetailsId: string | null;
  onCreateGroup: () => void;
  onViewGroup: (groupId: string) => void;
  onCopyCode: (e: React.MouseEvent, code: string) => void;
};

export function GroupsTab({
  joinCode,
  onJoinCodeChange,
  onJoin,
  joining,
  enrollMsg,
  groups,
  loadingDetailsId,
  onCreateGroup,
  onViewGroup,
  onCopyCode,
}: GroupsTabProps) {
  return (
    <motion.div
      key="groups"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col gap-8 pb-24"
    >
      <div className="grid grid-cols-2 gap-3.5">
        <div
          onClick={onCreateGroup}
          className="rounded-[24px] p-4 flex flex-col justify-between shadow-lg min-h-[140px] group cursor-pointer"
          style={glassStyle(0.04, 20, 0.08)}
        >
          <div>
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-white text-[15px] font-bold leading-tight tracking-tight">Create a Group</h3>
              <div className="w-8 h-8 rounded-full bg-[#e07c30]/15 flex items-center justify-center border border-[#e07c30]/30 shadow-sm group-hover:scale-110 transition-transform">
                <Users size={15} className="text-[#e07c30]" />
              </div>
            </div>
            <p className="text-white/50 text-[11px] font-medium leading-relaxed pr-2">Start a new group and invite your friends</p>
          </div>
          <button
            className="w-full mt-4 py-2 rounded-full text-[12px] font-bold transition-all group-hover:bg-[#e07c30]/20"
            style={{
              background: "rgba(224,124,48,0.1)",
              border: "1px solid rgba(224,124,48,0.3)",
              color: ACCENT,
            }}
          >
            Create Group
          </button>
        </div>

        <div
          className="rounded-[24px] p-4 flex flex-col justify-between shadow-lg min-h-[140px]"
          style={glassStyle(0.04, 20, 0.08)}
        >
          <div>
            <h3 className="text-white text-[15px] font-bold leading-tight tracking-tight mb-2">Join with Code</h3>
            <p className="text-white/50 text-[11px] font-medium leading-relaxed">Got an invite code? Join a group</p>
          </div>
          <div className="relative mt-4">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => onJoinCodeChange(e.target.value)}
              placeholder="Enter code"
              className="w-full rounded-full py-2 pl-3.5 pr-10 text-[12px] text-white outline-none placeholder:text-white/30 transition-colors shadow-inner"
              style={{
                background: "rgba(0,0,0,0.3)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            />
            <button
              onClick={onJoin}
              className="absolute right-1 top-1 bottom-1 w-7 h-7 rounded-full flex items-center justify-center text-black shadow-md hover:scale-105 transition-transform my-auto disabled:opacity-50"
              style={{ background: ACCENT }}
              disabled={!joinCode.trim() || joining}
            >
              {joining ? (
                <Loader2 size={12} className="animate-spin text-black" />
              ) : (
                <ArrowRight size={14} strokeWidth={2.5} />
              )}
            </button>
          </div>
        </div>
      </div>

      {enrollMsg && (
        <p className="text-center text-xs font-semibold text-[#e07c30]">{enrollMsg}</p>
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white text-[17px] font-bold tracking-tight">Your Groups ({groups.length})</h2>
        </div>
        <div className="flex flex-col gap-3">
          {groups.map((group: any) => (
            <div
              key={group.id}
              onClick={() => onViewGroup(group.id)}
              className="flex items-center justify-between p-3.5 rounded-[22px] transition-all hover:bg-white/[0.06] cursor-pointer"
              style={glassStyle(0.03, 16, 0.06)}
            >
              <div className="flex items-center gap-3.5 flex-1 min-w-0">
                <div className="w-14 h-14 rounded-full shadow-md border-[1.5px] border-white/10 flex-shrink-0 flex items-center justify-center bg-white/5 text-2xl font-bold">
                  {group.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-[15px] font-bold truncate tracking-tight">{group.name}</div>
                  <div className="text-white/60 text-[11px] font-medium flex items-center gap-1.5 mt-0.5">
                    <Users size={12} className="opacity-80" />
                    <span>{group.members} members</span>
                  </div>
                  <div className="text-white/40 text-[10px] font-medium mt-1.5 tracking-wide flex items-center gap-1">
                    <Flame size={10} className="text-[#e07c30]" />
                    <span>Code: {group.inviteCode}</span>
                  </div>
                </div>
              </div>

              {loadingDetailsId === group.id ? (
                <Loader2 size={16} className="animate-spin text-[#e07c30] mr-2.5 flex-shrink-0" />
              ) : (
                <button
                  onClick={(e) => onCopyCode(e, group.inviteCode)}
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.12)",
                  }}
                  className="p-2.5 rounded-full text-white/70 hover:text-white transition-colors"
                  title="Copy invite code"
                >
                  <Copy size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
