import { Container, getContainer } from "@cloudflare/containers";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export class ClawContainer extends Container {
  defaultPort = 7681;
  sleepAfter = "10m";
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS });
    }

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";

    if (path.startsWith("/container/")) {
      return proxyToContainer(request, env, path);
    }

    if (path !== "/") {
      return json({ error: "not found" }, 404);
    }

    const name = url.searchParams.get("name") || crypto.randomUUID();

    const container = getContainer(env.CLAW_CONTAINER, name);

    if (request.method === "POST") {
      await container.startAndWaitForPorts();
      return json({
        id: name,
        name,
        state: "started",
        region: "auto",
        created_at: new Date().toISOString(),
        url: `${url.origin}/container/${encodeURIComponent(name)}/`,
      });
    }

    if (request.method === "GET") {
      const running = await container.isRunning().catch(() => false);
      return json({
        id: name,
        name,
        state: running ? "started" : "stopped",
        region: "auto",
        created_at: new Date().toISOString(),
      });
    }

    if (request.method === "DELETE") {
      await container.destroy().catch(() => {});
      return json({ ok: true });
    }

    return json({ error: "method not allowed" }, 405);
  },
};

async function proxyToContainer(request, env, path) {
  const [, , rawName, ...rest] = path.split("/");
  if (!rawName) {
    return json({ error: "missing container name" }, 400);
  }

  const name = decodeURIComponent(rawName);
  const container = getContainer(env.CLAW_CONTAINER, name);
  const proxiedUrl = new URL(request.url);
  proxiedUrl.pathname = `/${rest.join("/")}`;
  if (proxiedUrl.pathname === "/") {
    proxiedUrl.pathname = "/";
  }

  return container.fetch(new Request(proxiedUrl, request));
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}
