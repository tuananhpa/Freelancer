import http from "node:http";
const workerPort = Number(process.env.WORKER_PORT || 8787);
const port = Number(process.env.PORT || 8788);
const isAllowed = (path) =>
  path === "/" ||
  path === "/admin" ||
  [
    "/icon.svg",
    "/sw.js",
    "/manifest.webmanifest",
    "/images/food-grid.webp",
  ].includes(path) ||
  /^\/assets\/[\w.-]+$/.test(path) ||
  (path.startsWith("/api/") && !path.startsWith("/api/jobs/"));
const server = http.createServer((req, res) => {
  let path;
  try {
    path = new URL(req.url, "http://local").pathname;
  } catch {
    res.writeHead(400);
    res.end();
    return;
  }
  if (!isAllowed(path)) {
    res.writeHead(404, { "content-type": "text/plain" });
    res.end("Not found");
    return;
  }
  const host = req.headers.host,
    origin = req.headers.origin;
  if (origin) {
    let oh;
    try {
      oh = new URL(origin).host;
    } catch {}
    if (oh !== host) {
      res.writeHead(403);
      res.end("Origin rejected");
      return;
    }
  }
  const headers = {
    ...req.headers,
    host: "127.0.0.1:" + workerPort,
    "x-forwarded-proto": host?.endsWith(".trycloudflare.com")
      ? "https"
      : "http",
  };
  if (origin) headers.origin = "http://127.0.0.1:" + workerPort;
  delete headers["x-forwarded-host"];
  headers["cf-connecting-ip"] = host?.endsWith(".trycloudflare.com")
    ? req.headers["cf-connecting-ip"] || "tunnel"
    : "local";
  const proxy = http.request(
    {
      host: "127.0.0.1",
      port: workerPort,
      path: req.url,
      method: req.method,
      headers,
    },
    (up) => {
      const h = { ...up.headers };
      delete h["access-control-allow-origin"];
      res.writeHead(up.statusCode, h);
      up.pipe(res);
    },
  );
  proxy.on("error", () => {
    if (!res.headersSent) res.writeHead(502, { "content-type": "text/plain" });
    res.end("Ứng dụng local chưa sẵn sàng.");
  });
  req.pipe(proxy);
});
server.listen(port, "127.0.0.1", () =>
  console.log("Public gateway ready: http://127.0.0.1:" + port),
);
