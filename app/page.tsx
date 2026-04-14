"use client";

import { useState } from "react";

type Machine = {
  machineId: string;
  name: string;
  region: string;
  state: string;
};

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [machine, setMachine] = useState<Machine | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleProvision() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/provision", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to provision");
      setMachine(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="bg">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>
      <div className="container">
        <h1>Get a personal AI assistant</h1>
        <p className="subtitle">
          Create your personal assistant, powered by{" "}
          <a
            href="https://docs.openclaw.ai"
            className="link"
            target="_blank"
            rel="noreferrer"
          >
            OpenClaw
          </a>
          .
        </p>
        {machine ? (
          <div className="result">
            <p className="result-title">Your assistant is ready</p>
            <div className="result-row">
              <span>Machine</span>
              <span className="mono">{machine.name}</span>
            </div>
            <div className="result-row">
              <span>Region</span>
              <span className="mono">{machine.region}</span>
            </div>
            <div className="result-row">
              <span>State</span>
              <span className="mono">{machine.state}</span>
            </div>
          </div>
        ) : (
          <button className="cta" onClick={handleProvision} disabled={loading}>
            {loading ? "Starting..." : "Get an assistant"}{" "}
            <span>&rarr;</span>
          </button>
        )}
        {error && <p className="error">{error}</p>}
        <p className="note">Ready in seconds</p>
      </div>
    </>
  );
}
