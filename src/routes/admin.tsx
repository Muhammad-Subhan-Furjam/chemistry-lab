import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ScrollText, UserPlus } from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: () => <AppShell><Admin /></AppShell>,
  head: () => ({ meta: [{ title: "Admin — ChemTrack" }] }),
});

function Admin() {
  const { isAdmin, isSuperAdmin, loading, user } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();

  useEffect(() => { if (!loading && !isAdmin) nav({ to: "/dashboard" }); }, [isAdmin, loading, nav]);

  const { data: users = [] } = useQuery({
    queryKey: ["admin_users"],
    queryFn: async () => {
      const [profilesRes, rolesRes] = await Promise.all([
        supabase.from("profiles").select("*"),
        supabase.from("user_roles").select("*"),
      ]);
      const roles = rolesRes.data ?? [];
      return (profilesRes.data ?? []).map((p: any) => ({
        ...p,
        roles: roles.filter((r: any) => r.user_id === p.id).map((r: any) => r.role),
      }));
    },
    enabled: isAdmin,
  });

  const setRole = useMutation({
    mutationFn: async ({ userId, role, grant }: { userId: string; role: "admin" | "super_admin"; grant: boolean }) => {
      if (grant) {
        const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success("Roles updated"); qc.invalidateQueries({ queryKey: ["admin_users"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  if (!isAdmin) return null;

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="space-y-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Admin</h1>
          <p className="text-sm text-muted-foreground">
            {isSuperAdmin ? "Manage users, roles and audit history." : "View users and audit history. Only super admins can change roles."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="secondary" className="h-11 flex-1 sm:flex-none"><Link to="/audit"><ScrollText className="mr-2 h-4 w-4" /> Audit log</Link></Button>
          <Button asChild className="h-11 flex-1 sm:flex-none"><Link to="/invite"><UserPlus className="mr-2 h-4 w-4" /> Invite user</Link></Button>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Users ({users.length})</CardTitle></CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y">
            {users.map((u: any) => {
              const isUserSuper = u.roles.includes("super_admin");
              const isUserAdmin = u.roles.includes("admin");
              const isSelf = u.id === user?.id;
              return (
                <li key={u.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="font-medium break-words">{u.full_name || u.email}</div>
                    <div className="text-xs text-muted-foreground break-all">{u.email}</div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {u.roles.length === 0 && <Badge variant="outline">no role</Badge>}
                      {u.roles.map((r: string) => (
                        <Badge key={r} variant={r === "super_admin" ? "default" : "secondary"}>{r}</Badge>
                      ))}
                    </div>
                  </div>
                  {isSuperAdmin && !isSelf && (
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" className="h-10 flex-1 sm:flex-none" variant={isUserAdmin ? "outline" : "default"}
                        onClick={() => setRole.mutate({ userId: u.id, role: "admin", grant: !isUserAdmin })}>
                        {isUserAdmin ? "Revoke admin" : "Make admin"}
                      </Button>
                      <Button size="sm" className="h-10 flex-1 sm:flex-none" variant={isUserSuper ? "outline" : "secondary"}
                        onClick={() => setRole.mutate({ userId: u.id, role: "super_admin", grant: !isUserSuper })}>
                        {isUserSuper ? "Revoke super admin" : "Make super admin"}
                      </Button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
