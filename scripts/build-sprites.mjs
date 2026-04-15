import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT_DIR = process.cwd();
const ICONS_DIR = path.join(ROOT_DIR, "icons");
const DIST_DIR = path.join(ROOT_DIR, "dist");
const CELL_SIZE = 32;
const GAP = 2;
const MAX_SHEET_WIDTH = 256;

async function ensureDirectory(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function listSvgFiles(dirPath) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".svg"))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));
}

async function loadIcons() {
  const fileNames = await listSvgFiles(ICONS_DIR);

  if (fileNames.length === 0) {
    throw new Error(`No SVG files found in ${ICONS_DIR}`);
  }

  return Promise.all(
    fileNames.map(async (fileName) => {
      const fullPath = path.join(ICONS_DIR, fileName);
      const buffer = await fs.readFile(fullPath);
      const metadata = await sharp(buffer).metadata();

      if (!metadata.width || !metadata.height) {
        throw new Error(`Unable to determine dimensions for ${fileName}`);
      }

      if (metadata.width > CELL_SIZE || metadata.height > CELL_SIZE) {
        throw new Error(
          `${fileName} is ${metadata.width}x${metadata.height}. Icons must fit within ${CELL_SIZE}x${CELL_SIZE}.`,
        );
      }

      return {
        name: path.basename(fileName, ".svg"),
        fileName,
        buffer,
        width: metadata.width,
        height: metadata.height,
      };
    }),
  );
}

function layoutIcons(icons) {
  const placements = [];
  let cursorX = 0;
  let cursorY = 0;
  let rowHeight = 0;
  let sheetWidth = 0;

  for (const icon of icons) {
    if (cursorX > 0 && cursorX + icon.width > MAX_SHEET_WIDTH) {
      cursorX = 0;
      cursorY += rowHeight + GAP;
      rowHeight = 0;
    }

    placements.push({
      ...icon,
      x: cursorX,
      y: cursorY,
    });

    cursorX += icon.width + GAP;
    rowHeight = Math.max(rowHeight, icon.height);
    sheetWidth = Math.max(sheetWidth, cursorX - GAP);
  }

  const sheetHeight = cursorY + rowHeight;

  return {
    placements,
    width: sheetWidth,
    height: sheetHeight,
  };
}

function createSpriteMetadata(placements, pixelRatio) {
  return Object.fromEntries(
    placements.map((icon) => [
      icon.name,
      {
        width: icon.width * pixelRatio,
        height: icon.height * pixelRatio,
        x: icon.x * pixelRatio,
        y: icon.y * pixelRatio,
        pixelRatio,
        visible: true,
      },
    ]),
  );
}

async function renderSpriteSheet(layout, pixelRatio) {
  const width = Math.max(layout.width * pixelRatio, 1);
  const height = Math.max(layout.height * pixelRatio, 1);

  const composites = await Promise.all(
    layout.placements.map(async (icon) => {
      const renderedBuffer = await sharp(icon.buffer, {
        density: 72 * pixelRatio,
      })
        .resize({
          width: icon.width * pixelRatio,
          height: icon.height * pixelRatio,
          fit: "fill",
        })
        .png()
        .toBuffer();

      return {
        input: renderedBuffer,
        left: icon.x * pixelRatio,
        top: icon.y * pixelRatio,
      };
    }),
  );

  return sharp({
    create: {
      width,
      height,
      channels: 4,
      background: {
        r: 0,
        g: 0,
        b: 0,
        alpha: 0,
      },
    },
  })
    .composite(composites)
    .png()
    .toBuffer();
}

function createPreviewHtml(iconNames) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>GoodData Sprite Preview</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f5f7fb;
        --card: #ffffff;
        --text: #18212f;
        --muted: #5d6b82;
        --line: #d7deea;
        --accent: #0f766e;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        font-family: ui-sans-serif, system-ui, sans-serif;
        background:
          radial-gradient(circle at top right, rgba(15, 118, 110, 0.12), transparent 30%),
          linear-gradient(180deg, #fcfdff 0%, var(--bg) 100%);
        color: var(--text);
      }

      main {
        max-width: 960px;
        margin: 0 auto;
        padding: 32px 20px 48px;
      }

      h1 {
        margin: 0 0 12px;
        font-size: 2rem;
      }

      p {
        color: var(--muted);
        line-height: 1.6;
      }

      code {
        padding: 0.15rem 0.35rem;
        border-radius: 0.35rem;
        background: #eef3f8;
      }

      .panel {
        background: var(--card);
        border: 1px solid var(--line);
        border-radius: 16px;
        padding: 20px;
        box-shadow: 0 10px 30px rgba(24, 33, 47, 0.06);
      }

      .grid {
        display: grid;
        gap: 16px;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        margin-top: 24px;
      }

      .icon-card {
        padding: 16px;
        border: 1px solid var(--line);
        border-radius: 14px;
        background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
      }

      .icon-preview {
        width: 64px;
        height: 64px;
        display: grid;
        place-items: center;
        margin-bottom: 12px;
        border-radius: 12px;
        background:
          linear-gradient(45deg, #edf2f7 25%, transparent 25%),
          linear-gradient(-45deg, #edf2f7 25%, transparent 25%),
          linear-gradient(45deg, transparent 75%, #edf2f7 75%),
          linear-gradient(-45deg, transparent 75%, #edf2f7 75%);
        background-size: 16px 16px;
        background-position: 0 0, 0 8px, 8px -8px, -8px 0;
      }

      .icon-preview img {
        image-rendering: auto;
      }

      .icon-name {
        margin: 0 0 6px;
        font-size: 1rem;
      }

      .icon-meta {
        margin: 0;
        font-size: 0.9rem;
        color: var(--muted);
      }
    </style>
  </head>
  <body>
    <main>
      <div class="panel">
        <h1>GoodData Sprite Preview</h1>
        <p>
          Use the sprite base URL <code>/sprite</code> for local preview, or
          <code>https://&lt;github-user&gt;.github.io/&lt;repository&gt;/sprite</code>
          after GitHub Pages deployment.
        </p>
        <div id="icons" class="grid" data-icons="${iconNames.join(",")}"></div>
      </div>
    </main>
    <script type="module">
      const container = document.getElementById("icons");
      const response = await fetch("./sprite.json");
      const metadata = await response.json();
      const spriteUrl = "./sprite.png";

      for (const name of Object.keys(metadata)) {
        const icon = metadata[name];
        const card = document.createElement("article");
        card.className = "icon-card";

        const title = document.createElement("h2");
        title.className = "icon-name";
        title.textContent = name;

        const meta = document.createElement("p");
        meta.className = "icon-meta";
        meta.textContent = icon.width + "x" + icon.height + " px";

        const preview = document.createElement("div");
        preview.className = "icon-preview";

        const img = document.createElement("img");
        img.width = icon.width;
        img.height = icon.height;
        img.alt = name;
        img.src = spriteUrl;
        img.style.width = icon.width + "px";
        img.style.height = icon.height + "px";
        img.style.objectFit = "none";
        img.style.objectPosition = "-" + icon.x + "px -" + icon.y + "px";

        preview.appendChild(img);
        card.append(preview, title, meta);
        container.appendChild(card);
      }
    </script>
  </body>
</html>
`;
}

async function writeOutputs(layout) {
  const spritePng = await renderSpriteSheet(layout, 1);
  const sprite2xPng = await renderSpriteSheet(layout, 2);
  const spriteJson = createSpriteMetadata(layout.placements, 1);
  const sprite2xJson = createSpriteMetadata(layout.placements, 2);

  await Promise.all([
    fs.writeFile(path.join(DIST_DIR, "sprite.png"), spritePng),
    fs.writeFile(path.join(DIST_DIR, "sprite@2x.png"), sprite2xPng),
    fs.writeFile(path.join(DIST_DIR, "sprite.json"), JSON.stringify(spriteJson, null, 2) + "\n"),
    fs.writeFile(path.join(DIST_DIR, "sprite@2x.json"), JSON.stringify(sprite2xJson, null, 2) + "\n"),
    fs.writeFile(
      path.join(DIST_DIR, "index.html"),
      createPreviewHtml(layout.placements.map((icon) => icon.name)),
    ),
  ]);
}

async function main() {
  await ensureDirectory(DIST_DIR);
  const icons = await loadIcons();
  const layout = layoutIcons(icons);
  await writeOutputs(layout);

  console.log(`Built ${icons.length} icons into ${DIST_DIR}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
