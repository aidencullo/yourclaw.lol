import { auth } from "@/auth";
import { listMachines } from "@/lib/fly";
import { machineNameForUser } from "@/lib/instance";
import { NextResponse } from "next/server";

// GET /api/provision/status — check if the user has a running instance
export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.email;
  const machineName = machineNameForUser(userId);

  try {
    const machines = await listMachines();
    const userMachine = machines.find((m) => m.name === machineName);

    if (!userMachine) {
      return NextResponse.json({ status: "none", machine: null });
    }

    return NextResponse.json({
      status: userMachine.state,
      machine: {
        id: userMachine.id,
        state: userMachine.state,
        region: userMachine.region,
        created_at: userMachine.created_at,
      },
    });
  } catch (err) {
    console.error("Status check error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Status check failed" },
      { status: 500 }
    );
  }
}
