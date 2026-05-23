import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History } from "lucide-react";

export const Route = createFileRoute("/usage")({
  component: () => <AppShell><Usage /></AppShell>,
  head: () => ({ meta: [{ title: "Usage logs — ChemTrack" }] }),
});

function Usage() {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["usage_logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("usage_logs")
        .select("*, chemicals(name, unit)")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      const userIds = Array.from(new Set((data ?? []).map((d: any) => d.user_id).filter(Boolean)));
      const { data: profs } = userIds.length
        ? await supabase.from("profiles").select("id, full_name, email").in("id", userIds)
        : { data: [] as any[] };
      const map = new Map((profs ?? []).map((p: any) => [p.id, p]));
      return (data ?? []).map((d: any) => ({ ...d, profiles: map.get(d.user_id) }));
    },
  });

  const actionColor: Record<string, string> = {
    added: "bg-success text-success-foreground",
    updated: "bg-primary text-primary-foreground",
    used: "bg-accent text-accent-foreground",
    restocked: "bg-success text-success-foreground",
    deleted: "bg-destructive text-destructive-foreground",
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Usage logs</h1>
        <p className="text-sm text-muted-foreground">Audit trail of every change to your inventory.</p>
      </div>
      {isLoading ? <p className="text-muted-foreground">Loading…</p> : logs.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
          <History className="h-10 w-10 text-primary" /><p>No activity yet.</p>
        </CardContent></Card>
      ) : (
        <Card><CardContent className="p-0">
          <ul className="divide-y">
            {logs.map((l) => (
              <li key={l.id} className="p-3 sm:p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={actionColor[l.action] ?? "bg-muted"}>{l.action}</Badge>
                  <span className="font-medium break-words">{l.chemicals?.name ?? "—"}</span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground break-words">
                  {l.profiles?.full_name || l.profiles?.email || "Unknown user"} · {new Date(l.created_at).toLocaleString()}
                  {l.quantity_change != null && ` · ${l.quantity_change} ${l.chemicals?.unit ?? ""}`}
                </div>
                {l.notes && <div className="mt-1 text-xs text-muted-foreground break-words">{l.notes}</div>}
              </li>
            ))}
          </ul>
        </CardContent></Card>
      )}
    </div>
  );
}
