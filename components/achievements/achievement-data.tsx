import { AchievementConfig } from "./achievement-overlay";
import { Share } from "lucide-react";
import { getTranslation, Locale } from "@/lib/i18n";

export const getAchievementMocks = (locale: Locale): AchievementConfig[] => [
  // --- ACCOUNTABILITY CATEGORY ---
  {
    id: "the-tribute",
    particles: "sparks",
    image: {
      src: "/assets/icons/heart.png",
      value: "1st",
    },
    mainContent: {
      title: getTranslation(locale, "achievements.the-tribute.title"),
      highlight: getTranslation(locale, "achievements.the-tribute.highlight"),
      subtitle: getTranslation(locale, "achievements.the-tribute.subtitle"),
      description: getTranslation(locale, "achievements.the-tribute.description"),
    },
    primaryAction: { label: getTranslation(locale, "achievements.the-tribute.primaryAction") },
    secondaryAction: { label: getTranslation(locale, "achievements.the-tribute.secondaryAction"), icon: <Share size={16} /> },
  },
  {
    id: "the-altruist",
    particles: "confetti",
    image: {
      src: "/assets/icons/heart.png",
      value: "5x",
    },
    mainContent: {
      title: getTranslation(locale, "achievements.the-altruist.title"),
      highlight: getTranslation(locale, "achievements.the-altruist.highlight"),
      subtitle: getTranslation(locale, "achievements.the-altruist.subtitle"),
      description: getTranslation(locale, "achievements.the-altruist.description"),
    },
    primaryAction: { label: getTranslation(locale, "achievements.the-altruist.primaryAction") },
    secondaryAction: { label: getTranslation(locale, "achievements.the-altruist.secondaryAction"), icon: <Share size={16} /> },
  },
  {
    id: "the-savior",
    particles: "confetti",
    image: {
      src: "/assets/icons/shield.png",
      value: "SAV",
    },
    mainContent: {
      title: getTranslation(locale, "achievements.the-savior.title"),
      highlight: getTranslation(locale, "achievements.the-savior.highlight"),
      subtitle: getTranslation(locale, "achievements.the-savior.subtitle"),
      description: getTranslation(locale, "achievements.the-savior.description"),
    },
    primaryAction: { label: getTranslation(locale, "achievements.the-savior.primaryAction") },
    secondaryAction: { label: getTranslation(locale, "achievements.the-savior.secondaryAction"), icon: <Share size={16} /> },
  },
  {
    id: "zero-hour",
    particles: "sparks",
    image: {
      src: "/assets/icons/rocket.png",
      value: "FAST",
    },
    mainContent: {
      title: getTranslation(locale, "achievements.zero-hour.title"),
      highlight: getTranslation(locale, "achievements.zero-hour.highlight"),
      subtitle: getTranslation(locale, "achievements.zero-hour.subtitle"),
      description: getTranslation(locale, "achievements.zero-hour.description"),
    },
    primaryAction: { label: getTranslation(locale, "achievements.zero-hour.primaryAction") },
    secondaryAction: { label: getTranslation(locale, "achievements.zero-hour.secondaryAction"), icon: <Share size={16} /> },
  },
  {
    id: "on-duty",
    particles: "sparks",
    image: {
      src: "/assets/icons/fire.png",
      value: "5x",
    },
    mainContent: {
      title: getTranslation(locale, "achievements.on-duty.title"),
      highlight: getTranslation(locale, "achievements.on-duty.highlight"),
      subtitle: getTranslation(locale, "achievements.on-duty.subtitle"),
      description: getTranslation(locale, "achievements.on-duty.description"),
    },
    primaryAction: { label: getTranslation(locale, "achievements.on-duty.primaryAction") },
    secondaryAction: { label: getTranslation(locale, "achievements.on-duty.secondaryAction"), icon: <Share size={16} /> },
  },
  {
    id: "the-guardian",
    particles: "confetti",
    image: {
      src: "/assets/icons/shield.png",
      value: "15x",
    },
    mainContent: {
      title: getTranslation(locale, "achievements.the-guardian.title"),
      highlight: getTranslation(locale, "achievements.the-guardian.highlight"),
      subtitle: getTranslation(locale, "achievements.the-guardian.subtitle"),
      description: getTranslation(locale, "achievements.the-guardian.description"),
    },
    primaryAction: { label: getTranslation(locale, "achievements.the-guardian.primaryAction") },
    secondaryAction: { label: getTranslation(locale, "achievements.the-guardian.secondaryAction"), icon: <Share size={16} /> },
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
      title: getTranslation(locale, "achievements.first-responder.title"),
      highlight: getTranslation(locale, "achievements.first-responder.highlight"),
      subtitle: getTranslation(locale, "achievements.first-responder.subtitle"),
      description: getTranslation(locale, "achievements.first-responder.description"),
    },
    primaryAction: { label: getTranslation(locale, "achievements.first-responder.primaryAction") },
    secondaryAction: { label: getTranslation(locale, "achievements.first-responder.secondaryAction"), icon: <Share size={16} /> },
  },
  {
    id: "directors-commentary",
    particles: "sparks",
    image: {
      src: "/assets/icons/medal.png",
      value: "50c",
    },
    mainContent: {
      title: getTranslation(locale, "achievements.directors-commentary.title"),
      highlight: getTranslation(locale, "achievements.directors-commentary.highlight"),
      subtitle: getTranslation(locale, "achievements.directors-commentary.subtitle"),
      description: getTranslation(locale, "achievements.directors-commentary.description"),
    },
    primaryAction: { label: getTranslation(locale, "achievements.directors-commentary.primaryAction") },
    secondaryAction: { label: getTranslation(locale, "achievements.directors-commentary.secondaryAction"), icon: <Share size={16} /> },
  },
  {
    id: "deep-cut",
    particles: "sparks",
    image: {
      src: "/assets/icons/gem.png",
      value: "7d",
    },
    mainContent: {
      title: getTranslation(locale, "achievements.deep-cut.title"),
      highlight: getTranslation(locale, "achievements.deep-cut.highlight"),
      subtitle: getTranslation(locale, "achievements.deep-cut.subtitle"),
      description: getTranslation(locale, "achievements.deep-cut.description"),
    },
    primaryAction: { label: getTranslation(locale, "achievements.deep-cut.primaryAction") },
    secondaryAction: { label: getTranslation(locale, "achievements.deep-cut.secondaryAction"), icon: <Share size={16} /> },
  },
  {
    id: "hype-man",
    particles: "confetti",
    image: {
      src: "/assets/icons/trophy.png",
      value: "100",
    },
    mainContent: {
      title: getTranslation(locale, "achievements.hype-man.title"),
      highlight: getTranslation(locale, "achievements.hype-man.highlight"),
      subtitle: getTranslation(locale, "achievements.hype-man.subtitle"),
      description: getTranslation(locale, "achievements.hype-man.description"),
    },
    primaryAction: { label: getTranslation(locale, "achievements.hype-man.primaryAction") },
    secondaryAction: { label: getTranslation(locale, "achievements.hype-man.secondaryAction"), icon: <Share size={16} /> },
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
      title: getTranslation(locale, "achievements.night-owl.title"),
      highlight: getTranslation(locale, "achievements.night-owl.highlight"),
      subtitle: getTranslation(locale, "achievements.night-owl.subtitle"),
      description: getTranslation(locale, "achievements.night-owl.description"),
    },
    primaryAction: { label: getTranslation(locale, "achievements.night-owl.primaryAction") },
    secondaryAction: { label: getTranslation(locale, "achievements.night-owl.secondaryAction"), icon: <Share size={16} /> },
  },
  {
    id: "globetrotter",
    particles: "sparks",
    image: {
      src: "/assets/icons/rocket.png",
      value: "✈️",
    },
    mainContent: {
      title: getTranslation(locale, "achievements.globetrotter.title"),
      highlight: getTranslation(locale, "achievements.globetrotter.highlight"),
      subtitle: getTranslation(locale, "achievements.globetrotter.subtitle"),
      description: getTranslation(locale, "achievements.globetrotter.description"),
    },
    primaryAction: { label: getTranslation(locale, "achievements.globetrotter.primaryAction") },
    secondaryAction: { label: getTranslation(locale, "achievements.globetrotter.secondaryAction"), icon: <Share size={16} /> },
  },
  {
    id: "the-collector",
    particles: "sparks",
    image: {
      src: "/assets/icons/gem.png",
      value: "ALL",
    },
    mainContent: {
      title: getTranslation(locale, "achievements.the-collector.title"),
      highlight: getTranslation(locale, "achievements.the-collector.highlight"),
      subtitle: getTranslation(locale, "achievements.the-collector.subtitle"),
      description: getTranslation(locale, "achievements.the-collector.description"),
    },
    primaryAction: { label: getTranslation(locale, "achievements.the-collector.primaryAction") },
    secondaryAction: { label: getTranslation(locale, "achievements.the-collector.secondaryAction"), icon: <Share size={16} /> },
  },
  {
    id: "a-day-in-the-life",
    particles: "sparks",
    image: {
      src: "/assets/icons/medal.png",
      value: "60s",
    },
    mainContent: {
      title: getTranslation(locale, "achievements.a-day-in-the-life.title"),
      highlight: getTranslation(locale, "achievements.a-day-in-the-life.highlight"),
      subtitle: getTranslation(locale, "achievements.a-day-in-the-life.subtitle"),
      description: getTranslation(locale, "achievements.a-day-in-the-life.description"),
    },
    primaryAction: { label: getTranslation(locale, "achievements.a-day-in-the-life.primaryAction") },
    secondaryAction: { label: getTranslation(locale, "achievements.a-day-in-the-life.secondaryAction"), icon: <Share size={16} /> },
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
      title: getTranslation(locale, "achievements.silver-screen.title"),
      highlight: getTranslation(locale, "achievements.silver-screen.highlight"),
      subtitle: getTranslation(locale, "achievements.silver-screen.subtitle"),
      description: getTranslation(locale, "achievements.silver-screen.description"),
    },
    primaryAction: { label: getTranslation(locale, "achievements.silver-screen.primaryAction") },
    secondaryAction: { label: getTranslation(locale, "achievements.silver-screen.secondaryAction"), icon: <Share size={16} /> },
  },
  {
    id: "gold-standard",
    particles: "confetti",
    image: {
      src: "/assets/icons/crown.png",
      value: "150",
    },
    mainContent: {
      title: getTranslation(locale, "achievements.gold-standard.title"),
      highlight: getTranslation(locale, "achievements.gold-standard.highlight"),
      subtitle: getTranslation(locale, "achievements.gold-standard.subtitle"),
      description: getTranslation(locale, "achievements.gold-standard.description"),
    },
    primaryAction: { label: getTranslation(locale, "achievements.gold-standard.primaryAction") },
    secondaryAction: { label: getTranslation(locale, "achievements.gold-standard.secondaryAction"), icon: <Share size={16} /> },
  },
  {
    id: "half-a-century",
    particles: "confetti",
    image: {
      src: "/assets/icons/fire.png",
      value: "50d",
    },
    mainContent: {
      title: getTranslation(locale, "achievements.half-a-century.title"),
      highlight: getTranslation(locale, "achievements.half-a-century.highlight"),
      subtitle: getTranslation(locale, "achievements.half-a-century.subtitle"),
      description: getTranslation(locale, "achievements.half-a-century.description"),
    },
    primaryAction: { label: getTranslation(locale, "achievements.half-a-century.primaryAction") },
    secondaryAction: { label: getTranslation(locale, "achievements.half-a-century.secondaryAction"), icon: <Share size={16} /> },
  },
  {
    id: "the-circle-of-life",
    particles: "confetti",
    image: {
      src: "/assets/icons/crown.png",
      value: "365",
    },
    mainContent: {
      title: getTranslation(locale, "achievements.the-circle-of-life.title"),
      highlight: getTranslation(locale, "achievements.the-circle-of-life.highlight"),
      subtitle: getTranslation(locale, "achievements.the-circle-of-life.subtitle"),
      description: getTranslation(locale, "achievements.the-circle-of-life.description"),
    },
    primaryAction: { label: getTranslation(locale, "achievements.the-circle-of-life.primaryAction") },
    secondaryAction: { label: getTranslation(locale, "achievements.the-circle-of-life.secondaryAction"), icon: <Share size={16} /> },
  },
];

// Fallback constant for backward compatibility
export const ACHIEVEMENT_MOCKS = getAchievementMocks("en");