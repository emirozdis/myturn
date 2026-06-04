"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, Users, ArrowRight, X, Search, Check, Flame, Compass } from "lucide-react";
import { ACCENT } from "@/lib/theme";
import { glassStyle } from "@/components/shared/glass-style";

const TABS = ["Friends", "Groups", "Requests", "Discover"];

const FRIENDS = [
  { id: 1, name: "Emir", status: "Online", online: true, hasStory: true },
  { id: 2, name: "Nadz", status: "Online", online: true, hasStory: false },
  { id: 3, name: "Jhon", status: "Online", online: true, hasStory: false },
  { id: 4, name: "Clara", status: "Offline", online: false, hasStory: false },
  { id: 5, name: "Miguel", status: "Online", online: true, hasStory: false },
];

const GROUPS = [
  { id: 1, name: "The Apartment", members: 8, last: "2 days ago" },
  { id: 2, name: "Weekend Warriors", members: 5, last: "1 week ago" },
  { id: 3, name: "Foodies Club", members: 6, last: "3 days ago" },
];

const SUGGESTIONS = [
  { id: 1, name: "Alex Reyes", mutual: 3 },
  { id: 2, name: "Samantha Lee", mutual: 4 },
  { id: 3, name: "Mark Dela Cruz", mutual: 2 },
];

const REQUESTS = [
  { id: 1, name: "David Kim", info: "5 mutual friends", type: "friend" },
  { id: 2, name: "Izmir Vloggers", info: "12 members", type: "group" },
];

const TRENDING = [
  { id: 1, name: "Local Explorers", members: 124, active: "12 mins ago" },
  { id: 2, name: "Coffee Lovers", members: 89, active: "1 hour ago" },
];

export default function SocialPage() {
  const [activeTab, setActiveTab] = useState("Friends");
  const [joinCode, setJoinCode] = useState("");
  const activeIndex = TABS.indexOf(activeTab);

  const renderTabContent = () => {
    switch (activeTab) {
      case "Friends":
        return (
          <motion.div
            key="friends"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-8 pb-24"
          >
            {/* Banner */}
            <div
              className="relative rounded-[24px] overflow-hidden min-h-[140px] flex items-center"
              style={{
                background: "linear-gradient(90deg, rgba(44,44,44,0.9) 0%, rgba(26,26,26,0.95) 100%)",
                boxShadow: "inset 0 1px 1px rgba(255,255,255,0.15), 0 10px 30px rgba(0,0,0,0.4)",
                border: "1px solid rgba(255,255,255,0.08)"
              }}
            >
              <div className="absolute inset-y-0 right-0 w-[65%] pointer-events-none mask-image-gradient">
                <div className="absolute inset-0 bg-gradient-to-r from-[#2c2c2c] via-transparent to-transparent z-10" />
                <img
                  src="/image1.jpg"
                  alt="Friends"
                  className="w-full h-full object-cover opacity-70"
                />
              </div>
              <div className="relative z-20 p-5 w-[70%]">
                <p className="text-white/70 text-[11px] font-bold uppercase tracking-wider mb-1.5">Grow your circle</p>
                <h3 className="text-white text-[20px] font-bold leading-[1.15] mb-4 tracking-tight drop-shadow-md">
                  Add friends to<br />join the fun
                </h3>
                <button
                  className="text-black px-5 py-2 rounded-full text-[12px] font-bold transition-all active:scale-95"
                  style={{ background: ACCENT }}
                >
                  Find Friends
                </button>
              </div>
            </div>

            {/* Your Friends */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white text-[17px] font-bold tracking-tight">Your Friends</h2>
                <button className="text-[#e07c30] text-[12px] font-bold hover:text-white transition-colors">See all</button>
              </div>
              <div
                className="flex gap-4 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2 pt-1"
                style={{ WebkitOverflowScrolling: "touch" }}
              >
                {FRIENDS.map((friend) => (
                  <div key={friend.id} className="flex flex-col items-center flex-shrink-0 w-[68px] cursor-pointer group">
                    <div className="relative w-[64px] h-[64px] mb-2 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                      {friend.hasStory && (
                        <div className="absolute inset-0 rounded-full border-[2.5px] border-[#0A84FF] opacity-90 scale-[1.08]" />
                      )}
                      <img
                        src="/profile.jpg"
                        alt={friend.name}
                        className={`w-full h-full rounded-full object-cover ${friend.hasStory ? "border-2 border-[#111]" : "border-[1.5px] border-white/15"}`}
                      />
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
            </div>

            {/* Suggestions */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white text-[17px] font-bold tracking-tight">Suggestions</h2>
                <button className="text-[#e07c30] text-[12px] font-bold hover:text-white transition-colors">See all</button>
              </div>
              <div className="flex flex-col gap-3">
                {SUGGESTIONS.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 rounded-[22px] transition-all hover:bg-white/[0.06]"
                    style={glassStyle(0.03, 16, 0.06)}
                  >
                    <div className="flex items-center gap-3.5">
                      <img
                        src="/profile.jpg"
                        alt={user.name}
                        className="w-[44px] h-[44px] rounded-full object-cover border border-white/15 shadow-md"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-[14px] font-bold truncate leading-tight tracking-tight">
                          {user.name}
                        </div>
                        <div className="text-white/50 text-[11px] font-medium mt-0.5">{user.mutual} mutual friends</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className="px-4 py-1.5 rounded-full text-[11px] font-bold transition-all active:scale-95 whitespace-nowrap"
                        style={{
                          background: "rgba(224,124,48,0.15)",
                          border: "1px solid rgba(224,124,48,0.4)",
                          color: ACCENT,
                          boxShadow: "inset 0 1px 2px rgba(255,255,255,0.1)"
                        }}
                      >
                        Add Friend
                      </button>
                      <button className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors focus:outline-none">
                        <X size={14} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        );

      case "Groups":
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
                    onChange={(e) => setJoinCode(e.target.value)}
                    placeholder="Enter code"
                    className="w-full rounded-full py-2 pl-3.5 pr-10 text-[12px] text-white outline-none placeholder:text-white/30 transition-colors shadow-inner"
                    style={{
                      background: "rgba(0,0,0,0.3)",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  />
                  <button
                    className="absolute right-1 top-1 bottom-1 w-7 h-7 rounded-full flex items-center justify-center text-black shadow-md hover:scale-105 transition-transform my-auto disabled:opacity-50"
                    style={{ background: ACCENT }}
                    disabled={!joinCode.trim()}
                  >
                    <ArrowRight size={14} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white text-[17px] font-bold tracking-tight">Your Groups</h2>
                <button className="text-[#e07c30] text-[12px] font-bold hover:text-white transition-colors">See all</button>
              </div>
              <div className="flex flex-col gap-3">
                {GROUPS.map((group) => (
                  <div
                    key={group.id}
                    className="flex items-center gap-3.5 p-3.5 rounded-[22px] transition-all hover:bg-white/[0.06]"
                    style={glassStyle(0.03, 16, 0.06)}
                  >
                    <img
                      src="/image1.jpg"
                      alt={group.name}
                      className="w-14 h-14 rounded-full object-cover shadow-md border-[1.5px] border-white/10"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-[15px] font-bold truncate tracking-tight">{group.name}</div>
                      <div className="text-white/60 text-[11px] font-medium flex items-center gap-1.5 mt-0.5">
                        <Users size={12} className="opacity-80" />
                        <span>{group.members} members</span>
                      </div>
                      <div className="text-white/40 text-[10px] font-medium mt-1.5 tracking-wide flex items-center gap-1">
                        <Flame size={10} className="text-[#e07c30]" />
                        Last vlog: {group.last}
                      </div>
                    </div>
                    <button
                      className="px-4 py-2 rounded-full text-[11px] font-bold transition-all active:scale-95 whitespace-nowrap"
                      style={{
                        background: "rgba(224,124,48,0.15)",
                        border: "1px solid rgba(224,124,48,0.4)",
                        color: ACCENT,
                        boxShadow: "inset 0 1px 2px rgba(255,255,255,0.1)"
                      }}
                    >
                      View Group
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        );

      case "Requests":
        return (
          <motion.div
            key="requests"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-8 pb-24"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white text-[17px] font-bold tracking-tight">Pending Requests</h2>
              </div>
              <div className="flex flex-col gap-3">
                {REQUESTS.length > 0 ? REQUESTS.map((req) => (
                  <div
                    key={req.id}
                    className="flex flex-col gap-3 p-4 rounded-[22px] transition-all"
                    style={glassStyle(0.04, 20, 0.08)}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="relative">
                        <img
                          src={req.type === "group" ? "/image1.jpg" : "/profile.jpg"}
                          alt={req.name}
                          className="w-12 h-12 rounded-full object-cover border-[1.5px] border-white/15 shadow-md"
                        />
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#111] flex items-center justify-center border border-white/10">
                          {req.type === "group" ? (
                            <Users size={10} className="text-[#e07c30]" />
                          ) : (
                            <UserPlus size={10} className="text-[#e07c30]" />
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-[15px] font-bold truncate tracking-tight">{req.name}</div>
                        <div className="text-white/50 text-[11px] font-medium mt-0.5">{req.info}</div>
                        <div className="text-[#e07c30] text-[10px] font-bold uppercase tracking-wider mt-1">
                          {req.type === "group" ? "Group Invite" : "Friend Request"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        className="flex-1 py-2 rounded-xl text-black text-[12px] font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5"
                        style={{
                          background: ACCENT,
                          boxShadow: "inset 0 1px 1px rgba(255,255,255,0.4)"
                        }}
                      >
                        <Check size={14} strokeWidth={3} />
                        Accept
                      </button>
                      <button
                        className="flex-1 py-2 rounded-xl text-white text-[12px] font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5"
                        style={{
                          background: "rgba(255,255,255,0.08)",
                          border: "1px solid rgba(255,255,255,0.12)",
                        }}
                      >
                        <X size={14} strokeWidth={3} className="opacity-70" />
                        Decline
                      </button>
                    </div>
                  </div>
                )) : (
                  <div className="py-12 flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                      <Check size={24} className="text-white/30" />
                    </div>
                    <p className="text-white/70 font-semibold text-[14px]">You're all caught up!</p>
                    <p className="text-white/40 text-[12px] mt-1">No pending requests at the moment.</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        );

      case "Discover":
        return (
          <motion.div
            key="discover"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-8 pb-24"
          >
            <div className="relative">
              <input
                type="text"
                placeholder="Search groups, people, tags..."
                className="w-full rounded-[18px] py-3.5 pl-10 pr-4 text-[13px] text-white outline-none placeholder:text-white/40 shadow-inner transition-all focus:border-[#e07c30]/50"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              />
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-4">
                <Compass size={18} className="text-[#e07c30]" />
                <h2 className="text-white text-[17px] font-bold tracking-tight">Trending Groups</h2>
              </div>
              <div className="flex flex-col gap-3">
                {TRENDING.map((group) => (
                  <div
                    key={group.id}
                    className="flex items-center justify-between p-3.5 rounded-[22px] transition-all hover:bg-white/[0.06]"
                    style={glassStyle(0.03, 16, 0.06)}
                  >
                    <div className="flex items-center gap-3.5">
                      <img
                        src="/image1.jpg"
                        alt={group.name}
                        className="w-12 h-12 rounded-xl object-cover border border-white/15 shadow-sm"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-[15px] font-bold truncate tracking-tight">
                          {group.name}
                        </div>
                        <div className="text-white/50 text-[11px] font-medium mt-0.5">{group.members} members</div>
                        <div className="text-[#e07c30] text-[10px] font-semibold mt-1">Active {group.active}</div>
                      </div>
                    </div>
                    <button
                      className="px-4 py-2 rounded-full text-[11px] font-bold transition-all active:scale-95 whitespace-nowrap"
                      style={{
                        background: "rgba(255,255,255,0.08)",
                        border: "1px solid rgba(255,255,255,0.15)",
                        color: "white",
                        boxShadow: "inset 0 1px 2px rgba(255,255,255,0.05)"
                      }}
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        );
    }
  };

  return (
    <motion.div
      key="social-tab"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="flex-1 flex flex-col h-full overflow-y-auto scrollbar-hide -mx-4 -mb-4 px-4 pt-6"
      style={{
        WebkitOverflowScrolling: "touch",
        msOverflowStyle: "none",
        scrollbarWidth: "none",
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: `::-webkit-scrollbar { display: none; }` }} />

      {/* Tabs Switcher */}
      <div
        className="flex items-center justify-between p-1.5 rounded-full mb-8 relative z-10 shadow-lg"
        style={glassStyle(0.02, 20, 0.05)}
      >
        {/* Sliding indicator */}
        <motion.div
          className="absolute top-1.5 bottom-1.5 rounded-full z-0 pointer-events-none"
          animate={{
            left: `calc(${activeIndex} * (100% / ${TABS.length}) + 6px)`,
            width: `calc(100% / ${TABS.length} - 12px)`,
          }}
          transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
          style={{
            background: ACCENT,
            boxShadow: "0 2px 8px rgba(224,124,48,0.3), inset 0 1px 1px rgba(255,255,255,0.4)",
          }}
        />
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="flex-1 relative text-center py-2 text-[12px] font-bold rounded-full transition-colors duration-300 z-10 focus:outline-none"
            style={{
              color: activeTab === tab ? "#111" : "rgba(255,255,255,0.5)",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content Area */}
      <AnimatePresence mode="wait">
        {renderTabContent()}
      </AnimatePresence>
    </motion.div>
  );
}
