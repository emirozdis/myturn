// ./scripts/fix-clips.js
require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Initializing queue reset for video vlogs from yesterday and the day before...");

  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  twoDaysAgo.setHours(0, 0, 0, 0);

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
  console.log(
    "The background transcoder cron job will automatically pick these up and process them."
  );
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