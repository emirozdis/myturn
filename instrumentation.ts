export async function register() {
  // Only boot the cron jobs on the Node.js server environment (ignores Edge runtime)
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startCronJobs } = await import("./lib/cron");
    startCronJobs();
  }
}