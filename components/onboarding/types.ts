export const STEPS = [
  "splash",
  "install_app",
  "welcome",
  "how_it_works",
  "create_or_join",
  "setup_name",
  "permissions_notifications",
  "permissions_camera",
  "permissions_gallery",
  "all_set",
] as const;

export type StepName = (typeof STEPS)[number];
export type FlowType = "new" | "login" | null;
export type GoFn = (n: number) => void;