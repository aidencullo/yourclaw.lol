import { NextResponse } from "next/server";

const FLY_API_URL = "https://api.machines.dev/v1";
const FLY_APP = process.env.FLY_MACHINES_APP || "yourclaw-instances";
const FLY_TOKEN = process.env.FLY_API_TOKEN!;

export async function POST(req: Request) {
  const { machineId } = await req.json();

  await fetch(
    `${FLY_API_URL}/apps/${FLY_APP}/machines/${machineId}?force=true`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${FLY_TOKEN}`,
        "Content-Type": "application/json",
      },
    }
  );

  return NextResponse.json({ ok: true });
}
