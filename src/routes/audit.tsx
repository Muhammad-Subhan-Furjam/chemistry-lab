import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollText } from "lucide-react";
import { format } from "date-fns";

export const Route = createFileRoute("/audit")({
  component: () => <AppShell><AuditPage /></AppShell>,
  head: () => ({ meta: [{ title: "Audit log — ChemTrack" }] }),
});

function AuditPage() {
  const { isAdmin, loading } = useAuth();
  const nav = useNavigate();

  useEffect(() => { if (!loading && !isAdmin) nav({ to: "/dashboard" }); }, [isAdmin, loading, nav]);

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["audit_logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data ?? [];
    },
    enabled: isAdmin,
  });

  if (!isAdmin) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><ScrollText className="h-7 w-7 text-primary" /> Audit log</h1>
        <p className="text-muted-foreground">Sensitive actions performed across the system.</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Recent events ({logs.length})</CardTitle></CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 text-sm text-muted-foreground">Loading…</div>
          ) : logs.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">No events yet.</div>
          ) : (
            <ul className="divide-y">
              {logs.map((l: any) => (
                <li key={l.id} className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{l.action}</Badge>
                      {l.details?.role && <Badge variant="outline">{l.details.role}</Badge>}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">{l.actor_email || l.actor_id || "system"}</span>
                      {l.target_email && <> → <span className="font-medium">{l.target_email}</span></>}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">{format(new Date(l.created_at), "PPp")}</div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
