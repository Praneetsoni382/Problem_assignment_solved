-- ==========================================
-- 1. STORAGE BUCKETS SETUP
-- ==========================================
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('question-papers', 'question-papers', false),
  ('submission-scans', 'submission-scans', false)
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- 2. TABLES & CORE SCHEMAS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('teacher','student')),
  full_name text NOT NULL,
  email text NOT NULL UNIQUE,
  enrollment_no text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_teacher(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id AND role = 'teacher')
$$;

REVOKE ALL ON FUNCTION public.is_teacher(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_teacher(uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "profiles_select_authenticated" ON public.profiles;
CREATE POLICY "profiles_select_authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "profiles_insert_self" ON public.profiles;
CREATE POLICY "profiles_insert_self" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "profiles_update_self" ON public.profiles;
CREATE POLICY "profiles_update_self" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- ASSIGNMENTS
CREATE TABLE IF NOT EXISTS public.assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assignment_no integer NOT NULL,
  title text NOT NULL,
  question_paper_url text,
  total_questions integer NOT NULL CHECK (total_questions > 0),
  is_open boolean NOT NULL DEFAULT true,
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.assignments TO authenticated;
GRANT ALL ON public.assignments TO service_role;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "assignments_select_authenticated" ON public.assignments;
CREATE POLICY "assignments_select_authenticated" ON public.assignments FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "assignments_insert_teacher" ON public.assignments;
CREATE POLICY "assignments_insert_teacher" ON public.assignments FOR INSERT TO authenticated WITH CHECK (teacher_id = auth.uid() AND public.is_teacher(auth.uid()));

DROP POLICY IF EXISTS "assignments_update_teacher" ON public.assignments;
CREATE POLICY "assignments_update_teacher" ON public.assignments FOR UPDATE TO authenticated USING (teacher_id = auth.uid() AND public.is_teacher(auth.uid())) WITH CHECK (teacher_id = auth.uid());

DROP POLICY IF EXISTS "assignments_delete_teacher" ON public.assignments;
CREATE POLICY "assignments_delete_teacher" ON public.assignments FOR DELETE TO authenticated USING (teacher_id = auth.uid() AND public.is_teacher(auth.uid()));

-- SUBMISSIONS
CREATE TABLE IF NOT EXISTS public.submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'not_submitted' CHECK (status IN ('not_submitted','submitted')),
  submitted_at timestamptz,
  total_marks numeric,
  checked_status text NOT NULL DEFAULT 'pending' CHECK (checked_status IN ('pending','checked')),
  checked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (assignment_id, student_id)
);

GRANT SELECT, INSERT, UPDATE ON public.submissions TO authenticated;
GRANT ALL ON public.submissions TO service_role;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "submissions_select" ON public.submissions;
CREATE POLICY "submissions_select" ON public.submissions FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR public.is_teacher(auth.uid()));

DROP POLICY IF EXISTS "submissions_insert_student" ON public.submissions;
CREATE POLICY "submissions_insert_student" ON public.submissions FOR INSERT TO authenticated
  WITH CHECK (
    student_id = auth.uid()
    AND status = 'not_submitted'
    AND EXISTS (SELECT 1 FROM public.assignments a WHERE a.id = assignment_id AND a.is_open)
  );

DROP POLICY IF EXISTS "submissions_update_student" ON public.submissions;
CREATE POLICY "submissions_update_student" ON public.submissions FOR UPDATE TO authenticated
  USING (
    student_id = auth.uid()
    AND status = 'not_submitted'
    AND EXISTS (SELECT 1 FROM public.assignments a WHERE a.id = assignment_id AND a.is_open)
  )
  WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS "submissions_update_teacher" ON public.submissions;
CREATE POLICY "submissions_update_teacher" ON public.submissions FOR UPDATE TO authenticated
  USING (public.is_teacher(auth.uid())) WITH CHECK (public.is_teacher(auth.uid()));

CREATE OR REPLACE FUNCTION public.guard_submission_grading()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_teacher(auth.uid()) THEN
    IF NEW.total_marks IS DISTINCT FROM OLD.total_marks 
       OR NEW.checked_status IS DISTINCT FROM OLD.checked_status 
       OR NEW.checked_at IS DISTINCT FROM OLD.checked_at THEN
      RAISE EXCEPTION 'Only the teacher can set marks or checked status';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.guard_submission_grading() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS guard_submission_grading_trg ON public.submissions;
CREATE TRIGGER guard_submission_grading_trg BEFORE UPDATE ON public.submissions
FOR EACH ROW EXECUTE FUNCTION public.guard_submission_grading();

-- SUBMISSION PAGES
CREATE TABLE IF NOT EXISTS public.submission_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  question_no integer NOT NULL,
  image_url text NOT NULL,
  page_order integer NOT NULL DEFAULT 1,
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, DELETE ON public.submission_pages TO authenticated;
GRANT ALL ON public.submission_pages TO service_role;
ALTER TABLE public.submission_pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pages_select" ON public.submission_pages;
CREATE POLICY "pages_select" ON public.submission_pages FOR SELECT TO authenticated
  USING (
    public.is_teacher(auth.uid())
    OR EXISTS (SELECT 1 FROM public.submissions s WHERE s.id = submission_id AND s.student_id = auth.uid())
  );

DROP POLICY IF EXISTS "pages_insert_student" ON public.submission_pages;
CREATE POLICY "pages_insert_student" ON public.submission_pages FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.submissions s JOIN public.assignments a ON a.id = s.assignment_id
      WHERE s.id = submission_id AND s.student_id = auth.uid() AND s.status = 'not_submitted' AND a.is_open
    )
  );

DROP POLICY IF EXISTS "pages_delete_student" ON public.submission_pages;
CREATE POLICY "pages_delete_student" ON public.submission_pages FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.submissions s JOIN public.assignments a ON a.id = s.assignment_id
      WHERE s.id = submission_id AND s.student_id = auth.uid() AND s.status = 'not_submitted' AND a.is_open
    )
  );

-- QUESTION MARKS
CREATE TABLE IF NOT EXISTS public.question_marks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  question_no integer NOT NULL,
  marks_awarded numeric,
  feedback text,
  UNIQUE (submission_id, question_no)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.question_marks TO authenticated;
GRANT ALL ON public.question_marks TO service_role;
ALTER TABLE public.question_marks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "question_marks_teacher_all" ON public.question_marks;
CREATE POLICY "question_marks_teacher_all" ON public.question_marks FOR ALL TO authenticated
  USING (public.is_teacher(auth.uid())) WITH CHECK (public.is_teacher(auth.uid()));

DROP POLICY IF EXISTS "question_marks_select_student" ON public.question_marks;
CREATE POLICY "question_marks_select_student" ON public.question_marks FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.submissions s WHERE s.id = question_marks.submission_id AND s.student_id = auth.uid()));

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  submission_id uuid REFERENCES public.submissions(id) ON DELETE CASCADE,
  assignment_no integer,
  assignment_title text,
  question_no integer,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_teacher(auth.uid()));

DROP POLICY IF EXISTS "notifications_insert_teacher" ON public.notifications;
CREATE POLICY "notifications_insert_teacher" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (public.is_teacher(auth.uid()));

DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS notifications_user_created_idx ON public.notifications (user_id, created_at DESC);

-- STORAGE POLICIES
DROP POLICY IF EXISTS "qp_read_authenticated" ON storage.objects;
CREATE POLICY "qp_read_authenticated" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'question-papers');

DROP POLICY IF EXISTS "qp_write_teacher" ON storage.objects;
CREATE POLICY "qp_write_teacher" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'question-papers' AND public.is_teacher(auth.uid()));

DROP POLICY IF EXISTS "qp_update_teacher" ON storage.objects;
CREATE POLICY "qp_update_teacher" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'question-papers' AND public.is_teacher(auth.uid()));

DROP POLICY IF EXISTS "qp_delete_teacher" ON storage.objects;
CREATE POLICY "qp_delete_teacher" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'question-papers' AND public.is_teacher(auth.uid()));

DROP POLICY IF EXISTS "scans_select" ON storage.objects;
CREATE POLICY "scans_select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'submission-scans' AND (public.is_teacher(auth.uid()) OR (storage.foldername(name))[2] = auth.uid()::text));

DROP POLICY IF EXISTS "scans_insert_student" ON storage.objects;
CREATE POLICY "scans_insert_student" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'submission-scans' AND (storage.foldername(name))[2] = auth.uid()::text);

DROP POLICY IF EXISTS "scans_delete_student" ON storage.objects;
CREATE POLICY "scans_delete_student" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'submission-scans' AND (storage.foldername(name))[2] = auth.uid()::text);

-- REALTIME CONFIGURATION
ALTER TABLE public.submissions REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.submissions;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;
