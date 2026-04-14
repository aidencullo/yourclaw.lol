import { createServer } from "http";
import next from "next";
import httpProxy from "http-proxy";

const dev = process.env.NODE_ENV !== "production";
const machinePort = process.env.OPENCLAW_MACHINE_PORT || "3000";
const app = next({ dev });
const handle = app.getRequestHandler();

const proxy = httpProxy.createProxyServer({ ws: true, changeOrigin: true });

proxy.on("error", (err, _req, res) => {
  console.error("Proxy error:", err.message);
  if (res.writeHead) {
    res.writeHead(502, { "Content-Type": "text/plain" });
    res.end("Machine not ready");
  }
});

function parseTerminalUrl(url) {
  const match = url?.match(/^\/terminal\/([a-z0-9]+)(\/.*)?$/);
  if (!match) return null;
  return { machineId: match[1], path: match[2] || "/" };
}

await app.prepare();

const server = createServer((req, res) => {
  const parsed = parseTerminalUrl(req.url);
  if (parsed) {
    const target = `http://${parsed.machineId}.vm.yourclaw-instances.internal:${machinePort}`;
    req.url = parsed.path;
    proxy.web(req, res, { target });
    return;
  }
  handle(req, res);
});

server.on("upgrade", (req, socket, head) => {
  const parsed = parseTerminalUrl(req.url);
  if (parsed) {
    const target = `http://${parsed.machineId}.vm.yourclaw-instances.internal:${machinePort}`;
    req.url = parsed.path;
    proxy.ws(req, socket, head, { target });
  }
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`> Ready on http://localhost:${port}`);
});
