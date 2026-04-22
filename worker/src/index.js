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
    const name = url.searchParams.get("name");
    if (!name) return json({ error: "missing ?name" }, 400);

    const container = getContainer(env.CLAW_CONTAINER, name);

    if (request.method === "POST") {
      await container.start();
      return json({
        id: name,
        name,
        state: "started",
        region: "auto",
        created_at: new Date().toISOString(),
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

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}
