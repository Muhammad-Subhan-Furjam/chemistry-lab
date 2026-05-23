import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Search, Beaker } from "lucide-react";
import { toast } from "sonner";
import { ImageUpload } from "@/components/image-upload";
import { ImageViewer } from "@/components/image-viewer";

export const Route = createFileRoute("/chemicals")({
  component: () => <AppShell><Chemicals /></AppShell>,
  head: () => ({ meta: [{ title: "Chemicals — ChemTrack" }] }),
});

interface Chemical {
  id: string; name: string; formula?: string; category?: string;
  quantity: number; unit: string; min_stock_level: number;
  supplier?: string; location?: string; hazard_class?: string;
  purchase_date?: string; expiry_date?: string; notes?: string;
  image_url?: string | null;
}

function Chemicals() {
  const qc = useQueryClient();
  const { user, isAdmin } = useAuth();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Chemical | null>(null);
  const [open, setOpen] = useState(false);
  const [viewerSrc, setViewerSrc] = useState<string | null>(null);

  const { data: chemicals = [], isLoading } = useQuery({
    queryKey: ["chemicals"],
    queryFn: async () => {
      const { data, error } = await supabase.from("chemicals").select("*").order("name");
      if (error) throw error;
      return data as Chemical[];
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("chemicals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["chemicals"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const filtered = chemicals.filter(c =>
    [c.name, c.formula, c.category, c.location, c.supplier].filter(Boolean).join(" ").toLowerCase().includes(search.toLowerCase())
  );

  const today = new Date();
  const status = (c: Chemical) => {
    if (c.expiry_date && new Date(c.expiry_date) < today) return { label: "Expired", cls: "bg-destructive text-destructive-foreground" };
    if (c.expiry_date) {
      const d = (new Date(c.expiry_date).getTime() - today.getTime()) / 86400000;
      if (d <= 30) return { label: "Expiring soon", cls: "bg-warning text-warning-foreground" };
    }
    if (c.min_stock_level > 0 && Number(c.quantity) <= Number(c.min_stock_level)) return { label: "Low stock", cls: "bg-warning text-warning-foreground" };
    return { label: "OK", cls: "bg-success text-success-foreground" };
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Chemicals</h1>
          <p className="text-sm text-muted-foreground">Manage your chemical reagent inventory.</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
          {/* Desktop "Add" button */}
          <DialogTrigger asChild>
            <Button className="hidden sm:inline-flex" onClick={() => setEditing(null)}>
              <Plus className="mr-2 h-4 w-4" /> Add chemical
            </Button>
          </DialogTrigger>
          {/* Mobile floating action button */}
          <DialogTrigger asChild>
            <Button
              size="icon"
              onClick={() => setEditing(null)}
              className="sm:hidden fixed right-4 z-30 h-14 w-14 rounded-full shadow-elegant"
              style={{ bottom: "calc(env(safe-area-inset-bottom) + 5rem)" }}
              aria-label="Add chemical"
            >
              <Plus className="h-6 w-6" />
            </Button>
          </DialogTrigger>
          <ChemicalDialog editing={editing} onClose={() => setOpen(false)} userId={user!.id} />
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search chemicals…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-11 sm:max-w-sm"
        />
      </div>

      {isLoading ? <p className="text-muted-foreground">Loading…</p> : filtered.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
          <Beaker className="h-10 w-10 text-primary" />
          <p>No chemicals yet. Add your first reagent to get started.</p>
        </CardContent></Card>
      ) : (
        <>
          {/* Mobile card list */}
          <ul className="space-y-3 sm:hidden">
            {filtered.map((c) => {
              const s = status(c);
              return (
                <li key={c.id}>
                  <Card className="shadow-card active:scale-[0.99] transition">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {c.image_url && (
                          <button type="button" onClick={() => setViewerSrc(c.image_url!)} className="shrink-0">
                            <img src={c.image_url} alt={c.name} className="h-14 w-14 rounded-md object-cover border" />
                          </button>
                        )}
                        <div className="flex-1 min-w-0 flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="font-semibold truncate">{c.name}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              {c.category || "Uncategorized"}
                              {c.formula && <span className="font-mono"> · {c.formula}</span>}
                            </div>
                          </div>
                          <Badge className={`${s.cls} shrink-0`}>{s.label}</Badge>
                        </div>
                      </div>
                      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                        <div><dt className="text-muted-foreground">Quantity</dt><dd className="font-medium">{c.quantity} {c.unit}</dd></div>
                        <div><dt className="text-muted-foreground">Location</dt><dd className="font-medium truncate">{c.location || "—"}</dd></div>
                        <div className="col-span-2"><dt className="text-muted-foreground">Expiry</dt><dd className="font-medium">{c.expiry_date || "—"}</dd></div>
                      </dl>
                      <div className="mt-3 flex justify-end gap-1">
                        <Button size="sm" variant="ghost" className="h-9" onClick={() => { setEditing(c); setOpen(true); }}>
                          <Pencil className="mr-1 h-4 w-4" /> Edit
                        </Button>
                        {isAdmin && (
                          <Button size="sm" variant="ghost" className="h-9 text-destructive" onClick={() => { if (confirm(`Delete ${c.name}?`)) del.mutate(c.id); }}>
                            <Trash2 className="mr-1 h-4 w-4" /> Delete
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </li>
              );
            })}
          </ul>

          {/* Desktop / tablet table */}
          <div className="hidden sm:block overflow-x-auto rounded-lg border bg-card shadow-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Name</th><th className="px-4 py-3">Formula</th>
                  <th className="px-4 py-3">Quantity</th><th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Expiry</th><th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((c) => {
                  const s = status(c);
                  return (
                    <tr key={c.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">
                        <div className="flex items-center gap-2">
                          {c.image_url ? (
                            <button type="button" onClick={() => setViewerSrc(c.image_url!)}>
                              <img src={c.image_url} alt={c.name} className="h-9 w-9 rounded object-cover border hover:ring-2 hover:ring-primary" />
                            </button>
                          ) : (
                            <div className="h-9 w-9 rounded bg-muted border" />
                          )}
                          <div>
                            {c.name}
                            <div className="text-xs text-muted-foreground">{c.category}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{c.formula || "—"}</td>
                      <td className="px-4 py-3">{c.quantity} {c.unit}</td>
                      <td className="px-4 py-3">{c.location || "—"}</td>
                      <td className="px-4 py-3">{c.expiry_date || "—"}</td>
                      <td className="px-4 py-3"><Badge className={s.cls}>{s.label}</Badge></td>
                      <td className="px-4 py-3 text-right">
                        <Button size="sm" variant="ghost" onClick={() => { setEditing(c); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                        {isAdmin && (
                          <Button size="sm" variant="ghost" onClick={() => { if (confirm(`Delete ${c.name}?`)) del.mutate(c.id); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
      <ImageViewer src={viewerSrc ?? ""} open={!!viewerSrc} onOpenChange={(v) => !v && setViewerSrc(null)} />
    </div>
  );
}

function ChemicalDialog({ editing, onClose, userId }: { editing: Chemical | null; onClose: () => void; userId: string }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<Partial<Chemical>>(editing ?? { unit: "g", quantity: 0, min_stock_level: 0 });

  const save = useMutation({
    mutationFn: async () => {
      const payload = { ...form, created_by: userId };
      if (editing) {
        const { error } = await supabase.from("chemicals").update(payload).eq("id", editing.id);
        if (error) throw error;
        await supabase.from("usage_logs").insert({ chemical_id: editing.id, user_id: userId, action: "updated", notes: form.name });
      } else {
        const { data, error } = await supabase.from("chemicals").insert(payload as any).select().single();
        if (error) throw error;
        await supabase.from("usage_logs").insert({ chemical_id: data.id, user_id: userId, action: "added", quantity_change: Number(form.quantity ?? 0) });
      }
    },
    onSuccess: () => { toast.success(editing ? "Updated" : "Added"); qc.invalidateQueries({ queryKey: ["chemicals"] }); onClose(); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <DialogContent className="max-w-2xl w-[calc(100vw-1rem)] max-h-[92vh] overflow-y-auto p-4 sm:p-6">
      <DialogHeader><DialogTitle>{editing ? "Edit chemical" : "Add chemical"}</DialogTitle></DialogHeader>
      <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label>Image</Label>
          <ImageUpload
            value={form.image_url ?? null}
            onChange={(url) => setForm({ ...form, image_url: url })}
            folder="chemicals"
            userId={userId}
          />
        </div>
        <div className="sm:col-span-2"><Label>Name *</Label><Input className="h-11" required value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div><Label>Formula</Label><Input className="h-11" value={form.formula ?? ""} onChange={(e) => setForm({ ...form, formula: e.target.value })} placeholder="e.g. H₂SO₄" /></div>
        <div><Label>Category</Label><Input className="h-11" value={form.category ?? ""} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Acid, Base, Solvent…" /></div>
        <div><Label>Quantity *</Label><Input className="h-11" type="number" inputMode="decimal" step="0.01" required value={form.quantity ?? 0} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} /></div>
        <div><Label>Unit</Label><Input className="h-11" value={form.unit ?? "g"} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="g, mL, L, kg" /></div>
        <div><Label>Min stock level</Label><Input className="h-11" type="number" inputMode="decimal" step="0.01" value={form.min_stock_level ?? 0} onChange={(e) => setForm({ ...form, min_stock_level: Number(e.target.value) })} /></div>
        <div><Label>Hazard class</Label><Input className="h-11" value={form.hazard_class ?? ""} onChange={(e) => setForm({ ...form, hazard_class: e.target.value })} placeholder="Flammable, Corrosive…" /></div>
        <div><Label>Supplier</Label><Input className="h-11" value={form.supplier ?? ""} onChange={(e) => setForm({ ...form, supplier: e.target.value })} /></div>
        <div><Label>Location</Label><Input className="h-11" value={form.location ?? ""} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Cabinet A2" /></div>
        <div><Label>Purchase date</Label><Input className="h-11" type="date" value={form.purchase_date ?? ""} onChange={(e) => setForm({ ...form, purchase_date: e.target.value })} /></div>
        <div><Label>Expiry date</Label><Input className="h-11" type="date" value={form.expiry_date ?? ""} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} /></div>
        <div className="sm:col-span-2"><Label>Notes</Label><Textarea rows={3} value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        <DialogFooter className="sm:col-span-2 flex-col-reverse gap-2 sm:flex-row">
          <Button type="button" variant="ghost" className="h-11 w-full sm:w-auto" onClick={onClose}>Cancel</Button>
          <Button type="submit" className="h-11 w-full sm:w-auto" disabled={save.isPending}>{save.isPending ? "Saving…" : editing ? "Save changes" : "Add chemical"}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
