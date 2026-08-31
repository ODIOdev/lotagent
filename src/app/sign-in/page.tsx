"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setDemoSession } from "@/lib/data/demo-store";
import { isDemoMode } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  function enterDemo() {
    setDemoSession(true);
    toast.success("Signed in to demo mode with Overdrive Motors.");
    router.push("/");
    router.refresh();
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (isDemoMode()) {
      enterDemo();
      return;
    }
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase!.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <AuthScreen>
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>
            Calculate landed cost, max bid, and ROI before the lane starts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3" onSubmit={onSubmit}>
            <div className="grid gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@dealership.com"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            <Button type="submit" disabled={busy}>
              {busy ? "Signing in…" : "Sign in"}
            </Button>
            <Button type="button" variant="outline" onClick={enterDemo}>
              Continue with demo data
            </Button>
          </form>
          <div className="mt-4 flex justify-between text-sm">
            <Link className="text-primary hover:underline" href="/forgot-password">
              Forgot password
            </Link>
            <Link className="text-primary hover:underline" href="/sign-up">
              Create account
            </Link>
          </div>
          {isDemoMode() ? (
            <p className="mt-4 text-xs text-muted-foreground">
              Demo mode is on because Supabase keys are not configured. All worksheets stay in this
              browser.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </AuthScreen>
  );
}

export function AuthScreen({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh place-items-center bg-[#f4f6f9] px-4">
      <div className="w-full max-w-md">
        <p className="mb-6 text-center text-xs font-semibold tracking-[0.28em] text-[#0b1f3a]">
          LOTAGENT
        </p>
        {children}
      </div>
    </div>
  );
}
