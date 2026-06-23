export const SOCIAL_TABS = ["friends", "groups", "requests", "discover"] as const;
export type SocialTab = (typeof SOCIAL_TABS)[number];
