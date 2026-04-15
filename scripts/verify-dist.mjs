import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT_DIR = process.cwd();
const DIST_DIR = path.join(ROOT_DIR, "dist");
const REQUIRED_FILES = [
  "sprite.json",
  "sprite.png",
  "sprite@2x.json",
  "sprite@2x.png",
  "index.html",
];

async function assertFileExists(filePath) {
  await fs.access(filePath);
}

async function main() {
  for (const fileName of REQUIRED_FILES) {
    await assertFileExists(path.join(DIST_DIR, fileName));
  }

  const spriteJson = JSON.parse(await fs.readFile(path.join(DIST_DIR, "sprite.json"), "utf8"));
  const sprite2xJson = JSON.parse(await fs.readFile(path.join(DIST_DIR, "sprite@2x.json"), "utf8"));
  const iconNames = Object.keys(spriteJson);

  if (iconNames.length === 0) {
    throw new Error("sprite.json does not contain any icons.");
  }

  for (const iconName of iconNames) {
    if (!(iconName in sprite2xJson)) {
      throw new Error(`Missing ${iconName} in sprite@2x.json.`);
    }

    const normal = spriteJson[iconName];
    const retina = sprite2xJson[iconName];

    if (retina.width !== normal.width * 2 || retina.height !== normal.height * 2) {
      throw new Error(`Retina dimensions are incorrect for ${iconName}.`);
    }

    if (retina.x !== normal.x * 2 || retina.y !== normal.y * 2) {
      throw new Error(`Retina coordinates are incorrect for ${iconName}.`);
    }
  }

  console.log(`Verified dist output for ${iconNames.length} icons: ${iconNames.join(", ")}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
