import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Beaker, AlertTriangle, Clock, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/dashboard")({
  component: () => (<AppShell><Dashboard /></AppShell>),
  head: () => ({ meta: [{ title: "Dashboard — ChemTrack" }] }),
});

function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const [chemicals, equipment] = await Promise.all([
        supabase.from("chemicals").select("*"),
        supabase.from("equipment").select("id"),
      ]);
      return { chemicals: chemicals.data ?? [], equipment: equipment.data ?? [] };
    },
  });

  if (isLoading) return <div className="text-muted-foreground">Loading dashboard…</div>;

  const chemicals = data?.chemicals ?? [];
  const today = new Date();
  const in30 = new Date(); in30.setDate(today.getDate() + 30);

  const expiring = chemicals.filter((c: any) => c.expiry_date && new Date(c.expiry_date) <= in30 && new Date(c.expiry_date) >= today);
  const expired = chemicals.filter((c: any) => c.expiry_date && new Date(c.expiry_date) < today);
  const lowStock = chemicals.filter((c: any) => Number(c.quantity) <= Number(c.min_stock_level) && Number(c.min_stock_level) > 0);

  const stats = [
    { label: "Total chemicals", value: chemicals.length, icon: Beaker, color: "text-primary" },
    { label: "Equipment items", value: data?.equipment.length ?? 0, icon: Wrench, color: "text-primary" },
    { label: "Low stock", value: lowStock.length, icon: AlertTriangle, color: "text-warning" },
    { label: "Expiring/Expired", value: expiring.length + expired.length, icon: Clock, color: "text-destructive" },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of your laboratory inventory.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="shadow-card">
            <CardContent className="flex items-center justify-between gap-3 p-4 sm:p-6">
              <div className="min-w-0">
                <div className="text-xs sm:text-sm text-muted-foreground truncate">{s.label}</div>
                <div className="mt-1 text-2xl sm:text-3xl font-bold">{s.value}</div>
              </div>
              <s.icon className={`h-7 w-7 sm:h-8 sm:w-8 shrink-0 ${s.color}`} />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5 text-destructive" /> Expiry alerts</CardTitle>
            <Link to="/chemicals" className="text-sm text-primary hover:underline">View all →</Link>
          </CardHeader>
          <CardContent>
            {expired.length === 0 && expiring.length === 0 && <p className="text-sm text-muted-foreground">No expiry alerts. You're all clear.</p>}
            <ul className="divide-y">
              {expired.map((c: any) => (
                <li key={c.id} className="flex items-center justify-between py-3">
                  <div><div className="font-medium">{c.name}</div><div className="text-xs text-muted-foreground">Expired {c.expiry_date}</div></div>
                  <Badge variant="destructive">Expired</Badge>
                </li>
              ))}
              {expiring.map((c: any) => (
                <li key={c.id} className="flex items-center justify-between py-3">
                  <div><div className="font-medium">{c.name}</div><div className="text-xs text-muted-foreground">Expires {c.expiry_date}</div></div>
                  <Badge className="bg-warning text-warning-foreground hover:bg-warning">Soon</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-warning" /> Low stock</CardTitle>
            <Link to="/chemicals" className="text-sm text-primary hover:underline">View all →</Link>
          </CardHeader>
          <CardContent>
            {lowStock.length === 0 && <p className="text-sm text-muted-foreground">Stock levels look healthy.</p>}
            <ul className="divide-y">
              {lowStock.map((c: any) => (
                <li key={c.id} className="flex items-center justify-between py-3">
                  <div><div className="font-medium">{c.name}</div><div className="text-xs text-muted-foreground">{c.quantity} {c.unit} (min {c.min_stock_level})</div></div>
                  <Badge className="bg-warning text-warning-foreground hover:bg-warning">Low</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
