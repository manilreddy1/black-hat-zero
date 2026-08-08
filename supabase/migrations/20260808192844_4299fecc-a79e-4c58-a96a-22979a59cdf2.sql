
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_staff(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated;

DROP POLICY "timeline public read" ON public.timeline_items;
DROP POLICY "prizes public read" ON public.prizes;
DROP POLICY "rules public read" ON public.rules;
DROP POLICY "faqs public read" ON public.faqs;
DROP POLICY "sponsors public read" ON public.sponsors;
DROP POLICY "challenges public read" ON public.challenges;
DROP POLICY "announcements public read" ON public.announcements;
CREATE POLICY "timeline anon read" ON public.timeline_items FOR SELECT TO anon USING (is_published);
CREATE POLICY "timeline auth read" ON public.timeline_items FOR SELECT TO authenticated USING (is_published OR public.is_staff(auth.uid()));
CREATE POLICY "prizes anon read" ON public.prizes FOR SELECT TO anon USING (is_published);
CREATE POLICY "prizes auth read" ON public.prizes FOR SELECT TO authenticated USING (is_published OR public.is_staff(auth.uid()));
CREATE POLICY "rules anon read" ON public.rules FOR SELECT TO anon USING (is_published);
CREATE POLICY "rules auth read" ON public.rules FOR SELECT TO authenticated USING (is_published OR public.is_staff(auth.uid()));
CREATE POLICY "faqs anon read" ON public.faqs FOR SELECT TO anon USING (is_published);
CREATE POLICY "faqs auth read" ON public.faqs FOR SELECT TO authenticated USING (is_published OR public.is_staff(auth.uid()));
CREATE POLICY "sponsors anon read" ON public.sponsors FOR SELECT TO anon USING (is_published);
CREATE POLICY "sponsors auth read" ON public.sponsors FOR SELECT TO authenticated USING (is_published OR public.is_staff(auth.uid()));
CREATE POLICY "challenges anon read" ON public.challenges FOR SELECT TO anon USING (is_published);
CREATE POLICY "challenges auth read" ON public.challenges FOR SELECT TO authenticated USING (is_published OR public.is_staff(auth.uid()));
CREATE POLICY "announcements anon read" ON public.announcements FOR SELECT TO anon USING (is_published);
CREATE POLICY "announcements auth read" ON public.announcements FOR SELECT TO authenticated USING (is_published OR public.is_staff(auth.uid()));
