"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <main className="landing">
      <div className="bg">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>
      <div className="container">
        <h1>Get a personal AI assistant</h1>
        <p className="subtitle">
          Create your personal assistant, powered by{" "}
          <a href="https://docs.openclaw.ai" className="link">
            OpenClaw
          </a>
          .
        </p>
        <button
          className="cta"
          onClick={() => router.push("/dashboard")}
        >
          Get an assistant <span>&rarr;</span>
        </button>
        <p className="note">Ready in seconds</p>
      </div>
    </main>
  );
}
