ALTER TABLE public.team_members
  ADD COLUMN IF NOT EXISTS food_pref text NOT NULL DEFAULT 'VEG';
ALTER TABLE public.team_members
  DROP CONSTRAINT IF EXISTS team_members_food_pref_check;
ALTER TABLE public.team_members
  ADD CONSTRAINT team_members_food_pref_check CHECK (food_pref IN ('VEG','NON_VEG'));

ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS lead_user_id uuid;

CREATE TABLE public.attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id uuid NOT NULL UNIQUE REFERENCES public.registrations(id) ON DELETE CASCADE,
  marked_by uuid,
  marked_by_email text,
  marked_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.attendance TO authenticated;
GRANT ALL ON public.attendance TO service_role;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attendance staff read" ON public.attendance
  FOR SELECT TO authenticated USING (private.is_staff(auth.uid()));

CREATE TABLE public.food_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id uuid NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
  member_id uuid NOT NULL UNIQUE REFERENCES public.team_members(id) ON DELETE CASCADE,
  released boolean NOT NULL DEFAULT false,
  released_at timestamptz,
  redeemed_at timestamptz,
  redeemed_by uuid,
  redeemed_by_email text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX food_tokens_registration_idx ON public.food_tokens(registration_id);
GRANT SELECT ON public.food_tokens TO authenticated;
GRANT ALL ON public.food_tokens TO service_role;
ALTER TABLE public.food_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "food tokens staff read" ON public.food_tokens
  FOR SELECT TO authenticated USING (private.is_staff(auth.uid()));