CREATE TABLE public.auth_throttle (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope text NOT NULL,
  identifier text NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  locked_until timestamptz,
  first_attempt_at timestamptz NOT NULL DEFAULT now(),
  last_attempt_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (scope, identifier)
);

GRANT ALL ON public.auth_throttle TO service_role;

ALTER TABLE public.auth_throttle ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER t_auth_throttle_updated
BEFORE UPDATE ON public.auth_throttle
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_auth_throttle_locked_until ON public.auth_throttle (locked_until);