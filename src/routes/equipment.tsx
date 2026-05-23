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
import { Plus, Pencil, Trash2, Wrench } from "lucide-react";
import { toast } from "sonner";
import { ImageUpload } from "@/components/image-upload";
import { ImageViewer } from "@/components/image-viewer";

export const Route = createFileRoute("/equipment")({
  component: () => <AppShell><Equipment /></AppShell>,
  head: () => ({ meta: [{ title: "Equipment — ChemTrack" }] }),
});

interface Item { id: string; name: string; category?: string; quantity: number; condition?: string; location?: string; purchase_date?: string; notes?: string; image_url?: string | null; }

function Equipment() {
  const qc = useQueryClient();
  const { user, isAdmin } = useAuth();
  const [editing, setEditing] = useState<Item | null>(null);
  const [open, setOpen] = useState(false);
  const [viewerSrc, setViewerSrc] = useState<string | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["equipment"],
    queryFn: async () => {
      const { data, error } = await supabase.from("equipment").select("*").order("name");
      if (error) throw error;
      return data as Item[];
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("equipment").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["equipment"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const condColor = (c?: string) => c === "good" ? "bg-success text-success-foreground" : c === "needs repair" ? "bg-warning text-warning-foreground" : c === "broken" ? "bg-destructive text-destructive-foreground" : "bg-muted";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Equipment</h1>
          <p className="text-sm text-muted-foreground">Track glassware and apparatus.</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
          <DialogTrigger asChild>
            <Button className="hidden sm:inline-flex" onClick={() => setEditing(null)}><Plus className="mr-2 h-4 w-4" /> Add equipment</Button>
          </DialogTrigger>
          <DialogTrigger asChild>
            <Button
              size="icon"
              onClick={() => setEditing(null)}
              className="sm:hidden fixed right-4 z-30 h-14 w-14 rounded-full shadow-elegant"
              style={{ bottom: "calc(env(safe-area-inset-bottom) + 5rem)" }}
              aria-label="Add equipment"
            >
              <Plus className="h-6 w-6" />
            </Button>
          </DialogTrigger>
          <EquipmentDialog editing={editing} onClose={() => setOpen(false)} userId={user!.id} />
        </Dialog>
      </div>

      {isLoading ? <p className="text-muted-foreground">Loading…</p> : items.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
          <Wrench className="h-10 w-10 text-primary" /><p>No equipment yet. Add your first item.</p>
        </CardContent></Card>
      ) : (
        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => (
            <Card key={it.id} className="shadow-card">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  {it.image_url && (
                    <button type="button" onClick={() => setViewerSrc(it.image_url!)} className="shrink-0">
                      <img src={it.image_url} alt={it.name} className="h-14 w-14 rounded-md object-cover border" />
                    </button>
                  )}
                  <div className="flex-1 flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold">{it.name}</div>
                      <div className="text-xs text-muted-foreground">{it.category || "—"}</div>
                    </div>
                    <Badge className={condColor(it.condition)}>{it.condition || "unknown"}</Badge>
                  </div>
                </div>
                <dl className="mt-4 space-y-1 text-sm">
                  <div className="flex justify-between"><dt className="text-muted-foreground">Quantity</dt><dd>{it.quantity}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted-foreground">Location</dt><dd>{it.location || "—"}</dd></div>
                  {it.purchase_date && <div className="flex justify-between"><dt className="text-muted-foreground">Purchased</dt><dd>{it.purchase_date}</dd></div>}
                </dl>
                {it.notes && <p className="mt-3 text-xs text-muted-foreground">{it.notes}</p>}
                <div className="mt-4 flex justify-end gap-1">
                  <Button size="sm" variant="ghost" onClick={() => { setEditing(it); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  {isAdmin && <Button size="sm" variant="ghost" onClick={() => { if (confirm(`Delete ${it.name}?`)) del.mutate(it.id); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <ImageViewer src={viewerSrc ?? ""} open={!!viewerSrc} onOpenChange={(v) => !v && setViewerSrc(null)} />
    </div>
  );
}

function EquipmentDialog({ editing, onClose, userId }: { editing: Item | null; onClose: () => void; userId: string }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<Partial<Item>>(editing ?? { quantity: 1, condition: "good" });
  const save = useMutation({
    mutationFn: async () => {
      const payload = { ...form, created_by: userId };
      if (editing) {
        const { error } = await supabase.from("equipment").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("equipment").insert(payload as any);
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success(editing ? "Updated" : "Added"); qc.invalidateQueries({ queryKey: ["equipment"] }); onClose(); },
    onError: (e: any) => toast.error(e.message),
  });
  return (
    <DialogContent className="w-[calc(100vw-1rem)] max-h-[92vh] overflow-y-auto p-4 sm:p-6">
      <DialogHeader><DialogTitle>{editing ? "Edit equipment" : "Add equipment"}</DialogTitle></DialogHeader>
      <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><Label>Name *</Label><Input className="h-11" required value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div><Label>Category</Label><Input className="h-11" value={form.category ?? ""} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Glassware, Instrument…" /></div>
        <div><Label>Quantity</Label><Input className="h-11" type="number" inputMode="numeric" value={form.quantity ?? 1} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} /></div>
        <div><Label>Condition</Label>
          <select className="h-11 w-full rounded-md border bg-background px-3 text-sm" value={form.condition ?? "good"} onChange={(e) => setForm({ ...form, condition: e.target.value })}>
            <option value="good">Good</option><option value="needs repair">Needs repair</option><option value="broken">Broken</option>
          </select>
        </div>
        <div><Label>Location</Label><Input className="h-11" value={form.location ?? ""} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
        <div className="sm:col-span-2"><Label>Purchase date</Label><Input className="h-11" type="date" value={form.purchase_date ?? ""} onChange={(e) => setForm({ ...form, purchase_date: e.target.value })} /></div>
        <div className="sm:col-span-2"><Label>Notes</Label><Textarea rows={3} value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        <DialogFooter className="sm:col-span-2 flex-col-reverse gap-2 sm:flex-row">
          <Button type="button" variant="ghost" className="h-11 w-full sm:w-auto" onClick={onClose}>Cancel</Button>
          <Button type="submit" className="h-11 w-full sm:w-auto" disabled={save.isPending}>{save.isPending ? "Saving…" : editing ? "Save" : "Add"}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
