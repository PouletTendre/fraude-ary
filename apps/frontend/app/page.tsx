"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      router.push("/portfolio");
    } else {
      router.push("/login");
    }
  }, [router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold">Fraude-Ary</h1>
      <p className="mt-4 text-lg text-text-secondary text-text-muted">
        Multi-Asset Portfolio Tracker
      </p>
    </main>
  );
}