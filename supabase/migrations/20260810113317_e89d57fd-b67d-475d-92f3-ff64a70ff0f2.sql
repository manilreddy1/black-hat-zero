CREATE TABLE public.certificate_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_enabled boolean NOT NULL DEFAULT false,
  template_path text,
  section_title text NOT NULL DEFAULT 'Certificates',
  section_subtitle text NOT NULL DEFAULT 'Download your participation certificate.',
  note text NOT NULL DEFAULT 'Certificates are available to verified participants only.',
  fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.certificate_settings TO anon;
GRANT SELECT ON public.certificate_settings TO authenticated;
GRANT ALL ON public.certificate_settings TO service_role;

ALTER TABLE public.certificate_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Certificate settings are publicly readable"
ON public.certificate_settings FOR SELECT
USING (true);

CREATE TRIGGER t_certificate_settings_updated
BEFORE UPDATE ON public.certificate_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.certificate_settings (fields) VALUES (
  '[{"id":"name","label":"Participant name","source":"name","text":"","x":50,"y":52,"size":42,"color":"#111111","weight":"700","align":"center","font":"serif","uppercase":false}]'::jsonb
);

INSERT INTO public.page_sections (key, label, kind, is_visible, sort_order)
VALUES ('certificates', 'Certificates', 'builtin', false,
  COALESCE((SELECT MAX(sort_order) + 1 FROM public.page_sections), 10));