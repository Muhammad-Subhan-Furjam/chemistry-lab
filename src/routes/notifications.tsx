import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Bell, BellOff } from "lucide-react";
import { toast } from "sonner";
import { defaultSettings, getSettings, isSupported, requestPermission, saveSettings, checkAndNotify, type NotificationSettings } from "@/lib/notifications";

export const Route = createFileRoute("/notifications")({
  component: () => <AppShell><Notifications /></AppShell>,
  head: () => ({ meta: [{ title: "Notifications — ChemTrack" }] }),
});

function Notifications() {
  const [s, setS] = useState<NotificationSettings>(defaultSettings);
  const [perm, setPerm] = useState<NotificationPermission>("default");
  const supported = isSupported();

  useEffect(() => {
    setS(getSettings());
    if (typeof Notification !== "undefined") setPerm(Notification.permission);
  }, []);

  const update = (patch: Partial<NotificationSettings>) => {
    const next = { ...s, ...patch };
    setS(next); saveSettings(next);
  };

  const toggle = async (enabled: boolean) => {
    if (enabled) {
      const p = await requestPermission();
      setPerm(p);
      if (p !== "granted") {
        toast.error("Permission denied. Enable notifications in your browser settings.");
        return;
      }
      toast.success("Notifications enabled");
    }
    update({ enabled });
  };

  const test = async () => {
    const p = await requestPermission();
    setPerm(p);
    if (p !== "granted") { toast.error("Permission denied"); return; }
    new Notification("ChemTrack test", { body: "Notifications are working ✓", icon: "/icon-512.png" });
  };

  const runCheck = async () => {
    await checkAndNotify({ ...s, enabled: true });
    toast.success("Checked inventory for alerts");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Notifications</h1>
        <p className="text-sm text-muted-foreground">Get alerted when chemicals are expiring or running low.</p>
      </div>

      {!supported && (
        <Card className="border-warning"><CardContent className="p-4 text-sm">
          Your browser does not support notifications.
        </CardContent></Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {s.enabled ? <Bell className="h-5 w-5 text-primary" /> : <BellOff className="h-5 w-5 text-muted-foreground" />}
            Push notifications
          </CardTitle>
          <CardDescription>
            Permission: <span className="font-medium">{perm}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
            <div>
              <Label className="text-base">Enable alerts</Label>
              <p className="text-xs text-muted-foreground">Receive expiry and low-stock notifications.</p>
            </div>
            <Switch checked={s.enabled} onCheckedChange={toggle} disabled={!supported} />
          </div>

          <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
            <div>
              <Label className="text-base">Low-stock alerts</Label>
              <p className="text-xs text-muted-foreground">Notify when quantity drops to the minimum level.</p>
            </div>
            <Switch checked={s.lowStock} onCheckedChange={(v) => update({ lowStock: v })} disabled={!s.enabled} />
          </div>

          <div className="rounded-lg border p-4">
            <Label className="text-base">Expiry warning window</Label>
            <p className="text-xs text-muted-foreground mb-2">Days before expiry to start alerting.</p>
            <Input
              type="number" min={1} max={365} className="h-11 w-32"
              value={s.expiryDaysAhead}
              onChange={(e) => update({ expiryDaysAhead: Math.max(1, Number(e.target.value) || 30) })}
              disabled={!s.enabled}
            />
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <Button onClick={test} variant="outline" className="h-11">Send test notification</Button>
            <Button onClick={runCheck} className="h-11" disabled={!s.enabled}>Check now</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
