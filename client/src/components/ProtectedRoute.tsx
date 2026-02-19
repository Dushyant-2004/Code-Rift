"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

const PUBLIC_PATHS = ["/", "/login"];

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isPublic = PUBLIC_PATHS.includes(pathname);

  useEffect(() => {
    if (!loading && !user && !isPublic) {
      router.push("/login");
    }
  }, [user, loading, router, pathname, isPublic]);

  // Public pages render instantly — no waiting for auth
  if (isPublic) {
    return <>{children}</>;
  }

  // Protected pages show a minimal spinner only while auth resolves
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-950">
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-12 w-12">
            <div className="absolute inset-0 rounded-full border-2 border-brand-500/20" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-brand-500 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
