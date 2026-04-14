const FLY_API_BASE = "https://api.machines.dev/v1";

function headers() {
  const token = process.env.FLY_API_TOKEN;
  if (!token) throw new Error("FLY_API_TOKEN is not set");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

function appName() {
  const name = process.env.FLY_APP_NAME;
  if (!name) throw new Error("FLY_APP_NAME is not set");
  return name;
}

export interface FlyMachine {
  id: string;
  name: string;
  state: string;
  region: string;
  instance_id: string;
  private_ip: string;
  config: {
    image: string;
    guest: { cpu_kind: string; cpus: number; memory_mb: number };
    env?: Record<string, string>;
  };
  created_at: string;
  updated_at: string;
}

export async function createMachine(opts: {
  name: string;
  region?: string;
  env?: Record<string, string>;
}): Promise<FlyMachine> {
  const image = process.env.FLY_MACHINE_IMAGE || "flyio/hellofly:latest";
  const region = opts.region || process.env.FLY_DEFAULT_REGION || "iad";

  const res = await fetch(`${FLY_API_BASE}/apps/${appName()}/machines`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      name: opts.name,
      region,
      config: {
        image,
        guest: {
          cpu_kind: "shared",
          cpus: 1,
          memory_mb: 256,
        },
        env: opts.env || {},
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Fly API error (${res.status}): ${body}`);
  }

  return res.json();
}
