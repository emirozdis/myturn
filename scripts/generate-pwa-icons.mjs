/** Regenerate PNG icons from public/icons/icon.svg — run: npx sharp-cli ... or npm run generate:icons */
import sharp from "sharp";
import { readFileSync } from "fs";

const svg = readFileSync("public/icons/icon.svg");
for (const size of [192, 512]) {
  await sharp(svg).resize(size, size).png().toFile(`public/icon-${size}x${size}.png`);
  console.log(`wrote public/icon-${size}x${size}.png`);
}
