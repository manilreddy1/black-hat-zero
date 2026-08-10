CREATE TABLE public.page_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  label text NOT NULL,
  kind text NOT NULL DEFAULT 'builtin',
  title text,
  subtitle text,
  body text,
  is_visible boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.page_sections TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.page_sections TO authenticated;
GRANT ALL ON public.page_sections TO service_role;

ALTER TABLE public.page_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "page_sections public read" ON public.page_sections
FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "page_sections staff manage" ON public.page_sections
FOR ALL TO authenticated
USING (private.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER t_page_sections_updated BEFORE UPDATE ON public.page_sections
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.page_sections (key, label, kind, sort_order) VALUES
  ('hero', 'Hero', 'builtin', 10),
  ('about', 'About', 'builtin', 20),
  ('event', 'Event details', 'builtin', 30),
  ('challenges', 'Challenge tracks', 'builtin', 40),
  ('timeline', 'Operation schedule', 'builtin', 50),
  ('rules', 'Rules of engagement', 'builtin', 60),
  ('prizes', 'Prize pool', 'builtin', 70),
  ('sponsors', 'Sponsors & partners', 'builtin', 80),
  ('faq', 'FAQ', 'builtin', 90),
  ('contact', 'Contact', 'builtin', 100);