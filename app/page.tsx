"use client";

import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      router.push("/chat");
    }
  }, [session, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-gray-400 text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center max-w-md px-6">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">YourClaude</h1>
        <p className="text-lg text-gray-400 mb-2">
          Get an immediate OpenClaw instance.
        </p>
        <p className="text-sm text-gray-500 mb-10">
          Ready in seconds
        </p>
        <button
          onClick={() => signIn("google")}
          className="px-8 py-3.5 bg-rose-600 text-white text-lg font-medium rounded-full hover:bg-rose-700 transition-colors cursor-pointer"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
