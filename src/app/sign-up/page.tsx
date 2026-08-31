"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { AuthScreen } from "@/app/sign-in/page";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setDemoSession } from "@/lib/data/demo-store";
import { isDemoMode } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (isDemoMode()) {
      setDemoSession(true);
      toast.success("Demo account ready. Team sign-up is enabled once Supabase is connected.");
      router.push("/");
      return;
    }
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase!.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Check your email to confirm the account, or sign in if confirmation is disabled.");
    router.push("/sign-in");
  }

  return (
    <AuthScreen>
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Create an account</CardTitle>
          <CardDescription>For a dealership buyer. Teams can be added later in Settings.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3" onSubmit={onSubmit}>
            <div className="grid gap-1.5">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" value={name} onChange={(event) => setName(event.target.value)} required />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={busy}>
              {busy ? "Creating…" : "Create account"}
            </Button>
          </form>
          <p className="mt-4 text-sm">
            Already have access?{" "}
            <Link className="text-primary hover:underline" href="/sign-in">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthScreen>
  );
}
