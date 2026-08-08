CREATE TABLE public.site_texts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value text NOT NULL DEFAULT '',
  group_name text NOT NULL DEFAULT 'general',
  label text NOT NULL DEFAULT '',
  multiline boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.site_texts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_texts TO authenticated;
GRANT ALL ON public.site_texts TO service_role;

ALTER TABLE public.site_texts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "site_texts public read" ON public.site_texts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "site_texts admin write" ON public.site_texts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER t_site_texts_updated BEFORE UPDATE ON public.site_texts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.site_texts (key, value, group_name, label, multiline, sort_order) VALUES
('brand.name_prefix','BLACK','brand','Brand name (first part)',false,1),
('brand.name_suffix','HAT#0','brand','Brand name (highlighted part)',false,2),
('brand.kicker','HACKATHON FOR HACKERS','brand','Brand kicker',false,3),
('nav.home','Home','nav','Nav: home',false,1),
('nav.about','About','nav','Nav: about',false,2),
('nav.event','Event','nav','Nav: event',false,3),
('nav.timeline','Timeline','nav','Nav: timeline',false,4),
('nav.rules','Rules','nav','Nav: rules',false,5),
('nav.prizes','Prizes','nav','Nav: prizes',false,6),
('nav.faq','FAQ','nav','Nav: FAQ',false,7),
('nav.status','Status','nav','Nav: status',false,8),
('nav.register','Register Now','nav','Nav: register button',false,9),
('hero.kicker','HACKATHON FOR HACKERS','hero','Hero kicker',false,1),
('hero.title_line1','BLACK','hero','Hero title line 1',false,2),
('hero.title_line2','HAT#0','hero','Hero title line 2 (red)',false,3),
('hero.subtitle_line1','CODE. BREAK. INNOVATE.','hero','Hero subtitle line 1',false,4),
('hero.subtitle_line2','OWN THE SYSTEM.','hero','Hero subtitle line 2',false,5),
('hero.cta_primary','[ Register Your Team ]','hero','Hero primary button',false,6),
('hero.cta_secondary','[ Explore Event ]','hero','Hero secondary button',false,7),
('hero.countdown_label','COUNTDOWN TO BREACH','hero','Countdown label',false,8),
('hero.countdown_label_live','EVENT IN PROGRESS','hero','Countdown label (live)',false,9),
('hero.live_badge','LIVE — HACKATHON IN PROGRESS','hero','Live badge text',false,10),
('about.eyebrow','// 01 — ABOUT','sections','About eyebrow',false,1),
('about.title','Think like a hacker, innovate like a leader','sections','About title',false,2),
('about.card1_title','OFFENSIVE MINDSET','about','About card 1 title',false,1),
('about.card1_body','Break systems before attackers do. Every track rewards depth over polish.','about','About card 1 body',true,2),
('about.card2_title','24 HOURS','about','About card 2 title',false,3),
('about.card2_body','One night. One objective. Ship something that survives a real adversary.','about','About card 2 body',true,4),
('about.card3_title','REAL JUDGES','about','About card 3 title',false,5),
('about.card3_body','Security engineers and researchers score your exploit chain and defence.','about','About card 3 body',true,6),
('about.card4_title','OPEN TRACKS','about','About card 4 title',false,7),
('about.card4_body','Web, crypto, reversing, forensics, AI security and a free build track.','about','About card 4 body',true,8),
('event.eyebrow','// 02 — EVENT BRIEF','sections','Event eyebrow',false,3),
('event.title','Mission parameters','sections','Event title',false,4),
('event.subtitle','Everything below is live from the organiser control panel.','sections','Event subtitle',true,5),
('challenges.eyebrow','// 03 — TRACKS','sections','Tracks eyebrow',false,6),
('challenges.title','Challenge tracks','sections','Tracks title',false,7),
('challenges.subtitle','Pick your battlefield. Each track is scored independently.','sections','Tracks subtitle',true,8),
('timeline.eyebrow','// 04 — TIMELINE','sections','Timeline eyebrow',false,9),
('timeline.title','Operation schedule','sections','Timeline title',false,10),
('timeline.subtitle','','sections','Timeline subtitle',true,11),
('rules.eyebrow','// 05 — PROTOCOL','sections','Rules eyebrow',false,12),
('rules.title','Rules of engagement','sections','Rules title',false,13),
('rules.subtitle','Read carefully. Violations end your run.','sections','Rules subtitle',true,14),
('prizes.eyebrow','// 06 — BOUNTY','sections','Prizes eyebrow',false,15),
('prizes.title','Prize pool','sections','Prizes title',false,16),
('prizes.subtitle','','sections','Prizes subtitle',true,17),
('sponsors.eyebrow','// 07 — BACKED BY','sections','Sponsors eyebrow',false,18),
('sponsors.title','Sponsors & partners','sections','Sponsors title',false,19),
('faq.eyebrow','// 08 — FAQ','sections','FAQ eyebrow',false,20),
('faq.title','Frequently asked','sections','FAQ title',false,21),
('contact.eyebrow','// 09 — CONTACT','sections','Contact eyebrow',false,22),
('contact.title','Open a channel','sections','Contact title',false,23),
('footer.nav_title','Navigate','footer','Footer nav heading',false,1),
('footer.contact_title','Contact','footer','Footer contact heading',false,2),
('footer.bottom','CODE. BREAK. INNOVATE. OWN THE SYSTEM.','footer','Footer bottom line',false,3),
('register.title','Register your team','register','Register page title',false,1),
('register.subtitle','Assemble your crew. Payment is verified manually by the organisers.','register','Register page subtitle',true,2),
('register.closed_title','Registrations are closed','register','Closed heading',false,3),
('register.closed_message','Team registration for this edition is currently closed. Follow our channels for the next drop.','register','Closed message',true,4),
('status.title','Trace your registration','status','Status page title',false,1),
('status.subtitle','Enter your registration code or team email to pull live status.','status','Status page subtitle',true,2),
('seo.home_title','BLACK HAT#0 ''26 — Hackathon for Hackers','seo','Home page title',false,1),
('seo.home_description','BLACK HAT ZERO ''26: a 24-hour hackathon for hackers. Think like a hacker, innovate like a leader. Register your team of up to 4.','seo','Home meta description',true,2),
('maintenance.title','SYSTEM MAINTENANCE','maintenance','Maintenance title',false,1),
('maintenance.message','The site is temporarily offline for maintenance. Check back shortly.','maintenance','Maintenance message',true,2);