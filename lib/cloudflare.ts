const WORKER_URL =
  process.env.CLAW_WORKER_URL || "https://yourclaw-provision.aidencullo.workers.dev";

export interface ClawContainer {
  id: string;
  name: string;
  state: string;
  region: string;
  created_at: string;
}

async function call(method: string, name: string): Promise<ClawContainer> {
  const res = await fetch(`${WORKER_URL}/?name=${encodeURIComponent(name)}`, {
    method,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Cloudflare worker error (${res.status}): ${body}`);
  }
  return res.json();
}

export async function createMachine(opts: { name: string }): Promise<ClawContainer> {
  return call("POST", opts.name);
}

export async function getMachine(name: string): Promise<ClawContainer> {
  return call("GET", name);
}

export async function destroyMachine(name: string): Promise<void> {
  const res = await fetch(`${WORKER_URL}/?name=${encodeURIComponent(name)}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Cloudflare worker error (${res.status}): ${body}`);
  }
}
