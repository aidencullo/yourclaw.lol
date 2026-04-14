/**
 * Minimal Fly.io Machines API client.
 *
 * Docs: https://fly.io/docs/machines/api/
 */

const FLY_API = "https://api.machines.dev/v1";

export type FlyMachine = {
  id: string;
  name: string;
  state: string;
  region: string;
  private_ip: string;
  config?: Record<string, unknown>;
  checks?: Array<{ name: string; status: string; output?: string }>;
};

export type FlyApp = {
  id: string;
  name: string;
  organization: { slug: string };
  status: string;
};

type MachineServiceConfig = {
  ports: Array<{ port: number; handlers?: string[]; force_https?: boolean }>;
  protocol: "tcp" | "udp";
  internal_port: number;
};

type MachineConfig = {
  image: string;
  env?: Record<string, string>;
  services?: MachineServiceConfig[];
  guest?: { cpu_kind?: string; cpus?: number; memory_mb?: number };
  auto_destroy?: boolean;
  restart?: { policy?: string };
};

type CreateMachineBody = {
  name?: string;
  region?: string;
  config: MachineConfig;
};

function token(): string {
  const t = process.env.FLY_API_TOKEN;
  if (!t) throw new Error("FLY_API_TOKEN is not set");
  return t;
}

async function fly<T>(
  path: string,
  init: Omit<RequestInit, "body"> & { body?: unknown } = {},
): Promise<T> {
  const { body, headers, ...rest } = init;
  const res = await fetch(`${FLY_API}${path}`, {
    ...rest,
    headers: {
      Authorization: `Bearer ${token()}`,
      "Content-Type": "application/json",
      ...(headers || {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });

  const text = await res.text();
  const data = text ? safeJson(text) : null;

  if (!res.ok) {
    const msg =
      (data && typeof data === "object" && "error" in data
        ? (data as { error: string }).error
        : null) || text || `Fly API ${res.status}`;
    const err = new Error(`Fly ${path} ${res.status}: ${msg}`) as Error & {
      status?: number;
    };
    err.status = res.status;
    throw err;
  }

  return data as T;
}

function safeJson(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

export async function getApp(appName: string): Promise<FlyApp | null> {
  try {
    return await fly<FlyApp>(`/apps/${appName}`);
  } catch (e) {
    if ((e as { status?: number }).status === 404) return null;
    throw e;
  }
}

export async function createApp(
  appName: string,
  orgSlug: string,
): Promise<FlyApp> {
  return fly<FlyApp>(`/apps`, {
    method: "POST",
    body: {
      app_name: appName,
      org_slug: orgSlug,
      network: "default",
    },
  });
}

/**
 * Idempotent: returns existing app if present, creates otherwise.
 */
export async function ensureApp(
  appName: string,
  orgSlug: string,
): Promise<FlyApp> {
  const existing = await getApp(appName);
  if (existing) return existing;
  return createApp(appName, orgSlug);
}

export async function listMachines(appName: string): Promise<FlyMachine[]> {
  return fly<FlyMachine[]>(`/apps/${appName}/machines`);
}

export async function createMachine(
  appName: string,
  body: CreateMachineBody,
): Promise<FlyMachine> {
  return fly<FlyMachine>(`/apps/${appName}/machines`, {
    method: "POST",
    body,
  });
}

/**
 * Idempotent machine provisioning: if the app already has a machine, return it;
 * otherwise create one with the given config.
 */
export async function ensureMachine(
  appName: string,
  body: CreateMachineBody,
): Promise<FlyMachine> {
  const existing = await listMachines(appName);
  if (existing.length > 0) return existing[0];
  return createMachine(appName, body);
}

/**
 * Default machine config for an OpenClaw instance. The image is configurable via
 * env var so the contract with the upstream OpenClaw image can evolve
 * independently.
 */
export function defaultOpenClawConfig(opts: {
  image?: string;
  region?: string;
  anthropicApiKey?: string;
}): CreateMachineBody {
  const image =
    opts.image ||
    process.env.OPENCLAW_IMAGE ||
    "ghcr.io/openclaw/openclaw:latest";
  const region = opts.region || process.env.FLY_DEFAULT_REGION || "iad";

  const env: Record<string, string> = {
    PORT: "8080",
  };
  if (opts.anthropicApiKey) env.ANTHROPIC_API_KEY = opts.anthropicApiKey;

  return {
    region,
    config: {
      image,
      env,
      services: [
        {
          protocol: "tcp",
          internal_port: 8080,
          ports: [
            { port: 80, handlers: ["http"], force_https: true },
            { port: 443, handlers: ["tls", "http"] },
          ],
        },
      ],
      guest: { cpu_kind: "shared", cpus: 1, memory_mb: 512 },
      restart: { policy: "always" },
      auto_destroy: false,
    },
  };
}

export function publicHostname(appName: string): string {
  return `${appName}.fly.dev`;
}
