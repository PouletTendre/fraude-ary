"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import TopNav from "@/components/TopNav";
import { Footer } from "@/components/Footer";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Skeleton } from "@/components/ui/Skeleton";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    } else {
      setIsLoading(false);
    }
  }, [router]);

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--bg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div className="space-y-4 w-full max-w-md px-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <TopNav />

      <main>
        <Suspense
          fallback={
            <div
              className="flex items-center justify-center"
              style={{ minHeight: "60vh" }}
            >
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          }
        >
          <ErrorBoundary>{children}</ErrorBoundary>
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
