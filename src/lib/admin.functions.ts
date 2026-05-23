import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const InviteSchema = z.object({
  email: z.string().email().max(255),
  fullName: z.string().min(1).max(120),
  password: z.string().min(8).max(72),
  role: z.enum(["lab_assistant", "admin", "super_admin"]),
});

export const inviteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => InviteSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;

    // Authorize: must be admin or super_admin. Only super_admin may grant admin/super_admin.
    const { data: rolesData, error: rolesErr } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    if (rolesErr) throw new Error(rolesErr.message);
    const myRoles = (rolesData ?? []).map((r) => r.role as string);
    const isSuper = myRoles.includes("super_admin");
    const isAdmin = isSuper || myRoles.includes("admin");
    if (!isAdmin) throw new Error("Forbidden");
    if (data.role !== "lab_assistant" && !isSuper) {
      throw new Error("Only super admins can grant admin or super admin roles.");
    }

    // Create user
    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.fullName },
    });
    if (createErr || !created.user) throw new Error(createErr?.message || "Failed to create user");

    const newId = created.user.id;

    // Ensure profile exists (handle_new_user trigger should have created it; upsert defensively)
    await supabaseAdmin
      .from("profiles")
      .upsert({ id: newId, email: data.email, full_name: data.fullName });

    // Replace default lab_assistant role with requested role if different
    await supabaseAdmin.from("user_roles").delete().eq("user_id", newId);
    const { error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: newId, role: data.role });
    if (roleErr) throw new Error(roleErr.message);

    // Audit
    await supabaseAdmin.from("audit_logs").insert({
      actor_id: userId,
      action: "user_invited",
      target_user_id: newId,
      target_email: data.email,
      details: { role: data.role },
    });

    return { ok: true, userId: newId };
  });
