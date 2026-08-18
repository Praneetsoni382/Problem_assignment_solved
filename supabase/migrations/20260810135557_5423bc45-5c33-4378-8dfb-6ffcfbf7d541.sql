REVOKE ALL ON FUNCTION public.guard_submission_grading() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_teacher(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_teacher(uuid) TO authenticated, service_role;