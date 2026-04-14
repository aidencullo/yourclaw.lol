"use client";

import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) router.push("/dashboard");
  }, [session, router]);

  const onClick = () => {
    if (session) {
      router.push("/dashboard");
    } else {
      signIn("google", { callbackUrl: "/dashboard" });
    }
  };

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
          onClick={onClick}
          disabled={status === "loading"}
        >
          Get an assistant <span>&rarr;</span>
        </button>
        <p className="note">Ready in seconds</p>
      </div>
    </main>
  );
}
