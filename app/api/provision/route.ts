import { createMachine } from "@/lib/fly";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

export async function POST() {
  const machineName = `claw-${randomUUID().slice(0, 8)}`;

  try {
    const machine = await createMachine({ name: machineName });
    return NextResponse.json({
      machineId: machine.id,
      name: machine.name,
      region: machine.region,
      state: machine.state,
    });
  } catch (err) {
    console.error("Provision error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Provisioning failed" },
      { status: 500 }
    );
  }
}
