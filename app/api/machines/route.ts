import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";

const FLY_API_URL = "https://api.machines.dev/v1";
const FLY_APP = process.env.FLY_MACHINES_APP || "yourclaw-instances";
const FLY_TOKEN = process.env.FLY_API_TOKEN!;
const MACHINE_IMAGE = process.env.OPENCLAW_MACHINE_IMAGE || "ghcr.io/openclaw/openclaw:latest";
const MACHINE_PORT = Number(process.env.OPENCLAW_MACHINE_PORT || "3000");
const MACHINE_CPUS = Number(process.env.OPENCLAW_MACHINE_CPUS || "2");
const MACHINE_MEMORY_MB = Number(process.env.OPENCLAW_MACHINE_MEMORY_MB || "2048");
const MACHINE_REGION = process.env.OPENCLAW_MACHINE_REGION;

function headers() {
  return {
    Authorization: `Bearer ${FLY_TOKEN}`,
    "Content-Type": "application/json",
  };
}

function createGatewayToken() {
  return randomBytes(24).toString("hex");
}

export async function POST() {
  const gatewayToken = createGatewayToken();
  const res = await fetch(`${FLY_API_URL}/apps/${FLY_APP}/machines`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      ...(MACHINE_REGION ? { region: MACHINE_REGION } : {}),
      config: {
        image: MACHINE_IMAGE,
        env: {
          NODE_ENV: "production",
          OPENCLAW_GATEWAY_PORT: String(MACHINE_PORT),
          OPENCLAW_GATEWAY_TOKEN: gatewayToken,
          OPENCLAW_PREFER_PNPM: "1",
          OPENCLAW_STATE_DIR: "/tmp/openclaw",
        },
        guest: { cpu_kind: "shared", cpus: MACHINE_CPUS, memory_mb: MACHINE_MEMORY_MB },
        auto_destroy: true,
        restart: { policy: "no" },
        entrypoint: ["node", "dist/index.js"],
        cmd: ["gateway", "--allow-unconfigured", "--port", String(MACHINE_PORT), "--bind", "lan"],
      },
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    return NextResponse.json(
      { error: data.error || "Failed to create machine" },
      { status: res.status }
    );
  }

  // Wait for machine to start
  await fetch(
    `${FLY_API_URL}/apps/${FLY_APP}/machines/${data.id}/wait?state=started&timeout=30`,
    { headers: headers() }
  );

  return NextResponse.json({
    id: data.id,
    name: data.name,
    state: data.state,
    region: data.region,
    gatewayToken,
  });
}

export async function GET() {
  const res = await fetch(`${FLY_API_URL}/apps/${FLY_APP}/machines`, {
    headers: headers(),
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: "Failed to list machines" },
      { status: res.status }
    );
  }

  const machines = await res.json();
  return NextResponse.json(machines);
}

export async function DELETE(req: Request) {
  const { machineId } = await req.json();

  // Stop first, then destroy
  await fetch(
    `${FLY_API_URL}/apps/${FLY_APP}/machines/${machineId}/stop`,
    { method: "POST", headers: headers() }
  );

  const res = await fetch(
    `${FLY_API_URL}/apps/${FLY_APP}/machines/${machineId}?force=true`,
    { method: "DELETE", headers: headers() }
  );

  if (!res.ok) {
    return NextResponse.json(
      { error: "Failed to destroy machine" },
      { status: res.status }
    );
  }

  return NextResponse.json({ ok: true });
}
