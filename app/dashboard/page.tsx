"use client";

import { useSession, signOut } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";

type InstanceStatus = "none" | "created" | "started" | "stopped" | "destroying";

interface MachineInfo {
  id: string;
  state: string;
  region: string;
  created_at: string;
}

export default function Dashboard() {
  const { data: session } = useSession();
  const [status, setStatus] = useState<InstanceStatus>("none");
  const [machine, setMachine] = useState<MachineInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [provisioning, setProvisioning] = useState(false);
  const [destroying, setDestroying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/provision/status");
      const data = await res.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      if (data.status === "none") {
        setStatus("none");
        setMachine(null);
      } else {
        setStatus(data.status as InstanceStatus);
        setMachine(data.machine);
      }
    } catch {
      setError("Failed to check instance status");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // Poll while provisioning
  useEffect(() => {
    if (!provisioning) return;
    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, [provisioning, checkStatus]);

  async function handleProvision() {
    setProvisioning(true);
    setError(null);

    try {
      const res = await fetch("/api/provision", { method: "POST" });
      const data = await res.json();

      if (data.error) {
        setError(data.error);
        setProvisioning(false);
        return;
      }

      setMachine(data.machine);
      setStatus(data.machine.state);
    } catch {
      setError("Failed to provision instance");
    } finally {
      setProvisioning(false);
    }
  }

  async function handleDestroy() {
    setDestroying(true);
    setError(null);

    try {
      const res = await fetch("/api/provision", { method: "DELETE" });
      const data = await res.json();

      if (data.error) {
        setError(data.error);
        setDestroying(false);
        return;
      }

      setStatus("none");
      setMachine(null);
    } catch {
      setError("Failed to destroy instance");
    } finally {
      setDestroying(false);
    }
  }

  const firstName = session?.user?.name?.split(" ")[0] || "there";

  return (
    <div className="min-h-screen bg-[#050505] text-[#e5e5e5] flex flex-col">
      {/* Header */}
      <header className="border-b border-[#222] px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">yourclaw.lol</h1>
        <div className="flex items-center gap-4">
          {session?.user?.image && (
            <img
              src={session.user.image}
              alt=""
              className="w-8 h-8 rounded-full"
            />
          )}
          <span className="text-sm text-[#999]">{session?.user?.name}</span>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-sm text-[#666] hover:text-[#999] cursor-pointer"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-lg px-6">
          {loading ? (
            <div className="text-[#666] text-lg">Checking your instance...</div>
          ) : status === "none" ? (
            /* No instance — show provision button */
            <>
              <h2 className="text-3xl font-bold text-white mb-2">
                Hey {firstName}
              </h2>
              <p className="text-[#888] mb-8 text-lg">
                You don&apos;t have an instance yet. Click below to spin one up
                — it takes about 5 seconds.
              </p>
              <button
                onClick={handleProvision}
                disabled={provisioning}
                className="inline-flex items-center gap-2 px-8 py-4 bg-[#dc2626] text-white text-lg font-semibold rounded-xl hover:bg-[#ef4444] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:translate-y-[-2px] hover:shadow-[0_8px_30px_rgba(220,38,38,0.3)]"
              >
                {provisioning ? (
                  <>
                    <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Provisioning...
                  </>
                ) : (
                  <>
                    Deploy your claw
                    <span className="text-xl">&rarr;</span>
                  </>
                )}
              </button>
              {error && (
                <p className="mt-4 text-[#dc2626] text-sm">{error}</p>
              )}
            </>
          ) : (
            /* Instance exists — show status */
            <>
              <h2 className="text-3xl font-bold text-white mb-2">
                Your claw is {status}
              </h2>
              <div className="mt-6 bg-[#111] border border-[#222] rounded-xl p-6 text-left">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-[#666]">Status</span>
                    <span className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          status === "started"
                            ? "bg-green-500"
                            : status === "stopped"
                              ? "bg-yellow-500"
                              : "bg-[#666]"
                        }`}
                      />
                      {status}
                    </span>
                  </div>
                  {machine && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-[#666]">Machine ID</span>
                        <span className="font-mono text-sm">{machine.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#666]">Region</span>
                        <span>{machine.region}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#666]">Created</span>
                        <span className="text-sm">
                          {new Date(machine.created_at).toLocaleString()}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-center gap-4">
                <button
                  onClick={handleDestroy}
                  disabled={destroying}
                  className="px-6 py-3 bg-[#222] text-[#999] rounded-xl hover:bg-[#333] hover:text-white transition-all cursor-pointer disabled:opacity-50"
                >
                  {destroying ? "Destroying..." : "Destroy instance"}
                </button>
              </div>

              {error && (
                <p className="mt-4 text-[#dc2626] text-sm">{error}</p>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
