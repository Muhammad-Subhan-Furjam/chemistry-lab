
CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin'::public.app_role,'super_admin'::public.app_role)
  )
$$;

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  actor_email text,
  action text NOT NULL,
  target_user_id uuid,
  target_email text,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff view audit logs" ON public.audit_logs
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Authenticated insert audit logs" ON public.audit_logs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE OR REPLACE FUNCTION public.log_role_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_actor_email text;
  v_target_email text;
  v_role public.app_role;
  v_target uuid;
  v_action text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_target := NEW.user_id; v_role := NEW.role; v_action := 'role_granted';
  ELSE
    v_target := OLD.user_id; v_role := OLD.role; v_action := 'role_revoked';
  END IF;
  SELECT email INTO v_actor_email FROM public.profiles WHERE id = v_actor;
  SELECT email INTO v_target_email FROM public.profiles WHERE id = v_target;
  INSERT INTO public.audit_logs (actor_id, actor_email, action, target_user_id, target_email, details)
  VALUES (v_actor, v_actor_email, v_action, v_target, v_target_email, jsonb_build_object('role', v_role));
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_log_role_change_ins ON public.user_roles;
DROP TRIGGER IF EXISTS trg_log_role_change_del ON public.user_roles;
CREATE TRIGGER trg_log_role_change_ins AFTER INSERT ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.log_role_change();
CREATE TRIGGER trg_log_role_change_del AFTER DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.log_role_change();

DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;
CREATE POLICY "Super admins manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'::public.app_role));

DROP POLICY IF EXISTS "Admins delete chemicals" ON public.chemicals;
CREATE POLICY "Staff delete chemicals" ON public.chemicals
  FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Admins delete equipment" ON public.equipment;
CREATE POLICY "Staff delete equipment" ON public.equipment
  FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));
