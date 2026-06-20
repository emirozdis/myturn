import { AchievementConfig } from "./achievement-overlay";
import { Share } from "lucide-react";

export const ACHIEVEMENT_MOCKS: AchievementConfig[] = [
  // --- ACCOUNTABILITY CATEGORY ---
  {
    id: "the-tribute",
    particles: "sparks",
    image: {
      src: "/assets/icons/heart.png",
      value: "1st",
    },
    mainContent: {
      title: "The Tribute",
      highlight: "Tribute",
      subtitle: "First Time Volunteer",
      description: "You stepped up and volunteered to be the vlogger for the day! Enjoy your 1.5x XP boost.",
    },
    primaryAction: { label: "Awesome!" },
    secondaryAction: { label: "Share", icon: <Share size={16} /> },
  },
  {
    id: "the-altruist",
    particles: "confetti",
    image: {
      src: "/assets/icons/heart.png",
      value: "5x",
    },
    mainContent: {
      title: "The Altruist",
      highlight: "Altruist",
      subtitle: "5x Volunteered",
      description: "Always ready to take one for the team! You have completed 5 volunteered assignments.",
    },
    primaryAction: { label: "Legendary!" },
    secondaryAction: { label: "Share", icon: <Share size={16} /> },
  },
  {
    id: "the-savior",
    particles: "confetti",
    image: {
      src: "/assets/icons/shield.png",
      value: "SAV",
    },
    mainContent: {
      title: "The Savior",
      highlight: "Savior",
      subtitle: "Saved Group Streak",
      description: "You posted within the final 30 minutes of the countdown, saving a group streak of 10+ days!",
    },
    primaryAction: { label: "Awesome!" },
    secondaryAction: { label: "Share", icon: <Share size={16} /> },
  },
  {
    id: "zero-hour",
    particles: "sparks",
    image: {
      src: "/assets/icons/rocket.png",
      value: "FAST",
    },
    mainContent: {
      title: "Zero Hour",
      highlight: "Zero",
      subtitle: "Quick Reaction Trigger",
      description: "You uploaded your vlog within 30 minutes of today's turn selection!",
    },
    primaryAction: { label: "Awesome!" },
    secondaryAction: { label: "Share", icon: <Share size={16} /> },
  },
  {
    id: "on-duty",
    particles: "sparks",
    image: {
      src: "/assets/icons/fire.png",
      value: "5x",
    },
    mainContent: {
      title: "On Duty",
      highlight: "Duty",
      subtitle: "5x Completion Streak",
      description: "You completed 5 assigned turns in a row without breaking the chain!",
    },
    primaryAction: { label: "Nice!" },
    secondaryAction: { label: "Share", icon: <Share size={16} /> },
  },
  {
    id: "the-guardian",
    particles: "confetti",
    image: {
      src: "/assets/icons/shield.png",
      value: "15x",
    },
    mainContent: {
      title: "The Guardian",
      highlight: "Guardian",
      subtitle: "15x Completion Milestone",
      description: "Absolute reliability! You have completed 15 assigned turns consecutively.",
    },
    primaryAction: { label: "Awesome!" },
    secondaryAction: { label: "Share", icon: <Share size={16} /> },
  },

  // --- CONNECTION CATEGORY ---
  {
    id: "first-responder",
    particles: "sparks",
    image: {
      src: "/assets/icons/sun.png",
      value: "1st",
    },
    mainContent: {
      title: "First Responder",
      highlight: "First",
      subtitle: "Early Spectator",
      description: "You were the first person to view and react to today’s vlogger 10 times!",
    },
    primaryAction: { label: "Nice!" },
    secondaryAction: { label: "Share", icon: <Share size={16} /> },
  },
  {
    id: "directors-commentary",
    particles: "sparks",
    image: {
      src: "/assets/icons/medal.png",
      value: "50c",
    },
    mainContent: {
      title: "Director's Commentary",
      highlight: "Commentary",
      subtitle: "50 Comments Posted",
      description: "Active conversationalist! You left 50 thoughts and feedback on your friends' daily updates.",
    },
    primaryAction: { label: "Let's Go!" },
    secondaryAction: { label: "Share", icon: <Share size={16} /> },
  },
  {
    id: "deep-cut",
    particles: "sparks",
    image: {
      src: "/assets/icons/gem.png",
      value: "7d",
    },
    mainContent: {
      title: "Deep Cut",
      highlight: "Cut",
      subtitle: "Watch Streak Complete",
      description: "You watched every single clip posted in your group for a continuous 7-day period!",
    },
    primaryAction: { label: "Awesome!" },
    secondaryAction: { label: "Share", icon: <Share size={16} /> },
  },
  {
    id: "hype-man",
    particles: "confetti",
    image: {
      src: "/assets/icons/trophy.png",
      value: "100",
    },
    mainContent: {
      title: "Hype Man",
      highlight: "Hype",
      subtitle: "100 Reactions Posted",
      description: "You love sharing the love! Thanks for sending 100 positive reactions to keep your friends motivated.",
    },
    primaryAction: { label: "Keep it up!" },
    secondaryAction: { label: "Share", icon: <Share size={16} /> },
  },

  // --- RAW & REAL (HIDDEN) CATEGORY ---
  {
    id: "night-owl",
    particles: "sparks",
    image: {
      src: "/assets/icons/sun.png",
      value: "🌙",
    },
    mainContent: {
      title: "Night Owl",
      highlight: "Owl",
      subtitle: "Late Night Update",
      description: "Shhh... you shared a quiet moment with your friends between 1:00 AM and 5:00 AM local time.",
    },
    primaryAction: { label: "Awesome!" },
    secondaryAction: { label: "Share", icon: <Share size={16} /> },
  },
  {
    id: "globetrotter",
    particles: "sparks",
    image: {
      src: "/assets/icons/rocket.png",
      value: "✈️",
    },
    mainContent: {
      title: "Globetrotter",
      highlight: "Globetrotter",
      subtitle: "Far From Home",
      description: "You shared an update from a location more than 100 miles away from your group's home base!",
    },
    primaryAction: { label: "Let's Go!" },
    secondaryAction: { label: "Share", icon: <Share size={16} /> },
  },
  {
    id: "the-collector",
    particles: "sparks",
    image: {
      src: "/assets/icons/gem.png",
      value: "ALL",
    },
    mainContent: {
      title: "The Collector",
      highlight: "Collector",
      subtitle: "All Prompt Completion",
      description: "Perfect coverage! You have completed every single category prompt at least once.",
    },
    primaryAction: { label: "Awesome!" },
    secondaryAction: { label: "Share", icon: <Share size={16} /> },
  },
  {
    id: "a-day-in-the-life",
    particles: "sparks",
    image: {
      src: "/assets/icons/medal.png",
      value: "60s",
    },
    mainContent: {
      title: "A Day in the Life",
      highlight: "Day",
      subtitle: "Maximum Footage Duration",
      description: "You posted a full-length 60-second vlog update capturing 4+ segments of your day!",
    },
    primaryAction: { label: "Nice!" },
    secondaryAction: { label: "Share", icon: <Share size={16} /> },
  },

  // --- LONG-HAUL CATEGORY ---
  {
    id: "silver-screen",
    particles: "sparks",
    image: {
      src: "/assets/icons/trophy.png",
      value: "50",
    },
    mainContent: {
      title: "Silver Screen",
      highlight: "Screen",
      subtitle: "50 Vlogs Milestone",
      description: "A huge milestone! You have successfully shared 50 raw updates with your close friends.",
    },
    primaryAction: { label: "Awesome!" },
    secondaryAction: { label: "Share", icon: <Share size={16} /> },
  },
  {
    id: "gold-standard",
    particles: "confetti",
    image: {
      src: "/assets/icons/crown.png",
      value: "150",
    },
    mainContent: {
      title: "Gold Standard",
      highlight: "Gold",
      subtitle: "150 Vlogs Legend",
      description: "Legendary status! You have successfully posted 150 daily updates on MyTurn.",
    },
    primaryAction: { label: "Legendary!" },
    secondaryAction: { label: "Share", icon: <Share size={16} /> },
  },
  {
    id: "half-a-century",
    particles: "confetti",
    image: {
      src: "/assets/icons/fire.png",
      value: "50d",
    },
    mainContent: {
      title: "Half a Century",
      highlight: "Century",
      subtitle: "50-Day Group Streak",
      description: "Shared glory! You helped carry your close friends group to a massive 50-day streak.",
    },
    primaryAction: { label: "Claim Rewards" },
    secondaryAction: { label: "Share", icon: <Share size={16} /> },
  },
  {
    id: "the-circle-of-life",
    particles: "confetti",
    image: {
      src: "/assets/icons/crown.png",
      value: "365",
    },
    mainContent: {
      title: "The Circle of Life",
      highlight: "Life",
      subtitle: "1 Year Anniversary",
      description: "365 days of close-friends memories shared. You are an absolute pillar of this circle.",
    },
    primaryAction: { label: "Nice!" },
    secondaryAction: { label: "Share", icon: <Share size={16} /> },
  },
];