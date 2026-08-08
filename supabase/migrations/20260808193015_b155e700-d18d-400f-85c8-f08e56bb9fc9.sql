
CREATE OR REPLACE FUNCTION public.next_registration_number()
RETURNS BIGINT LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT nextval('public.registration_seq');
$$;
REVOKE ALL ON FUNCTION public.next_registration_number() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.next_registration_number() TO service_role;
