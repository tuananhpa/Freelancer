import { createReadStream } from "node:fs";
import { copyFile, mkdir, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin } from "vite";
import catalog from "./video-sources.json";

const root = fileURLToPath(new URL("../", import.meta.url));
const source = path.resolve(root, "../../HYTales/Video");

async function sourceFiles() {
  const names = await readdir(source);
  const files = new Map<string, string>();
  for (const { slug, prefix } of catalog) {
    const matches = names.filter(
      (name) => name.startsWith(prefix) && name.toLowerCase().endsWith(".mp4"),
    );
    if (matches.length !== 1)
      throw new Error(`Expected one ${prefix} video in ${source}.`);
    files.set(`${slug}.mp4`, path.join(source, matches[0]));
  }
  return files;
}

export function hytalesVideoPlugin(): Plugin {
  let output = "";
  return {
    name: "hytales-source-videos",
    configResolved(config) {
      output = path.resolve(config.root, config.build.outDir, "hytales-videos");
    },
    async configureServer(server) {
      const files = await sourceFiles();
      server.middlewares.use(
        (req: IncomingMessage, res: ServerResponse, next) => {
          const pathname = (req.url || "").split("?")[0];
          // Exact allowlist only: no arbitrary access to the HYTales directory.
          const match = /^\/(?:hytales-videos|media)\/([^/]+\.mp4)$/.exec(
            pathname,
          );
          const filename = match && files.get(match[1]);
          if (!filename) return next();
          void (async () => {
            if (req.method !== "GET" && req.method !== "HEAD") {
              res.writeHead(405, { Allow: "GET, HEAD" });
              res.end();
              return;
            }
            const info = await stat(filename);
            const headers = {
              "Content-Type": "video/mp4",
              "Accept-Ranges": "bytes",
              "Cache-Control": "no-cache",
              "Last-Modified": info.mtime.toUTCString(),
            };
            let start = 0,
              end = info.size - 1;
            const range = req.headers.range;
            if (range) {
              const parts = /^bytes=(\d*)-(\d*)$/.exec(range);
              if (!parts || (!parts[1] && !parts[2])) {
                res.writeHead(416, { "Content-Range": `bytes */${info.size}` });
                res.end();
                return;
              }
              start = parts[1]
                ? Number(parts[1])
                : Math.max(0, info.size - Number(parts[2]));
              end =
                parts[1] && parts[2] ? Math.min(Number(parts[2]), end) : end;
              if (
                !Number.isSafeInteger(start) ||
                !Number.isSafeInteger(end) ||
                start > end ||
                start >= info.size
              ) {
                res.writeHead(416, { "Content-Range": `bytes */${info.size}` });
                res.end();
                return;
              }
            }
            res.writeHead(range ? 206 : 200, {
              ...headers,
              "Content-Length": end - start + 1,
              ...(range
                ? { "Content-Range": `bytes ${start}-${end}/${info.size}` }
                : {}),
            });
            if (req.method === "HEAD") {
              res.end();
              return;
            }
            const stream = createReadStream(filename, { start, end });
            res.on("close", () => stream.destroy());
            stream.on("error", () => res.destroy());
            stream.pipe(res);
          })().catch((error) => {
            server.config.logger.error(`HYTales video: ${String(error)}`);
            if (!res.headersSent) res.writeHead(503);
            res.end("Video source unavailable in HYTales/Video.");
          });
        },
      );
    },
    async closeBundle() {
      if (!output) return;
      await mkdir(output, { recursive: true });
      for (const [name, filename] of await sourceFiles())
        await copyFile(filename, path.join(output, name));
    },
  };
}
