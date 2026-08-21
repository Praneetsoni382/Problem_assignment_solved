ALTER TABLE public.question_marks ADD COLUMN IF NOT EXISTS feedback text;

CREATE UNIQUE INDEX IF NOT EXISTS question_marks_submission_question_key
  ON public.question_marks (submission_id, question_no);

CREATE POLICY question_marks_select_student ON public.question_marks
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.submissions s WHERE s.id = question_marks.submission_id AND s.student_id = auth.uid()));

CREATE TABLE public.notifications (
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

CREATE POLICY notifications_select_own ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_teacher(auth.uid()));

CREATE POLICY notifications_insert_teacher ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (public.is_teacher(auth.uid()));

CREATE POLICY notifications_update_own ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS notifications_user_created_idx ON public.notifications (user_id, created_at DESC);

ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;