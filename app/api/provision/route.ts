import { auth } from "@/auth";
import { createMachine, destroyMachine, listMachines } from "@/lib/fly";
import { NextResponse } from "next/server";

function machineNameForUser(userId: string): string {
  // Fly machine names must be alphanumeric + hyphens
  return `claw-${userId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 20)}`;
}

// POST /api/provision — create a new instance for the authenticated user
export async function POST() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.email;
  const machineName = machineNameForUser(userId);

  try {
    // Check if user already has a machine
    const existing = await listMachines();
    const userMachine = existing.find((m) => m.name === machineName);

    if (userMachine) {
      return NextResponse.json({
        machine: userMachine,
        message: "Instance already exists",
        alreadyExisted: true,
      });
    }

    const machine = await createMachine({
      name: machineName,
      env: {
        INSTANCE_OWNER: userId,
      },
    });

    return NextResponse.json({
      machine,
      message: "Instance provisioned",
      alreadyExisted: false,
    });
  } catch (err) {
    console.error("Provision error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Provisioning failed" },
      { status: 500 }
    );
  }
}

// DELETE /api/provision — destroy the user's instance
export async function DELETE() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.email;
  const machineName = machineNameForUser(userId);

  try {
    const existing = await listMachines();
    const userMachine = existing.find((m) => m.name === machineName);

    if (!userMachine) {
      return NextResponse.json({ error: "No instance found" }, { status: 404 });
    }

    await destroyMachine(userMachine.id);

    return NextResponse.json({ message: "Instance destroyed" });
  } catch (err) {
    console.error("Destroy error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Destroy failed" },
      { status: 500 }
    );
  }
}
