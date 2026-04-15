import http from "node:http";
import path from "node:path";
import { promises as fs } from "node:fs";

const DIST_DIR = path.join(process.cwd(), "dist");
const PORT = Number(process.env.PORT || 4173);

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
};

function contentTypeFor(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  return MIME_TYPES[extension] || "application/octet-stream";
}

function resolveFile(urlPath) {
  const sanitized = urlPath === "/" ? "/index.html" : urlPath;
  const fullPath = path.join(DIST_DIR, sanitized);

  if (!fullPath.startsWith(DIST_DIR)) {
    return null;
  }

  return fullPath;
}

const server = http.createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url || "/", `http://${request.headers.host}`);
    const filePath = resolveFile(requestUrl.pathname);

    if (!filePath) {
      response.writeHead(400);
      response.end("Bad request");
      return;
    }

    const fileBuffer = await fs.readFile(filePath);
    response.writeHead(200, {
      "Content-Type": contentTypeFor(filePath),
      "Cache-Control": "no-cache",
    });
    response.end(fileBuffer);
  } catch (error) {
    response.writeHead(404);
    response.end("Not found");
  }
});

server.listen(PORT, () => {
  console.log(`Previewing dist at http://localhost:${PORT}/`);
});
