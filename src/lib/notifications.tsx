import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const SETTINGS_KEY = "chemtrack:notifications";
const SHOWN_KEY = "chemtrack:notifications:shown";
const POLL_MS = 60 * 60 * 1000; // hourly

export interface NotificationSettings {
  enabled: boolean;
  expiryDaysAhead: number;
  lowStock: boolean;
}

export const defaultSettings: NotificationSettings = {
  enabled: false,
  expiryDaysAhead: 30,
  lowStock: true,
};

export function getSettings(): NotificationSettings {
  if (typeof window === "undefined") return defaultSettings;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaultSettings;
    return { ...defaultSettings, ...JSON.parse(raw) };
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(s: NotificationSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

export async function requestPermission(): Promise<NotificationPermission> {
  if (typeof Notification === "undefined") return "denied";
  if (Notification.permission === "granted" || Notification.permission === "denied") return Notification.permission;
  return await Notification.requestPermission();
}

export function isSupported() {
  return typeof window !== "undefined" && "Notification" in window;
}

function notify(title: string, body: string, tag: string) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  try {
    new Notification(title, { body, tag, icon: "/icon-512.png", badge: "/icon-512.png" });
  } catch {
    // ignore
  }
}

function getShown(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(SHOWN_KEY) || "{}"); } catch { return {}; }
}
function markShown(map: Record<string, number>) {
  localStorage.setItem(SHOWN_KEY, JSON.stringify(map));
}

export async function checkAndNotify(settings = getSettings()) {
  if (!settings.enabled || typeof Notification === "undefined" || Notification.permission !== "granted") return;
  const { data, error } = await supabase.from("chemicals").select("id,name,quantity,min_stock_level,expiry_date");
  if (error || !data) return;
  const now = Date.now();
  const shown = getShown();
  const dayMs = 86400000;

  for (const c of data as any[]) {
    if (c.expiry_date) {
      const days = Math.floor((new Date(c.expiry_date).getTime() - now) / dayMs);
      if (days < 0) {
        const tag = `expired:${c.id}`;
        if (!shown[tag] || now - shown[tag] > 7 * dayMs) {
          notify("Expired chemical", `${c.name} expired ${Math.abs(days)}d ago`, tag);
          shown[tag] = now;
        }
      } else if (days <= settings.expiryDaysAhead) {
        const tag = `expiring:${c.id}:${days}`;
        if (!shown[tag]) {
          notify("Chemical expiring soon", `${c.name} expires in ${days} day${days === 1 ? "" : "s"}`, tag);
          shown[tag] = now;
        }
      }
    }
    if (settings.lowStock && Number(c.min_stock_level) > 0 && Number(c.quantity) <= Number(c.min_stock_level)) {
      const tag = `low:${c.id}`;
      if (!shown[tag] || now - shown[tag] > 3 * dayMs) {
        notify("Low stock", `${c.name}: ${c.quantity} remaining`, tag);
        shown[tag] = now;
      }
    }
  }
  markShown(shown);
}

export function useExpiryNotifications(userId?: string) {
  useEffect(() => {
    if (!userId) return;
    const settings = getSettings();
    if (!settings.enabled) return;
    checkAndNotify(settings);
    const id = setInterval(() => checkAndNotify(getSettings()), POLL_MS);
    return () => clearInterval(id);
  }, [userId]);
}
