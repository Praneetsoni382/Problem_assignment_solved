CREATE POLICY "qp_read_authenticated" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'question-papers');
CREATE POLICY "qp_write_teacher" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'question-papers' AND public.is_teacher(auth.uid()));
CREATE POLICY "qp_update_teacher" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'question-papers' AND public.is_teacher(auth.uid()));
CREATE POLICY "qp_delete_teacher" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'question-papers' AND public.is_teacher(auth.uid()));

CREATE POLICY "scans_select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'submission-scans' AND (public.is_teacher(auth.uid()) OR (storage.foldername(name))[2] = auth.uid()::text));
CREATE POLICY "scans_insert_student" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'submission-scans' AND (storage.foldername(name))[2] = auth.uid()::text);
CREATE POLICY "scans_delete_student" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'submission-scans' AND (storage.foldername(name))[2] = auth.uid()::text);