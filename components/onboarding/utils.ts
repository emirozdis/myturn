export const ease = {
  spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
  out: "cubic-bezier(0, 0, 0.2, 1)",
};

export function sendTestNotification() {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission !== "granted") return false;
  new Notification("dayroll", {
    body: "Today is your turn 🎥",
    tag: "dayroll-test",
  });
  return true;
}
