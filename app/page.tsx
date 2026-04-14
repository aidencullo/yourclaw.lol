"use client";

import { useState, useEffect, useCallback, useRef } from "react";

type Machine = {
  id: string;
  name: string;
  state: string;
  region: string;
  gatewayToken: string;
};

export default function Home() {
  const [machine, setMachine] = useState<Machine | null>(null);
  const [launching, setLaunching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const machineRef = useRef<Machine | null>(null);

  useEffect(() => {
    machineRef.current = machine;
  }, [machine]);

  const cleanup = useCallback(() => {
    const m = machineRef.current;
    if (m) {
      navigator.sendBeacon(
        "/api/machines/destroy",
        JSON.stringify({ machineId: m.id })
      );
    }
  }, []);

  useEffect(() => {
    window.addEventListener("beforeunload", cleanup);
    return () => window.removeEventListener("beforeunload", cleanup);
  }, [cleanup]);

  async function launch() {
    setLaunching(true);
    setError(null);
    const res = await fetch("/api/machines", { method: "POST" });
    const data = await res.json();
    setLaunching(false);

    if (res.ok) {
      setMachine(data);
    } else {
      setError(data.error || "Failed to create machine");
    }
  }

  async function destroy() {
    if (!machine) return;
    await fetch("/api/machines", {
      method: "DELETE",
      body: JSON.stringify({ machineId: machine.id }),
    });
    setMachine(null);
  }

  return (
    <div className="h-screen bg-gray-950 text-gray-100 flex flex-col">
      <header className="border-b border-gray-800 px-6 py-3 flex items-center justify-between shrink-0">
        <h1 className="text-lg font-semibold">yourclaw</h1>
        {machine && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span className="font-mono text-xs text-gray-400">
                {machine.id}
              </span>
              <span className="text-xs text-gray-600">{machine.region}</span>
            </div>
            <button
              onClick={destroy}
              className="text-xs text-red-400 hover:text-red-300 cursor-pointer"
            >
              Destroy
            </button>
          </div>
        )}
      </header>

      {!machine && !launching && (
        <main className="flex-1 flex flex-col items-center justify-center gap-4">
          <button
            onClick={launch}
            className="px-8 py-4 bg-white text-gray-950 text-lg font-medium rounded-xl hover:bg-gray-200 transition-colors cursor-pointer"
          >
            Launch OpenClaw
          </button>
          {error && <p className="text-red-400 text-sm">{error}</p>}
        </main>
      )}

      {launching && (
        <main className="flex-1 flex items-center justify-center">
          <p className="text-gray-400 text-lg">Provisioning...</p>
        </main>
      )}

      {machine && (
        <>
          <div className="border-b border-gray-800 px-6 py-2 text-xs text-gray-500 shrink-0">
            Booting OpenClaw on a dedicated Fly Machine.
          </div>
          <iframe
            src={`/terminal/${machine.id}/ui/overview#token=${encodeURIComponent(machine.gatewayToken)}`}
            className="flex-1 w-full border-0"
          />
        </>
      )}
    </div>
  );
}
