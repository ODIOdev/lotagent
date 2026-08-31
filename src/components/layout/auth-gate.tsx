"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getDemoSession } from "@/lib/data/demo-store";
import { isDemoMode } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const AUTH_PATHS = ["/sign-in", "/sign-up", "/forgot-password"];

export function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      if (AUTH_PATHS.includes(pathname)) {
        setReady(true);
        return;
      }
      if (getDemoSession()) {
        if (!cancelled) setReady(true);
        return;
      }
      if (isDemoMode()) {
        router.replace("/sign-in");
        return;
      }
      const supabase = createClient();
      const { data } = await supabase!.auth.getUser();
      if (!data.user) {
        router.replace("/sign-in");
        return;
      }
      if (!cancelled) setReady(true);
    }
    void check();
    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  if (AUTH_PATHS.includes(pathname)) return <>{children}</>;
  if (!ready) {
    return (
      <div className="grid min-h-dvh place-items-center bg-background p-6">
        <div className="w-full max-w-md space-y-3">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
