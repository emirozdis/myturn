import { AchievementConfig } from "./achievement-overlay";
import { Share } from "lucide-react";

export const ACHIEVEMENT_MOCKS: AchievementConfig[] = [
  {
    id: "3-day-streak",
    particles: "sparks",
    image: {
      src: "/assets/icons/fire.png",
      value: "3",
    },
    mainContent: {
      title: "Day Streak!",
      highlight: "Streak!",
      description: "You showed up 3 days in a row.\nKeep it going!",
    },
    modules: [
      {
        type: "calendar",
        days: [true, true, true, false, false, false, false],
      },
    ],
    primaryAction: { label: "Nice!" },
    secondaryAction: { label: "Share", icon: <Share size={16} /> },
  },
  {
    id: "5-day-record",
    particles: "confetti",
    topContent: {
      title: "New Record!",
      highlight: "Record!",
      subtitle: "5 Day Streak",
    },
    image: {
      src: "/assets/icons/fire.png",
      value: "5",
    },
    mainContent: {
      description: "You're on fire! 🔥\nConsistency is your superpower.",
    },
    primaryAction: { label: "Nice!" },
    secondaryAction: { label: "Share", icon: <Share size={16} /> },
  },
  {
    id: "level-2-unlock",
    particles: "sparks",
    image: {
      src: "/assets/icons/medal.png",
      value: "2",
    },
    mainContent: {
      title: "Level Up!",
      highlight: "Up!",
      description: "You're now Level 2",
    },
    modules: [
      {
        type: "progress-bar",
        label: "Progress to Level 3",
        current: 120,
        max: 500,
        xpLabel: "XP",
      },
      {
        type: "rewards",
        unlocked: {
          title: "Streak Saver",
          desc: "Protect your streak once\nin the next 7 days.",
        },
        next: {
          title: "Level 3",
          desc: "Keep going to unlock\nnew rewards!",
        },
      },
    ],
    primaryAction: { label: "Awesome!" },
    secondaryAction: { label: "Share", icon: <Share size={16} /> },
  },
  {
    id: "10-day-streak",
    particles: "confetti",
    image: {
      src: "/assets/icons/fire.png",
      value: "10",
    },
    mainContent: {
      title: "10 Day Streak!",
      highlight: "Streak!",
      description: "Amazing! You've vlogged\n10 days in a row.",
    },
    modules: [
      {
        type: "stats",
        items: [
          { icon: "flame", label: "Longest Streak", value: "10 days" },
          { icon: "camera", label: "Total Vlogs", value: "18" },
        ],
      },
    ],
    primaryAction: { label: "Let's go!" },
    secondaryAction: { label: "Share", icon: <Share size={16} /> },
  },
  {
    id: "first-vlog",
    particles: "sparks",
    image: {
      src: "/assets/icons/medal.png",
    },
    mainContent: {
      title: "Achievement Unlocked!",
      highlight: "Unlocked!",
      subtitle: "First Vlog",
      description: "You vlogged for the first time.\nYour journey has begun!",
    },
    primaryAction: { label: "View Profile" },
    secondaryAction: { label: "Share", icon: <Share size={16} /> },
  },
  {
    id: "level-5-master",
    particles: "confetti",
    topContent: {
      title: "Milestone Reached!",
      highlight: "Reached!",
    },
    image: {
      src: "/assets/icons/crown.png",
      value: "5",
    },
    mainContent: {
      title: "Level 5 Master",
      highlight: "Master",
      description: "Incredible dedication. You've reached Level 5 and unlocked exclusive group themes.",
    },
    modules: [
      {
        type: "progress-bar",
        label: "Progress to Level 6",
        current: 50,
        max: 1000,
        xpLabel: "XP",
      },
      {
        type: "rewards",
        unlocked: {
          title: "Custom Group Themes",
          desc: "Change the colors of your group.",
        },
      },
    ],
    primaryAction: { label: "Claim Rewards" },
    secondaryAction: { label: "Share", icon: <Share size={16} /> },
  },
  {
    id: "early-bird",
    particles: "sparks",
    image: {
      src: "/assets/icons/sun.png",
    },
    mainContent: {
      title: "Early Bird",
      highlight: "Early",
      subtitle: "Vlogged before 8 AM",
      description: "The early bird gets the worm... or the best vlog! Great start to the day.",
    },
    modules: [
      {
        type: "stats",
        items: [
          { icon: "target", label: "Early Vlogs", value: "1x" },
        ],
      },
    ],
    primaryAction: { label: "Awesome!" },
    secondaryAction: { label: "Share", icon: <Share size={16} /> },
  },
  {
    id: "weekend-warrior",
    particles: "sparks",
    image: {
      src: "/assets/icons/rocket.png",
    },
    mainContent: {
      title: "Weekend Warrior",
      highlight: "Warrior",
      subtitle: "Active on the Weekend",
      description: "Weekends are for relaxing, but you still found time to share your day!",
    },
    primaryAction: { label: "Let's Go!" },
    secondaryAction: { label: "Share", icon: <Share size={16} /> },
  },
  {
    id: "group-mvp",
    particles: "confetti",
    image: {
      src: "/assets/icons/trophy.png",
    },
    mainContent: {
      title: "Group MVP",
      highlight: "MVP",
      subtitle: "Longest Streak in Group",
      description: "You're carrying the team! You currently hold the longest streak in your group.",
    },
    modules: [
      {
        type: "stats",
        items: [
          { icon: "flame", label: "Your Streak", value: "14 days" },
        ],
      },
    ],
    primaryAction: { label: "Keep it up!" },
    secondaryAction: { label: "Share", icon: <Share size={16} /> },
  },
  {
    id: "social-butterfly",
    particles: "sparks",
    image: {
      src: "/assets/icons/gem.png",
    },
    mainContent: {
      title: "Social Butterfly",
      highlight: "Butterfly",
      subtitle: "Reacted 100 Times",
      description: "You love sharing the love! Thanks for keeping your friends motivated.",
    },
    primaryAction: { label: "Spread more love" },
    secondaryAction: { label: "Share", icon: <Share size={16} /> },
  },
  {
    id: "perfect-month",
    particles: "confetti",
    image: {
      src: "/assets/icons/shield.png",
      value: "30",
    },
    mainContent: {
      title: "Perfect Month",
      highlight: "Perfect",
      subtitle: "30 Days of Vlogging",
      description: "An entire month of consistent vlogging. You are a true legend.",
    },
    modules: [
      {
        type: "stats",
        items: [
          { icon: "camera", label: "Total Vlogs", value: "30" },
        ],
      },
    ],
    primaryAction: { label: "Legendary!" },
    secondaryAction: { label: "Share", icon: <Share size={16} /> },
  },
  {
    id: "progress-dashboard",
    topContent: {
      title: "Your Progress",
    },
    modules: [
      {
        type: "progress-header",
        currentStreak: "7 days",
        bestStreak: "10 days",
        totalVlogs: "18",
      },
      {
        type: "calendar",
        title: "Streak Calendar",
        subtitle: "Tap on a day to see your vlog",
        days: [true, true, true, true, true, true, false],
      },
      {
        type: "milestones",
        items: [
          { title: "3 Day Streak", status: "achieved" },
          { title: "7 Day Streak", status: "achieved" },
          { title: "10 Day Streak", status: "achieved" },
          { title: "30 Day Streak", status: "locked" },
        ],
      },
    ],
    primaryAction: { label: "Keep Vlogging!" },
  },
];