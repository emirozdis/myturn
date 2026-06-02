export type MockGroup = {
  id: string;
  name: string;
  memberCount: number;
  emoji: string;
};

export const MOCK_GROUPS: MockGroup[] = [
  { id: "apt", name: "The Apartment", memberCount: 5, emoji: "🏠" },
  { id: "work", name: "Work Crew", memberCount: 8, emoji: "💼" },
  { id: "family", name: "Family Circle", memberCount: 4, emoji: "👨‍👩‍👧‍👦" },
];

export const GROUP_STREAK_STATS: Record<
  string,
  { current: number; best: number; totalVlogs: number }
> = {
  apt: { current: 3, best: 12, totalVlogs: 36 },
  work: { current: 7, best: 14, totalVlogs: 52 },
  family: { current: 5, best: 9, totalVlogs: 28 },
};

export const calendarDays = [
  { d: 31, type: "prev" },
  { d: 1, type: "vlogged" },
  { d: 2, type: "vlogged" },
  { d: 3, type: "vlogged" },
  { d: 4, type: "missed" },
  { d: 5, type: "missed" },
  { d: 6, type: "missed" },
  { d: 7, type: "vlogged" },
  { d: 8, type: "vlogged" },
  { d: 9, type: "vlogged" },
  { d: 10, type: "missed" },
  { d: 11, type: "missed" },
  { d: 12, type: "missed" },
  { d: 13, type: "missed" },
  { d: 14, type: "vlogged", best: true },
  { d: 15, type: "missed" },
  { d: 16, type: "missed" },
  { d: 17, type: "missed" },
  { d: 18, type: "missed" },
  { d: 19, type: "missed" },
  { d: 20, type: "missed" },
  { d: 21, type: "missed" },
  { d: 22, type: "missed" },
  { d: 23, type: "missed" },
  { d: 24, type: "missed" },
  { d: 25, type: "missed" },
  { d: 26, type: "missed" },
  { d: 27, type: "missed" },
  { d: 28, type: "missed" },
  { d: 29, type: "missed" },
  { d: 30, type: "missed" },
  { d: 1, type: "next" },
  { d: 2, type: "next" },
  { d: 3, type: "next" },
  { d: 4, type: "next" },
];

export const friendsStreaks = [
  { name: "Emir", streak: 3, img: "/profile.jpg", isMe: true, rank: 1 },
  { name: "Sarah", streak: 7, img: "/image1.jpg", isMe: false, rank: 2 },
  { name: "Alex", streak: 12, img: "/image1.jpg", isMe: false, rank: 3 },
  { name: "Mert", streak: 5, img: "/image1.jpg", isMe: false, rank: 4 },
  { name: "Zeynep", streak: 4, img: "/image1.jpg", isMe: false, rank: 5 },
];

export const achievementsData = [
  { title: "Getting Started", req: "3 day streak", unlocked: true, icon: "🔥", level: 3 },
  { title: "On Fire", req: "7 day streak", unlocked: true, icon: "🏕️", level: 7 },
  { title: "Unstoppable", req: "12 day streak", unlocked: true, icon: "⛰️", level: 12 },
  { title: "Legend", req: "30 day streak", unlocked: false, icon: null, level: 30 },
  { title: "Epic", req: "60 day streak", unlocked: false, icon: null, level: 60 },
];
