export type Clip = {
  id: string;
  thumbnailUrl?: string;
  timestamp: string;
  duration: string;
  caption?: string;
};

export type ArchiveDay = {
  id: string;
  label: string;
  vloggerName: string;
  clipCount: number;
  collageUrls: string[];
};

export type GroupMember = {
  id: string;
  name: string;
  initials: string;
  lastVlogged: string;
  streak: number;
};

export type ActivityUser = {
  id: string;
  name: string;
  initials: string;
};

export type MockAppState = {
  groupName: string;
  groupEmpty: boolean;
  currentUser: { id: string; name: string; initials: string };
  todayVlogger: {
    id: string;
    name: string;
    initials: string;
    hoursRemaining: number;
  };
  isCurrentUserVlogger: boolean;
  hasStartedToday: boolean;
  todayClips: Clip[];
  watchers: ActivityUser[];
  reactors: ActivityUser[];
  previousDays: ArchiveDay[];
  members: GroupMember[];
  inviteLink: string;
  notifications: {
    todaysTurn: boolean;
    someoneUploads: boolean;
    dailyRecap: boolean;
    pushEnabled: boolean;
  };
  timezone: string;
};

export const MOCK_APP: MockAppState = {
  groupName: "The Apartment",
  groupEmpty: false,
  currentUser: { id: "u1", name: "You", initials: "YO" },
  todayVlogger: {
    id: "u2",
    name: "Emir",
    initials: "EM",
    hoursRemaining: 12,
  },
  isCurrentUserVlogger: true,
  hasStartedToday: true,
  todayClips: [
    {
      id: "c1",
      thumbnailUrl: "https://picsum.photos/seed/c1/300/400",
      timestamp: "9:14 AM",
      duration: "0:12",
      caption: "Morning coffee run",
    },
    {
      id: "c2",
      thumbnailUrl: "https://picsum.photos/seed/c2/300/400",
      timestamp: "11:42 AM",
      duration: "0:24",
    },
    {
      id: "c3",
      thumbnailUrl: "https://picsum.photos/seed/c3/300/400",
      timestamp: "2:08 PM",
      duration: "0:18",
      caption: "Lunch with the crew",
    },
  ],
  watchers: [
    { id: "w1", name: "Sara", initials: "SA" },
    { id: "w2", name: "Ali", initials: "AL" },
    { id: "w3", name: "Mina", initials: "MI" },
  ],
  reactors: [
    { id: "r1", name: "Ali", initials: "AL" },
    { id: "r2", name: "Jo", initials: "JO" },
  ],
  previousDays: [
    {
      id: "d1",
      label: "Yesterday",
      vloggerName: "Sara",
      clipCount: 8,
      collageUrls: [
        "https://picsum.photos/seed/p1/200/200",
        "https://picsum.photos/seed/p2/200/200",
        "https://picsum.photos/seed/p3/200/200",
        "https://picsum.photos/seed/p4/200/200",
      ],
    },
    {
      id: "d2",
      label: "2 days ago",
      vloggerName: "Ali",
      clipCount: 6,
      collageUrls: [
        "https://picsum.photos/seed/p5/200/200",
        "https://picsum.photos/seed/p6/200/200",
        "https://picsum.photos/seed/p7/200/200",
        "https://picsum.photos/seed/p8/200/200",
      ],
    },
    {
      id: "d3",
      label: "3 days ago",
      vloggerName: "Mina",
      clipCount: 11,
      collageUrls: [
        "https://picsum.photos/seed/p9/200/200",
        "https://picsum.photos/seed/p10/200/200",
        "https://picsum.photos/seed/p11/200/200",
        "https://picsum.photos/seed/p12/200/200",
      ],
    },
  ],
  members: [
    { id: "u1", name: "You", initials: "YO", lastVlogged: "3 days ago", streak: 2 },
    { id: "u2", name: "Emir", initials: "EM", lastVlogged: "Today", streak: 5 },
    { id: "u3", name: "Sara", initials: "SA", lastVlogged: "Yesterday", streak: 4 },
    { id: "u4", name: "Ali", initials: "AL", lastVlogged: "2 days ago", streak: 3 },
    { id: "u5", name: "Mina", initials: "MI", lastVlogged: "3 days ago", streak: 1 },
  ],
  inviteLink: "https://dayroll.app/join/the-apartment",
  notifications: {
    todaysTurn: true,
    someoneUploads: true,
    dailyRecap: false,
    pushEnabled: true,
  },
  timezone: "America/New_York",
};

/** Vlogger variant for demo — flip in dev tools later */
export const MOCK_VLOGGER_MODE: MockAppState = {
  ...MOCK_APP,
  isCurrentUserVlogger: true,
  todayVlogger: { id: "u1", name: "You", initials: "YO", hoursRemaining: 12 },
  hasStartedToday: false,
  todayClips: [],
  watchers: [],
  reactors: [],
};