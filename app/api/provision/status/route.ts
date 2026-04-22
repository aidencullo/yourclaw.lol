import { auth } from "@/auth";
import { getMachine } from "@/lib/cloudflare";
import { machineNameForUser } from "@/lib/instance";
import { NextResponse } from "next/server";

// GET /api/provision/status — check if the user has a running instance
export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const name = machineNameForUser(session.user.email);

  try {
    const m = await getMachine(name);
    if (m.state === "stopped") {
      return NextResponse.json({ status: "none", machine: null });
    }
    return NextResponse.json({
      status: m.state,
      machine: {
        id: m.id,
        state: m.state,
        region: m.region,
        created_at: m.created_at,
      },
    });
  } catch (err) {
    console.error("Status check error:", err);
    return NextResponse.json(
      { error: "Could not check instance status." },
      { status: 500 }
    );
  }
}
