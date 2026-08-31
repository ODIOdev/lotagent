"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { AuthScreen } from "@/app/sign-in/page";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isDemoMode } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (isDemoMode()) {
      toast.message("Demo mode does not send email. Use Continue with demo data on the sign-in page.");
      return;
    }
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase!.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/sign-in`,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("If that account exists, a reset link is on the way.");
  }

  return (
    <AuthScreen>
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Reset password</CardTitle>
          <CardDescription>We will email a reset link when Supabase Auth is connected.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3" onSubmit={onSubmit}>
            <div className="grid gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </div>
            <Button type="submit" disabled={busy}>
              {busy ? "Sending…" : "Send reset link"}
            </Button>
          </form>
          <p className="mt-4 text-sm">
            <Link className="text-primary hover:underline" href="/sign-in">
              Back to sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthScreen>
  );
}
