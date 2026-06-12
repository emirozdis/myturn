"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { glassStyle } from "@/components/shared/glass-style";
import { Avatar } from "@/components/shared/avatar";

type RequestsTabProps = {
  pendingRequests: any[];
  onRespond: (requestId: string, accept: boolean) => void;
};

export function RequestsTab({ pendingRequests, onRespond }: RequestsTabProps) {
  return (
    <motion.div
      key="requests"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col gap-8 pb-24"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white text-[17px] font-bold tracking-tight">Pending Requests ({pendingRequests?.length || 0})</h2>
      </div>

      {pendingRequests && pendingRequests.length > 0 ? (
        <div className="flex flex-col gap-3">
          {pendingRequests.map((req: any) => (
            <div key={req.id} className="flex items-center justify-between p-3 rounded-[22px] transition-all hover:bg-white/[0.06]" style={glassStyle(0.03, 16, 0.06)}>
              <div className="flex items-center gap-3.5">
                <Avatar src={req.user.image} name={req.user.name} size={44} />
                <div className="flex-1 min-w-0">
                  <div className="text-white text-[14px] font-bold truncate leading-tight tracking-tight">{req.user.name}</div>
                  <div className="text-white/50 text-[11px] font-medium mt-0.5">@{req.user.handle}</div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => onRespond(req.id, true)} className="px-3.5 py-1.5 rounded-full text-[11px] font-bold transition-all active:scale-95 bg-[#e07c30] text-black">Accept</button>
                <button onClick={() => onRespond(req.id, false)} className="px-3.5 py-1.5 rounded-full text-[11px] font-bold transition-all active:scale-95 bg-white/10 text-white/70 hover:bg-red-500/20 hover:text-red-400">Decline</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-12 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
            <Check size={24} className="text-white/30" />
          </div>
          <p className="text-white/70 font-semibold text-[14px]">You&apos;re all caught up!</p>
          <p className="text-white/40 text-[12px] mt-1">No pending invitations or join requests.</p>
        </div>
      )}
    </motion.div>
  );
}
