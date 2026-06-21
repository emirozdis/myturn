// ./scripts/fix-clips.js
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("Initializing queue reset for video vlogs from yesterday and the day before...");

  // Calculate the start of 2 days ago (yesterday and 1 day before yesterday)
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  twoDaysAgo.setHours(0, 0, 0, 0); // Reset hours to catch the full timeline

  console.log(`Targeting clips recorded on or after: ${twoDaysAgo.toISOString()}`);

  const result = await prisma.clip.updateMany({
    where: {
      recordedAt: {
        gte: twoDaysAgo,
      },
      transcodeStatus: {
        in: ["COMPLETED", "FAILED", "FAILED_PERMANENTLY", "PROCESSING"],
      },
    },
    data: {
      transcodeStatus: "PENDING",
      transcodeAttempts: 0,
    },
  });

  console.log(`\n✅ Success! Marked ${result.count} clips as 'PENDING'.`);
  console.log("The background transcoder cron job will automatically pick these up and process them using the new timeline flags.");
}

main()
  .catch((e) => {
    console.error("❌ Fatal Error executing script:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log("Database connection closed.");
  });