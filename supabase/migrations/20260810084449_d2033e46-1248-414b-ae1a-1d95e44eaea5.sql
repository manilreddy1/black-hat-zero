
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM anon, authenticated;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION private.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin'::public.app_role, 'coordinator'::public.app_role, 'payment_verifier'::public.app_role)
  );
$$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.is_staff(uuid) FROM PUBLIC, anon, authenticated;

DROP POLICY "own profile read" ON public.profiles;
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING ((id = auth.uid()) OR private.is_staff(auth.uid()));

DROP POLICY "roles readable by staff" ON public.user_roles;
CREATE POLICY "roles readable by staff" ON public.user_roles FOR SELECT TO authenticated USING ((user_id = auth.uid()) OR private.has_role(auth.uid(), 'admin'));

DROP POLICY "settings admin write" ON public.event_settings;
CREATE POLICY "settings admin write" ON public.event_settings FOR UPDATE TO authenticated USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));

DROP POLICY "teams staff read" ON public.teams;
CREATE POLICY "teams staff read" ON public.teams FOR SELECT TO authenticated USING (private.is_staff(auth.uid()));

DROP POLICY "members staff read" ON public.team_members;
CREATE POLICY "members staff read" ON public.team_members FOR SELECT TO authenticated USING (private.is_staff(auth.uid()));

DROP POLICY "reg staff read" ON public.registrations;
CREATE POLICY "reg staff read" ON public.registrations FOR SELECT TO authenticated USING (private.is_staff(auth.uid()));

DROP POLICY "payments staff read" ON public.payments;
CREATE POLICY "payments staff read" ON public.payments FOR SELECT TO authenticated USING (private.is_staff(auth.uid()));

DROP POLICY "verifications staff read" ON public.payment_verifications;
CREATE POLICY "verifications staff read" ON public.payment_verifications FOR SELECT TO authenticated USING (private.is_staff(auth.uid()));

DROP POLICY "history staff read" ON public.registration_status_history;
CREATE POLICY "history staff read" ON public.registration_status_history FOR SELECT TO authenticated USING (private.is_staff(auth.uid()));

DROP POLICY "audit admin read" ON public.audit_logs;
CREATE POLICY "audit admin read" ON public.audit_logs FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'));

DROP POLICY "messages staff read" ON public.contact_messages;
CREATE POLICY "messages staff read" ON public.contact_messages FOR SELECT TO authenticated USING (private.is_staff(auth.uid()));

DROP POLICY "waitlist staff read" ON public.waitlist;
CREATE POLICY "waitlist staff read" ON public.waitlist FOR SELECT TO authenticated USING (private.is_staff(auth.uid()));

DROP POLICY "timeline auth read" ON public.timeline_items;
CREATE POLICY "timeline auth read" ON public.timeline_items FOR SELECT TO authenticated USING (is_published OR private.is_staff(auth.uid()));

DROP POLICY "prizes auth read" ON public.prizes;
CREATE POLICY "prizes auth read" ON public.prizes FOR SELECT TO authenticated USING (is_published OR private.is_staff(auth.uid()));

DROP POLICY "rules auth read" ON public.rules;
CREATE POLICY "rules auth read" ON public.rules FOR SELECT TO authenticated USING (is_published OR private.is_staff(auth.uid()));

DROP POLICY "faqs auth read" ON public.faqs;
CREATE POLICY "faqs auth read" ON public.faqs FOR SELECT TO authenticated USING (is_published OR private.is_staff(auth.uid()));

DROP POLICY "sponsors auth read" ON public.sponsors;
CREATE POLICY "sponsors auth read" ON public.sponsors FOR SELECT TO authenticated USING (is_published OR private.is_staff(auth.uid()));

DROP POLICY "challenges auth read" ON public.challenges;
CREATE POLICY "challenges auth read" ON public.challenges FOR SELECT TO authenticated USING (is_published OR private.is_staff(auth.uid()));

DROP POLICY "announcements auth read" ON public.announcements;
CREATE POLICY "announcements auth read" ON public.announcements FOR SELECT TO authenticated USING (is_published OR private.is_staff(auth.uid()));

DROP POLICY "site_texts admin write" ON public.site_texts;
CREATE POLICY "site_texts admin write" ON public.site_texts FOR ALL TO authenticated USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));

DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);
DROP FUNCTION IF EXISTS public.is_staff(uuid);

CREATE POLICY "payment proofs staff read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'payment-proofs' AND private.is_staff(auth.uid()));
CREATE POLICY "payment proofs admin write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'payment-proofs' AND private.has_role(auth.uid(), 'admin'));
CREATE POLICY "payment proofs admin update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'payment-proofs' AND private.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'payment-proofs' AND private.has_role(auth.uid(), 'admin'));
CREATE POLICY "payment proofs admin delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'payment-proofs' AND private.has_role(auth.uid(), 'admin'));
