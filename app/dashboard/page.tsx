"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Status = {
  app: string;
  provisioned: boolean;
  machine?: { id: string; state: string; region: string } | null;
  hostname?: string;
  url?: string;
};

type Phase = "loading" | "provisioning" | "starting" | "ready" | "error";

export default function Dashboard() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>("loading");
  const [info, setInfo] = useState<Status | null>(null);
  const [error, setError] = useState<string | null>(null);
  const provisionStarted = useRef(false);

  useEffect(() => {
    if (authStatus === "unauthenticated") router.push("/");
  }, [authStatus, router]);

  // Kick off: check status; if not provisioned yet, provision once.
  useEffect(() => {
    if (authStatus !== "authenticated" || provisionStarted.current) return;
    provisionStarted.current = true;

    (async () => {
      try {
        const s = await fetchStatus();
        if (!s.provisioned) {
          setPhase("provisioning");
          await provision();
        }
        setPhase("starting");
        await pollUntilReady((s) => setInfo(s));
        setPhase("ready");
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        setPhase("error");
      }
    })();
  }, [authStatus]);

  const retry = () => {
    provisionStarted.current = false;
    setError(null);
    setPhase("loading");
    setInfo(null);
    // force effect to re-run
    router.refresh();
  };

  return (
    <>
      <div className="bg">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>
      <div className="dashboard">
        <header className="dashboard-header">
          <h1>yourclaw.lol</h1>
          <div className="dashboard-user">
            {session?.user?.image && (
              <img src={session.user.image} alt="" />
            )}
            <span>{session?.user?.name}</span>
            <button className="signout" onClick={() => signOut({ callbackUrl: "/" })}>
              Sign out
            </button>
          </div>
        </header>
        <main className="dashboard-main">
          <div className="card">
            <h2>Your OpenClaw instance</h2>
            <p>
              A dedicated Fly.io machine running OpenClaw, provisioned just for
              you.
            </p>

            <StatusRow phase={phase} info={info} />

            {phase === "ready" && info?.url && (
              <a
                className="instance-url"
                href={info.url}
                target="_blank"
                rel="noreferrer"
              >
                {info.url}
              </a>
            )}

            {phase === "error" && (
              <>
                <div className="error-box">{error}</div>
                <button className="retry" onClick={retry}>
                  Retry
                </button>
              </>
            )}
          </div>
        </main>
      </div>
    </>
  );
}

function StatusRow({ phase, info }: { phase: Phase; info: Status | null }) {
  const label = {
    loading: "Checking status…",
    provisioning: "Provisioning your Fly.io app…",
    starting:
      info?.machine?.state && info.machine.state !== "started"
        ? `Machine ${info.machine.state}…`
        : "Starting machine…",
    ready: `Running in ${info?.machine?.region ?? "the cloud"}`,
    error: "Something went wrong",
  }[phase];

  const dotClass =
    phase === "ready" ? "ready" : phase === "error" ? "error" : "pending";

  return (
    <div className="status-row">
      <span className={`dot ${dotClass}`} />
      <span>{label}</span>
    </div>
  );
}

async function fetchStatus(): Promise<Status> {
  const res = await fetch("/api/status", { cache: "no-store" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || body.error || `status ${res.status}`);
  }
  return res.json();
}

async function provision(): Promise<Status> {
  const res = await fetch("/api/provision", {
    method: "POST",
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || body.error || `provision ${res.status}`);
  }
  return res.json();
}

async function pollUntilReady(
  onUpdate: (s: Status) => void,
  { timeoutMs = 120_000, intervalMs = 2000 } = {},
): Promise<Status> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const s = await fetchStatus();
    onUpdate(s);
    if (s.provisioned && s.machine?.state === "started") return s;
    await sleep(intervalMs);
  }
  throw new Error("Timed out waiting for machine to start");
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
