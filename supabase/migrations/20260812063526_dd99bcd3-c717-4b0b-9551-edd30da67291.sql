ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS problem_statement text;
ALTER TABLE public.event_settings ADD COLUMN IF NOT EXISTS themes_revealed boolean NOT NULL DEFAULT false;