# AssignEase — Digital Assignment Submission & Grading (MVP)

A full-stack app with one teacher and many students. Students scan handwritten answers question-by-question with a live camera; the teacher grades and students see status flip live.

## Backend (Lovable Cloud)

Cloud is enabled first: Postgres, auth, storage, realtime.

Tables (all with RLS + explicit grants):

- `profiles` — id/role/full_name/email (unique)/enrollment_no (unique, nullable)/created_at
- `assignments` — teacher_id, assignment_no, title, question_paper_url, total_questions, is_open, closed_at
- `submissions` — assignment_id, student_id, status, submitted_at, total_marks, checked_status, checked_at; unique (assignment_id, student_id)
- `submission_pages` — submission_id (cascade), question_no, image_url, page_order, uploaded_at
- `question_marks` — submission_id (cascade), question_no, marks_awarded; unique (submission_id, question_no)

Roles use a separate `has_role`-style check (security definer) so policies never recurse through `profiles`.

Policies:

- assignments/profiles readable by any authenticated user; only owning teacher writes assignments; users edit only their own profile row
- submissions: student creates/updates own row only while parent `is_open = true` and own `status = 'not_submitted'`; teacher reads/updates all; `total_marks` + `checked_status` writable by teacher only (enforced via a teacher-only update path)
- submission_pages: student inserts/deletes only on own un-submitted submission; teacher reads all
- question_marks: teacher-only read and write

Storage buckets:

- `question-papers` (public read, teacher writes)
- `submission-scans` (private) — path `{assignment_id}/{student_id}/q{n}/{timestamp}.jpg`; read/write limited to owning student + teacher

Auth: email OTP only (6-digit code), no passwords. Registration collects name (+ enrollment no. for students), then verifies the code and creates the profile with the right role. Login: enter email → registered emails get a code and land on their role's dashboard; unregistered emails are routed to the matching registration form.

## Teacher (desktop-first)

- Assignments tab: table (No., Title, Questions, Open/Closed, submitted / total students) + "New Assignment" form (title, number, question count, question-paper upload; opens as `is_open = true`)
- Assignment detail: "Close Submission Window" with a confirm dialog (one-way), plus a live student list — Not submitted / Submitted — pending / Checked — {marks} — updated by a realtime subscription on `submissions` filtered by assignment
- Students tab: read-only roster (name, enrollment no., email, registered date)
- Grading screen: pages grouped by question in a zoomable viewer, marks input per question, running sum shown as a suggestion under an always-editable Total Marks field; saving writes `question_marks`, `total_marks`, `checked_status = 'checked'`, `checked_at`. Re-opening and re-saving a checked submission is allowed.

## Student (mobile-first)

- Assignment list with own status badge, live-updating via a realtime subscription on their own submissions rows
- Open assignment: question-paper link, one card per question with "Add Photo", captured thumbnails with delete/retake, and Submit disabled until every question has ≥1 photo
- Submit sets `status = 'submitted'`, `submitted_at`, and locks editing
- Closed or submitted assignments render read-only with current check status/marks

## Camera capture (exact)

`getUserMedia({ video: { facingMode: 'environment' } })` in a full-screen modal live preview — no file picker anywhere. Capture draws the frame to a hidden canvas → JPEG blob → confirm screen with Retake / Use This Photo → on confirm upload to `submission-scans`, insert a `submission_pages` row, refresh thumbnails, allow another page for the same question. Permission denial shows an inline message with retry. No edge detection, cropping, or enhancement.

## Design

Clean and functional. Large thumb-friendly controls in the student capture flow; generous image space on the teacher grading screen. Toasts on every write (upload, submit, marks saved). Semantic design tokens throughout, no hardcoded colors.

## Technical notes

- Reads/writes go through TanStack Start server functions with the authenticated Supabase client (RLS as the user); private scan images are served via signed URLs.
- Realtime uses Postgres change subscriptions from the browser client on `submissions`.
- Out of scope per spec: multiple teachers/classes, image enhancement, email/push notifications, per-question marks for students, reopening a closed window, analytics/exports/plagiarism.

## Build order

1. Cloud + schema + buckets + RLS
2. OTP auth for both roles + profiles
3. Teacher assignments & roster
4. Student assignment view + camera capture + submit
5. Teacher grading screen
6. Realtime wiring on both dashboards
