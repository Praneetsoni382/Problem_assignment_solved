# Scan & Grade

Create a new project with Cloud enabled. AssignEase — Digital Assignment Submission & Grading Platform (MVP)

0. One-line description

Build a full-stack web app where a teacher creates assignments, students submit handwritten answers via live camera scans (question-by-question), and the teacher grades each submission with real-time status updates visible to the student the moment marks are finalized.

1. Tech Requirements

Use Lovable Cloud (Supabase-backed) for: Authentication, Postgres database, File Storage, and Realtime subscriptions.

Auth method: Email + OTP (one-time passcode) only. No password-based login.

Frontend: React + Tailwind + shadcn/ui, fully responsive — mobile-first for the student scanning flow, desktop-friendly for the teacher grading flow.

2. User Roles

Two roles: teacher and student. This MVP has exactly one teacher account — do not build multi-teacher/multi-class switching or a teacher-selection UI, but still store teacher_id on assignments for correctness.

Registration

Teacher registration: Full Name, Email → send OTP → verify 6-digit code → account created with role = teacher.

Student registration: Full Name, Enrollment Number (unique), Email → send OTP → verify 6-digit code → account created with role = student.

Enforce unique email and unique enrollment number at the database level; show a clear inline error if either is already registered.

Login

Single login screen: enter email → if already registered, send OTP → verify → redirect to the correct dashboard based on the stored role.

If the email is not registered, redirect to the appropriate registration form instead of failing silently.

3. Database Schema

Create these tables in Lovable Cloud:

profiles

id (uuid, references auth.users, PK)

role (text: 'teacher' | 'student')

full_name (text)

email (text, unique)

enrollment_no (text, unique, nullable — students only)

created_at (timestamptz, default now())

assignments

id (uuid, PK)

teacher_id (uuid, references profiles)

assignment_no (integer)

title (text)

question_paper_url (text, nullable) — file the teacher uploads

total_questions (integer)

is_open (boolean, default true)

closed_at (timestamptz, nullable)

created_at (timestamptz, default now())

submissions — one row per student per assignment

id (uuid, PK)

assignment_id (uuid, references assignments)

student_id (uuid, references profiles)

status (text: 'not_submitted' | 'submitted', default 'not_submitted')

submitted_at (timestamptz, nullable)

total_marks (numeric, nullable)

checked_status (text: 'pending' | 'checked', default 'pending')

checked_at (timestamptz, nullable)

unique constraint on (assignment_id, student_id)

submission_pages — one row per captured photo

id (uuid, PK)

submission_id (uuid, references submissions, on delete cascade)

question_no (integer)

image_url (text)

page_order (integer, default 1)

uploaded_at (timestamptz, default now())

question_marks — teacher's per-question scratch marks (never shown to students)

id (uuid, PK)

submission_id (uuid, references submissions, on delete cascade)

question_no (integer)

marks_awarded (numeric, nullable)

unique constraint on (submission_id, question_no)

4. Storage

Create two storage buckets:

question-papers (public read) — teacher's uploaded assignment files (PDF or image).

submission-scans (private) — student answer photos, path pattern: {assignment_id}/{student_id}/q{question_no}/{timestamp}.jpg. Only the owning student and the teacher may read/write these files.

5. Security Rules (Row Level Security)

Any authenticated user can read assignments and profiles (needed for lists to render), but only the owning teacher can create/edit/close an assignment, and a user can only edit their own profiles row.

submissions: a student can create/update only their own row, and only while the parent assignment has is_open = true and their own status = 'not_submitted'. The teacher can read and update all rows — but only the teacher can ever write total_marks and checked_status.

submission_pages: a student can insert/delete pages only on their own, not-yet-submitted submission; the teacher can read all.

question_marks: only the teacher can read or write this table — students must never receive this data, since students only see the final total, not a per-question breakdown.

6. Teacher Dashboard

Assignments tab: table of all assignments (No., Title, Questions, Open/Closed badge, submitted-count / total-students). "+ New Assignment" opens a form: Title, Assignment No., Number of Questions (auto-generates that many question slots for students), upload the question paper (stored in question-papers). is_open defaults to true on creation.

Opening an assignment shows a "Close Submission Window" button (sets is_open = false, closed_at = now(); confirm with a dialog since it's a one-way action for this MVP) and a student list scoped to that assignment, each row showing name, enrollment no., and live status: Not submitted / Submitted — pending / Checked — {total_marks}. This list updates live via realtime as students submit — no page refresh.

Students tab: read-only master roster of every registered student (Name, Enrollment No., Email, Registered date).

Grading screen (click a student's name within an assignment): shows that student's captured pages grouped by question number in a zoomable image viewer, with a numeric marks input box beside each question. Show a running sum of the per-question marks as a suggestion under a separate, always-editable "Total Marks" field. A "Submit Checked Status" button writes the question_marks rows, sets submissions.total_marks, checked_status = 'checked', checked_at = now(). Allow the teacher to reopen and re-save a checked submission to correct a mark later.

7. Student Dashboard

List of all assignments, each showing assignment no., title, Open/Closed badge, and this student's own status (Not submitted / Submitted — awaiting check / Checked — {total_marks}). This must update live the instant the teacher finalizes grading — no refresh needed.

Opening an open assignment shows a link to the teacher's question paper, and one card per question with an "Add Photo" action (see Section 8), thumbnails of pages already captured with delete/retake controls, and a "Submit Assignment" button (disabled until every question has at least one photo). Submitting sets status = 'submitted', submitted_at = now(), and locks the assignment from further edits.

Opening a closed or already-submitted assignment shows a read-only view of what was submitted, plus the current checked status/marks.

8. Camera Capture Requirement — Critical, Build Exactly This

Students must NOT be able to pick a file from their photo gallery. "Add Photo" must open a live camera view, not a file picker:

Use navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }) to open the rear camera in a full-screen/modal live preview.

A capture button draws the current video frame onto a hidden <canvas>, then converts it to a JPEG blob.

Show a confirm screen with "Retake" and "Use This Photo" — only upload on confirm.

On confirm: upload the blob to submission-scans at the correct path, insert a submission_pages row, refresh the thumbnail grid, and let the student capture another page for the same question if needed.

Handle camera-permission denial with a clear inline message and a retry option.

Do NOT attempt auto edge-detection, perspective correction, or image cropping/enhancement — out of scope for this MVP (Section 11).

9. Realtime Requirements

Use Lovable Cloud's realtime (Postgres change) subscriptions:

Teacher's per-assignment student list subscribes to submissions (filtered by assignment_id) so status badges update live as students submit.

Each student's dashboard subscribes to their own submissions row so it flips from "Submitted — awaiting check" to "Checked — {marks}" the moment the teacher finishes grading, with zero manual refresh.

10. Design Guidelines

Clean and functional over decorative — this will be tested by a real teacher and real students; prioritize clarity and speed.

Student-facing camera flow must be mobile-first and thumb-friendly (large buttons, obvious retake/confirm).

Teacher grading screen should assume a laptop/desktop and give answer images generous space — this is where the teacher spends most of their time.

Use toasts/inline confirmations for every write action (photo uploaded, assignment submitted, marks saved) so success is obvious during testing.

11. Explicitly Out of Scope for This MVP

Multiple teachers/classes/subjects.

Auto image enhancement, edge detection, or perspective correction on scans.

Email/push notifications (status updates are in-app/realtime only).

Per-question marks visibility for students (only the final total + checked status).

Reopening a submission window once closed.

Analytics, exports, or plagiarism checks.

12. Suggested Build Order

Auth (OTP email login/registration for both roles) + profiles table.

Full schema + storage buckets + RLS policies.

Teacher: create/view/close assignments, view student roster.

Student: view assignments, live-camera capture flow, submit.

Teacher: grading screen (view scans, enter marks, finalize).

Realtime wiring on both dashboards.

Confirm each phase works before moving to the next, and flag anything in this spec you were not able to implement. You can ask for inputs and plan before building if needed

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://assign-cheker-praneet.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/a990da02-c4a6-45ca-8abe-7418e7d34107).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
