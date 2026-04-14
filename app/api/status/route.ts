import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getApp, listMachines, publicHostname } from "@/lib/fly";
import { appNameForUser } from "@/lib/instance";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const appName = appNameForUser(email);

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
