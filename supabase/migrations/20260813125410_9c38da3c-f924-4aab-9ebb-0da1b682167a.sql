CREATE OR REPLACE FUNCTION public.reset_registration_sequence()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM setval('public.registration_seq', 1, false);
  RETURN currval('public.registration_seq');
END;
$$;

REVOKE ALL ON FUNCTION public.reset_registration_sequence() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reset_registration_sequence() TO service_role;