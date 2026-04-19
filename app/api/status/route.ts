import { NextRequest, NextResponse } from "next/server";
import { getApp, listMachines, publicHostname } from "@/lib/fly";
import { appNameForUser } from "@/lib/instance";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const clawId = request.cookies.get("claw-id")?.value;
  if (!clawId) {
    return NextResponse.json(
      { error: "missing_identifier", detail: "No claw-id cookie found" },
      { status: 400 },
    );
  }

  const appName = appNameForUser(clawId);

  try {
    const app = await getApp(appName);
    if (!app) {
      return NextResponse.json({ app: appName, provisioned: false });
    }

    const machines = await listMachines(appName);
    const machine = machines[0];

    return NextResponse.json({
      app: appName,
      provisioned: true,
      machine: machine
        ? { id: machine.id, state: machine.state, region: machine.region }
        : null,
      hostname: publicHostname(appName),
      url: `https://${publicHostname(appName)}`,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: "status_failed", detail: message },
      { status: 502 },
    );
  }
}
