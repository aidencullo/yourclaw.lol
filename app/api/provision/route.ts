import { auth } from "@/auth";
import { createMachine, destroyMachine } from "@/lib/cloudflare";
import { machineNameForUser } from "@/lib/instance";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const name = machineNameForUser(session.user.email);

  try {
    const machine = await createMachine({ name });
    return NextResponse.json({
      machine: {
        id: machine.id,
        state: machine.state,
        region: machine.region,
        created_at: machine.created_at,
      },
    });
  } catch (err) {
    console.error("Provision error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Provisioning failed" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const name = machineNameForUser(session.user.email);

  try {
    await destroyMachine(name);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Destroy error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Destroy failed" },
      { status: 500 }
    );
  }
}
