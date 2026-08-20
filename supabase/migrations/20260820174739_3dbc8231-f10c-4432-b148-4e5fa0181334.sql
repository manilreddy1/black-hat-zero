ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS selected_challenge_id uuid REFERENCES public.challenges(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS custom_problem_title text,
  ADD COLUMN IF NOT EXISTS custom_problem_statement text,
  ADD COLUMN IF NOT EXISTS theme_selected_at timestamptz;

ALTER TABLE public.event_settings
  ADD COLUMN IF NOT EXISTS theme_selection_locked boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_registrations_selected_challenge ON public.registrations (selected_challenge_id);