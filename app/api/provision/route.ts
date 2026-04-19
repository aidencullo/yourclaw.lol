import { NextRequest, NextResponse } from "next/server";
import {
  defaultOpenClawConfig,
  ensureApp,
  ensureMachine,
  publicHostname,
} from "@/lib/fly";
import { appNameForUser } from "@/lib/instance";

export const runtime = "nodejs";

/**
 * Idempotent provisioning endpoint.
 *
 * Reads the `claw-id` cookie (a UUID set on the client) to derive a
 * deterministic Fly app name, ensures the app + a single machine exist,
 * and returns the public hostname.
 */
export async function POST(request: NextRequest) {
  const clawId = request.cookies.get("claw-id")?.value;
  if (!clawId) {
    return NextResponse.json(
      { error: "missing_identifier", detail: "No claw-id cookie found" },
      { status: 400 },
    );
  }

  const orgSlug = process.env.FLY_ORG_SLUG;
  if (!orgSlug) {
    return NextResponse.json(
      { error: "server_misconfigured", detail: "FLY_ORG_SLUG not set" },
      { status: 500 },
    );
  }

  const appName = appNameForUser(clawId);

  try {
    await ensureApp(appName, orgSlug);
    const machine = await ensureMachine(
      appName,
      defaultOpenClawConfig({
        anthropicApiKey: process.env.OPENCLAW_ANTHROPIC_API_KEY,
      }),
    );

    return NextResponse.json({
      app: appName,
      machine: { id: machine.id, state: machine.state, region: machine.region },
      hostname: publicHostname(appName),
      url: `https://${publicHostname(appName)}`,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: "provisioning_failed", detail: message },
      { status: 502 },
    );
  }
}
