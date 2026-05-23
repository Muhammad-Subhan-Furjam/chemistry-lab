import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { inviteUser } from "@/lib/admin.functions";
import { UserPlus } from "lucide-react";

export const Route = createFileRoute("/invite")({
  component: () => <AppShell><InvitePage /></AppShell>,
  head: () => ({ meta: [{ title: "Invite user — ChemTrack" }] }),
});

function InvitePage() {
  const { isAdmin, isSuperAdmin, loading } = useAuth();
  const nav = useNavigate();
  const invite = useServerFn(inviteUser);

  useEffect(() => { if (!loading && !isAdmin) nav({ to: "/dashboard" }); }, [isAdmin, loading, nav]);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"lab_assistant" | "admin" | "super_admin">("lab_assistant");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await invite({ data: { fullName, email, password, role } });
      toast.success(`Invited ${email}`);
      setFullName(""); setEmail(""); setPassword(""); setRole("lab_assistant");
    } catch (err: any) {
      toast.error(err?.message || "Failed to invite user");
    } finally {
      setBusy(false);
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="space-y-5 sm:space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2"><UserPlus className="h-6 w-6 sm:h-7 sm:w-7 text-primary" /> Invite user</h1>
        <p className="text-sm text-muted-foreground">Create a new lab account. The user can sign in immediately with the password you set.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>New account</CardTitle>
          <CardDescription>Share the credentials with the user privately. They can change their password from the reset flow.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div><Label>Full name</Label><Input className="h-11" required value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
            <div><Label>Email</Label><Input className="h-11" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <div><Label>Temporary password</Label><Input className="h-11" type="text" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
            <div>
              <Label>Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as any)}>
                <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="lab_assistant">Lab assistant</SelectItem>
                  <SelectItem value="admin" disabled={!isSuperAdmin}>Admin {isSuperAdmin ? "" : "(super admin only)"}</SelectItem>
                  <SelectItem value="super_admin" disabled={!isSuperAdmin}>Super admin {isSuperAdmin ? "" : "(super admin only)"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={busy} className="h-11 w-full sm:w-auto">{busy ? "Creating…" : "Create user"}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
