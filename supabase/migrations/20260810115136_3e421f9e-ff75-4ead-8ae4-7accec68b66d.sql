CREATE TABLE public.nav_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  href text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  is_button boolean NOT NULL DEFAULT false,
  new_tab boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.nav_items TO anon;
GRANT SELECT ON public.nav_items TO authenticated;
GRANT ALL ON public.nav_items TO service_role;
ALTER TABLE public.nav_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "nav_items public read" ON public.nav_items FOR SELECT TO anon, authenticated USING (is_visible = true);
CREATE TRIGGER t_nav_items_updated BEFORE UPDATE ON public.nav_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.custom_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  subtitle text,
  body text,
  seo_description text,
  is_published boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.custom_pages TO anon;
GRANT SELECT ON public.custom_pages TO authenticated;
GRANT ALL ON public.custom_pages TO service_role;
ALTER TABLE public.custom_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "custom_pages public read" ON public.custom_pages FOR SELECT TO anon, authenticated USING (is_published = true);
CREATE TRIGGER t_custom_pages_updated BEFORE UPDATE ON public.custom_pages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.nav_items (label, href, sort_order, is_button) VALUES
  ('Home', '/', 0, false),
  ('About', '/about', 1, false),
  ('Event', '/event', 2, false),
  ('Timeline', '/timeline', 3, false),
  ('Rules', '/rules', 4, false),
  ('Prizes', '/prizes', 5, false),
  ('FAQ', '/faq', 6, false),
  ('Status', '/status', 7, false),
  ('Register Now', '/register', 8, true);