import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FlaskConical } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({ meta: [{ title: "Sign in — ChemTrack" }] }),
});

function AuthPage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  useEffect(() => {
    if (!loading && user) nav({ to: "/dashboard" });
  }, [user, loading, nav]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-hero p-4 sm:p-6">
      <Card className="w-full max-w-md shadow-elegant">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <FlaskConical className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="mt-2 text-2xl">Welcome to ChemTrack</CardTitle>
          <CardDescription>Sign in or create an account to manage your lab inventory.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>
            <TabsContent value="signin"><SignInForm /></TabsContent>
            <TabsContent value="signup"><SignUpForm /></TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success("Welcome back!");
  };
  const sendReset = async () => {
    if (!email) return toast.error("Enter your email above first.");
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success("Password reset email sent. Check your inbox.");
    setShowForgot(false);
  };
  return (
    <form onSubmit={submit} className="mt-4 space-y-4">
      <div><Label>Email</Label><Input className="h-11" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
      <div>
        <div className="flex items-center justify-between">
          <Label>Password</Label>
          <button type="button" className="text-xs text-primary hover:underline" onClick={() => setShowForgot((v) => !v)}>
            Forgot password?
          </button>
        </div>
        <Input className="h-11" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      {showForgot && (
        <div className="rounded-md border bg-muted/40 p-3 text-sm">
          We'll email a reset link to <span className="font-medium break-all">{email || "your address"}</span>.
          <Button type="button" size="sm" variant="secondary" className="mt-2 h-11 w-full" disabled={busy} onClick={sendReset}>
            {busy ? "Sending…" : "Send reset link"}
          </Button>
        </div>
      )}
      <Button type="submit" className="h-11 w-full" disabled={busy}>{busy ? "Signing in..." : "Sign in"}</Button>
    </form>
  );
}

function SignUpForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success("Account created! Check your email to confirm.");
  };
  return (
    <form onSubmit={submit} className="mt-4 space-y-4">
      <div><Label>Full name</Label><Input className="h-11" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} /></div>
      <div><Label>Email</Label><Input className="h-11" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
      <div><Label>Password</Label><Input className="h-11" type="password" autoComplete="new-password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
      <Button type="submit" className="h-11 w-full" disabled={busy}>{busy ? "Creating..." : "Create account"}</Button>
    </form>
  );
}
