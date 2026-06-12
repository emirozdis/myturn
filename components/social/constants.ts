export const SOCIAL_TABS = ["Friends", "Groups", "Requests", "Discover"] as const;
export type SocialTab = (typeof SOCIAL_TABS)[number];
