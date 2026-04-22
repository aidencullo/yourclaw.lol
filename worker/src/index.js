const FLY_API = "https://api.machines.dev/v1";
const FLY_APP = "yourclaw-instances";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS });
    }
    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, 405);
    }

    const res = await fetch(`${FLY_API}/apps/${FLY_APP}/machines`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.FLY_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        config: {
          image: "tsl0922/ttyd:latest",
          guest: { cpu_kind: "shared", cpus: 1, memory_mb: 256 },
          auto_destroy: true,
          restart: { policy: "no" },
          processes: [
            {
              name: "main",
              entrypoint: ["ttyd"],
              cmd: ["-W", "-p", "7681", "bash"],
            },
          ],
          services: [
            {
              protocol: "tcp",
              internal_port: 7681,
              ports: [{ port: 443, handlers: ["tls", "http"] }],
            },
          ],
        },
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return json({ error: data.error || "Fly create failed" }, res.status);
    }

    // Wait for the machine to be started before returning
    await fetch(
      `${FLY_API}/apps/${FLY_APP}/machines/${data.id}/wait?state=started&timeout=30`,
      { headers: { Authorization: `Bearer ${env.FLY_API_TOKEN}` } }
    );

    return json({
      id: data.id,
      name: data.name,
      state: "started",
      region: data.region,
      url: `https://${FLY_APP}.fly.dev/`,
    });
  },
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}
