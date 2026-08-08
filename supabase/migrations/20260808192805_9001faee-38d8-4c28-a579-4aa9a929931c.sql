
-- ROLES
CREATE TYPE public.app_role AS ENUM ('admin','coordinator','payment_verifier');
CREATE TYPE public.reg_status AS ENUM ('DRAFT','PAYMENT_PENDING','PAYMENT_REVIEW','PAYMENT_APPROVED','REGISTERED','PAYMENT_REJECTED','CANCELLED');

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id);
$$;

CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "roles readable by staff" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- EVENT SETTINGS (singleton)
CREATE TABLE public.event_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT NOT NULL DEFAULT 'BLACK HAT#0',
  tagline TEXT NOT NULL DEFAULT 'Think like a hacker, innovate like a leader, own the system.',
  about TEXT NOT NULL DEFAULT '',
  event_date DATE NOT NULL DEFAULT '2026-03-14',
  start_time TEXT NOT NULL DEFAULT '09:00',
  end_time TEXT NOT NULL DEFAULT '18:00',
  start_at TIMESTAMPTZ NOT NULL DEFAULT '2026-03-14T09:00:00+05:30',
  venue TEXT NOT NULL DEFAULT 'Main Auditorium',
  college TEXT NOT NULL DEFAULT 'Your College',
  mode TEXT NOT NULL DEFAULT 'Offline',
  eligibility TEXT NOT NULL DEFAULT 'Open to all undergraduate students',
  min_team_size INT NOT NULL DEFAULT 1,
  max_team_size INT NOT NULL DEFAULT 4,
  registration_fee INT NOT NULL DEFAULT 350,
  currency TEXT NOT NULL DEFAULT 'INR',
  upi_id TEXT NOT NULL DEFAULT 'hackathon@upi',
  upi_payee_name TEXT NOT NULL DEFAULT 'BLACK HAT ZERO',
  payment_instructions TEXT NOT NULL DEFAULT 'Pay the exact amount via UPI and submit your UTR / transaction reference below.',
  registration_deadline TIMESTAMPTZ NOT NULL DEFAULT '2026-03-10T23:59:00+05:30',
  payment_deadline TIMESTAMPTZ,
  registration_open BOOLEAN NOT NULL DEFAULT true,
  payments_enabled BOOLEAN NOT NULL DEFAULT true,
  event_state TEXT NOT NULL DEFAULT 'UPCOMING',
  maintenance_mode BOOLEAN NOT NULL DEFAULT false,
  waitlist_enabled BOOLEAN NOT NULL DEFAULT false,
  emails_enabled BOOLEAN NOT NULL DEFAULT true,
  max_teams INT NOT NULL DEFAULT 100,
  max_participants INT NOT NULL DEFAULT 400,
  contact_email TEXT NOT NULL DEFAULT 'contact@blackhatzero.dev',
  contact_phone TEXT NOT NULL DEFAULT '+91 90000 00000',
  social_links JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.event_settings TO anon, authenticated;
GRANT ALL ON public.event_settings TO service_role;
ALTER TABLE public.event_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings public read" ON public.event_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "settings admin write" ON public.event_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER t_event_settings_updated BEFORE UPDATE ON public.event_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- TEAMS
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_code TEXT NOT NULL UNIQUE,
  team_name TEXT NOT NULL,
  leader_name TEXT NOT NULL,
  leader_email TEXT NOT NULL,
  leader_phone TEXT NOT NULL,
  college TEXT NOT NULL,
  department TEXT NOT NULL,
  year TEXT NOT NULL,
  city TEXT NOT NULL,
  team_size INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_teams_email ON public.teams(leader_email);
CREATE INDEX idx_teams_code ON public.teams(team_code);
GRANT SELECT ON public.teams TO authenticated;
GRANT ALL ON public.teams TO service_role;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "teams staff read" ON public.teams FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  member_index INT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  student_id TEXT,
  department TEXT,
  year TEXT,
  is_leader BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_members_team ON public.team_members(team_id);
CREATE INDEX idx_members_email ON public.team_members(email);
GRANT SELECT ON public.team_members TO authenticated;
GRANT ALL ON public.team_members TO service_role;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members staff read" ON public.team_members FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

-- REGISTRATIONS
CREATE SEQUENCE public.registration_seq START 1;
CREATE TABLE public.registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_code TEXT NOT NULL UNIQUE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  status public.reg_status NOT NULL DEFAULT 'PAYMENT_PENDING',
  team_size INT NOT NULL,
  fee_at_registration INT NOT NULL,
  expected_amount INT NOT NULL,
  is_waitlisted BOOLEAN NOT NULL DEFAULT false,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  verified_by UUID,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_reg_status ON public.registrations(status);
CREATE INDEX idx_reg_code ON public.registrations(registration_code);
CREATE INDEX idx_reg_team ON public.registrations(team_id);
GRANT SELECT ON public.registrations TO authenticated;
GRANT ALL ON public.registrations TO service_role;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reg staff read" ON public.registrations FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE TRIGGER t_reg_updated BEFORE UPDATE ON public.registrations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
  amount INT NOT NULL,
  utr_number TEXT NOT NULL,
  paid_on DATE,
  paid_time TEXT,
  screenshot_path TEXT,
  status TEXT NOT NULL DEFAULT 'SUBMITTED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_payments_utr_active ON public.payments (lower(utr_number)) WHERE status <> 'REJECTED';
CREATE INDEX idx_payments_reg ON public.payments(registration_id);
GRANT SELECT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payments staff read" ON public.payments FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE TRIGGER t_payments_updated BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.payment_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  registration_id UUID NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
  decision TEXT NOT NULL,
  reason TEXT,
  notes TEXT,
  verified_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.payment_verifications TO authenticated;
GRANT ALL ON public.payment_verifications TO service_role;
ALTER TABLE public.payment_verifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "verifications staff read" ON public.payment_verifications FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

CREATE TABLE public.registration_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  note TEXT,
  changed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.registration_status_history TO authenticated;
GRANT ALL ON public.registration_status_history TO service_role;
ALTER TABLE public.registration_status_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "history staff read" ON public.registration_status_history FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID,
  actor_email TEXT,
  actor_role TEXT,
  action TEXT NOT NULL,
  entity TEXT,
  entity_id TEXT,
  ip TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit admin read" ON public.audit_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- CONTENT TABLES
CREATE TABLE public.timeline_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL, description TEXT, happens_at TEXT, sort_order INT NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.prizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL, amount TEXT, description TEXT, tier TEXT, sort_order INT NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL, content TEXT NOT NULL, sort_order INT NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL, answer TEXT NOT NULL, sort_order INT NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.sponsors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, tier TEXT NOT NULL DEFAULT 'COMMUNITY PARTNER', logo_url TEXT, website TEXT,
  sort_order INT NOT NULL DEFAULT 0, is_published BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL, description TEXT, icon TEXT, sort_order INT NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL, body TEXT NOT NULL, is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.timeline_items, public.prizes, public.rules, public.faqs, public.sponsors, public.challenges, public.announcements TO anon, authenticated;
GRANT ALL ON public.timeline_items, public.prizes, public.rules, public.faqs, public.sponsors, public.challenges, public.announcements TO service_role;
ALTER TABLE public.timeline_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "timeline public read" ON public.timeline_items FOR SELECT TO anon, authenticated USING (is_published OR public.is_staff(auth.uid()));
CREATE POLICY "prizes public read" ON public.prizes FOR SELECT TO anon, authenticated USING (is_published OR public.is_staff(auth.uid()));
CREATE POLICY "rules public read" ON public.rules FOR SELECT TO anon, authenticated USING (is_published OR public.is_staff(auth.uid()));
CREATE POLICY "faqs public read" ON public.faqs FOR SELECT TO anon, authenticated USING (is_published OR public.is_staff(auth.uid()));
CREATE POLICY "sponsors public read" ON public.sponsors FOR SELECT TO anon, authenticated USING (is_published OR public.is_staff(auth.uid()));
CREATE POLICY "challenges public read" ON public.challenges FOR SELECT TO anon, authenticated USING (is_published OR public.is_staff(auth.uid()));
CREATE POLICY "announcements public read" ON public.announcements FOR SELECT TO anon, authenticated USING (is_published OR public.is_staff(auth.uid()));

CREATE TABLE public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, email TEXT NOT NULL, subject TEXT, message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.contact_messages TO authenticated;
GRANT ALL ON public.contact_messages TO service_role;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "messages staff read" ON public.contact_messages FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

CREATE TABLE public.waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT NOT NULL, team_name TEXT, team_size INT NOT NULL DEFAULT 1,
  promoted BOOLEAN NOT NULL DEFAULT false, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.waitlist TO authenticated;
GRANT ALL ON public.waitlist TO service_role;
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "waitlist staff read" ON public.waitlist FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

-- SEED
INSERT INTO public.event_settings (about) VALUES ('BLACK HAT#0 is a cybersecurity-focused hackathon where hackers, developers and innovators come together to code, break, innovate and own the system.');

INSERT INTO public.timeline_items (title, description, happens_at, sort_order) VALUES
 ('REGISTRATION OPENS','Team registration portal goes live.','01 FEB 2026',1),
 ('TEAM FORMATION','Assemble your crew of up to 4 operators.','01-28 FEB 2026',2),
 ('REGISTRATION CLOSES','Last call. No entries after this point.','10 MAR 2026',3),
 ('HACKATHON BEGINS','Opening ceremony and problem drop.','14 MAR 2026 09:00',4),
 ('HACKING PHASE','24 hours of building and breaking.','14-15 MAR 2026',5),
 ('SUBMISSION','Freeze your repos and submit.','15 MAR 2026 09:00',6),
 ('JUDGING','Live demos before the panel.','15 MAR 2026 11:00',7),
 ('WINNERS ANNOUNCED','Prize distribution and closing.','15 MAR 2026 16:00',8);

INSERT INTO public.prizes (title, amount, description, tier, sort_order) VALUES
 ('1ST PLACE','₹50,000','Champion team of BLACK HAT#0','GOLD',1),
 ('2ND PLACE','₹30,000','Runner-up team','SILVER',2),
 ('3RD PLACE','₹15,000','Second runner-up','BRONZE',3),
 ('BEST EXPLOIT','₹5,000','Most creative security breakthrough','SPECIAL',4);

INSERT INTO public.rules (category, content, sort_order) VALUES
 ('Eligibility','Open to all undergraduate and postgraduate students with a valid college ID.',1),
 ('Team Rules','Teams of 1 to 4 members. Team composition cannot change after payment approval.',2),
 ('Code of Conduct','Zero tolerance for harassment, plagiarism or malicious attacks on event infrastructure.',3),
 ('Submission Rules','All code must be written during the event and pushed to the provided repository before the freeze.',4),
 ('Allowed Technologies','Any language, framework or open-source tooling. Pre-built boilerplate must be declared.',5),
 ('Prohibited Activities','Attacking event networks, other teams, or third-party systems without authorization.',6),
 ('Judging Criteria','Security depth 30%, innovation 25%, execution 25%, presentation 20%.',7),
 ('Disqualification','Rule violations, fake payment proof or plagiarism result in immediate disqualification.',8);

INSERT INTO public.faqs (question, answer, sort_order) VALUES
 ('Who can participate?','Any student with a valid college ID card. Cross-college teams are allowed.',1),
 ('What is the team size?','Teams can have 1 to 4 members. The team leader counts as member 1.',2),
 ('What is the registration fee?','₹350 per participant. Your total is calculated automatically from your team size.',3),
 ('How does payment verification work?','You pay via UPI, submit your UTR and screenshot, and our verification team manually confirms the transaction.',4),
 ('Can I change team members?','Yes, until your payment is approved. After that, contact the organizers.',5),
 ('What happens after registration?','You receive a Registration ID and Team ID. Track your status any time on the Status page.',6),
 ('What should we bring?','Laptop, chargers, college ID and your own extension cords.',7),
 ('Is food provided?','Yes, meals and unlimited caffeine are included for all registered participants.',8);

INSERT INTO public.challenges (title, description, icon, sort_order) VALUES
 ('WEB EXPLOITATION','Break and secure modern web applications under time pressure.','globe',1),
 ('CRYPTOGRAPHY','Attack weak implementations and build resilient ones.','lock',2),
 ('REVERSE ENGINEERING','Take binaries apart and understand what they hide.','cpu',3),
 ('NETWORK FORENSICS','Trace intrusions through captured traffic.','radar',4),
 ('AI SECURITY','Probe and defend machine learning systems.','brain',5),
 ('BUILD TRACK','Ship a working security product in 24 hours.','terminal',6);

INSERT INTO public.sponsors (name, tier, sort_order) VALUES
 ('DEMO CORP','TITLE SPONSOR',1),('NULLBYTE LABS','GOLD',2),('SECOPS.IO','SILVER',3),('OWASP CHAPTER','COMMUNITY PARTNER',4);
