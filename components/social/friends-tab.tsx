"use client";

import { motion } from "framer-motion";
import { ACCENT } from "@/lib/theme";
import { glassStyle } from "@/components/shared/glass-style";
import { Avatar } from "@/components/shared/avatar";

type FriendsTabProps = {
  friends: any[];
  suggestions: any[];
  onFindFriends: () => void;
  onSendRequest: (userId: string) => void;
};

export function FriendsTab({ friends, suggestions, onFindFriends, onSendRequest }: FriendsTabProps) {
  return (
    <motion.div
      key="friends"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col gap-8 pb-24"
    >
      <div
        className="relative rounded-[24px] overflow-hidden min-h-[140px] flex items-center"
        style={{
          background: "linear-gradient(90deg, rgba(44,44,44,0.9) 0%, rgba(26,26,26,0.95) 100%)",
          boxShadow: "inset 0 1px 1px rgba(255,255,255,0.15), 0 10px 30px rgba(0,0,0,0.4)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div className="absolute inset-y-0 right-0 w-[65%] pointer-events-none mask-image-gradient">
          <div className="absolute inset-0 bg-gradient-to-r from-[#2c2c2c] via-transparent to-transparent z-10" />
          <img src="/image1.png" alt="Friends" className="w-full h-full object-cover opacity-70" />
        </div>
        <div className="relative z-20 p-5 w-[70%]">
          <p className="text-white/70 text-[11px] font-bold uppercase tracking-wider mb-1.5">Grow your circle</p>
          <h3 className="text-white text-[20px] font-bold leading-[1.15] mb-4 tracking-tight drop-shadow-md">
            Add friends to<br />join the fun
          </h3>
          <button
            onClick={onFindFriends}
            className="text-black px-5 py-2 rounded-full text-[12px] font-bold transition-all active:scale-95"
            style={{ background: ACCENT }}
          >
            Find Friends
          </button>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white text-[17px] font-bold tracking-tight">Your Friends ({friends.length})</h2>
        </div>
        {friends.length > 0 ? (
          <div
            className="flex gap-4 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2 pt-1"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {friends.map((friend: any) => (
              <div 
                key={friend.id} 
                className="flex flex-col items-center flex-shrink-0 w-[68px] cursor-pointer group"
                onClick={() => {
                  window.dispatchEvent(
                    new CustomEvent("open-bottom-sheet", {
                      detail: { type: "user-profile", data: { userId: friend.id } },
                    })
                  );
                }}
              >
                <div className="relative w-[64px] h-[64px] mb-2 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                  {friend.hasStory && (
                    <div className="absolute inset-0 rounded-full border-[2.5px] border-[#0A84FF] opacity-90 scale-[1.08]" />
                  )}
                  <Avatar src={friend.image} name={friend.name} size={64} ring={friend.hasStory} />
                  <div
                    className={`absolute bottom-0 right-0 w-4 h-4 border-[2.5px] border-[#111] rounded-full shadow-sm ${
                      friend.online ? "bg-[#30D158]" : "bg-[#555]"
                    }`}
                  />
                </div>
                <span className="text-white text-[13px] font-semibold truncate w-full text-center tracking-tight">
                  {friend.name}
                </span>
                <span className="text-white/50 text-[11px] font-medium truncate w-full text-center mt-0.5">
                  {friend.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-white/30 text-xs">No connections found. Send some friend requests!</p>
        )}
      </div>

      {suggestions && suggestions.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white text-[17px] font-bold tracking-tight">Suggested Connections</h2>
          </div>
          <div className="flex flex-col gap-3">
            {suggestions.map((user: any) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 rounded-[22px] transition-all hover:bg-white/[0.06]"
                style={glassStyle(0.03, 16, 0.06)}
              >
                <div className="flex items-center gap-3.5">
                  <Avatar src={user.image} name={user.name} size={44} />
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-[14px] font-bold truncate leading-tight tracking-tight">
                      {user.name}
                    </div>
                    <div className="text-white/50 text-[11px] font-medium mt-0.5">{user.mutual} mutual groups</div>
                  </div>
                </div>
                <button
                  onClick={() => !user.requested && onSendRequest(user.id)}
                  disabled={user.requested}
                  className="px-4 py-1.5 rounded-full text-[11px] font-bold transition-all whitespace-nowrap disabled:opacity-50 disabled:bg-transparent disabled:text-white/50"
                  style={user.requested ? { border: "1px solid rgba(255,255,255,0.2)" } : {
                    background: "rgba(224,124,48,0.15)",
                    border: "1px solid rgba(224,124,48,0.4)",
                    color: ACCENT,
                    boxShadow: "inset 0 1px 2px rgba(255,255,255,0.1)",
                  }}
                >
                  {user.requested ? "Requested" : "Connect"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}