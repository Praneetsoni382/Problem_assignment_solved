import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  FileText,
  Trash2,
  RotateCw,
  Plus,
  Send,
} from "lucide-react";
import { collection, doc, setDoc, updateDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AppShell } from "@/components/app-shell";
import { CameraCapture } from "@/components/camera-capture";
import { QuestionPaperDialog } from "@/components/question-paper-dialog";
import { Button } from "@/components/ui/button";
import { useProfile, useSignedUrl } from "@/hooks/use-assignease";
import {
  deletePage,
  getAssignment,
  getOrCreateSubmission,
  listPages,
  listSubmissions,
  uploadFileToStorage,
  type SubmissionPage,
  type QuestionMark,
} from "@/lib/db";
import {
  getAssignmentMarksPerQuestion,
  getAssignmentTotalMarks,
  getCleanAssignmentTitle,
} from "@/lib/assignment-utils";

export const Route = createFileRoute("/_authenticated/student/assignments/$assignmentId")({
  head: () => ({
    meta: [
      { title: "Scan & submit — AssignEase" },
      {
        name: "description",
        content:
          "Capture a photo of each answer with your device camera and submit the assignment to your teacher.",
      },
      { property: "og:title", content: "Scan & submit — AssignEase" },
      { property: "og:description", content: "Capture answers with your camera and submit." },
    ],
  }),
  component: StudentAssignmentPage,
});

function StudentAssignmentPage() {
  const { assignmentId } = Route.useParams();
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  const [captureQuestion, setCaptureQuestion] = useState<number | null>(null);

  const assignment = useQuery({
    queryKey: ["assignment", assignmentId],
    queryFn: () => getAssignment(assignmentId),
  });
  const paperUrl = useSignedUrl("question-papers", assignment.data?.question_paper_url);

  const submission = useQuery({
    queryKey: ["my-submission", assignmentId, profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const all = await listSubmissions(assignmentId);
      return all.find((s) => s.student_id === profile!.id) ?? null;
    },
  });

  const pages = useQuery({
    queryKey: ["pages", submission.data?.id],
    enabled: !!submission.data?.id,
    queryFn: () => listPages(submission.data!.id),
  });

  const locked = !assignment.data?.is_open || submission.data?.status === "submitted";

  const upload = useMutation({
    mutationFn: async ({ blob, questionNo }: { blob: Blob; questionNo: number }) => {
      if (!profile) throw new Error("Missing profile");
      const record = submission.data ?? (await getOrCreateSubmission(assignmentId, profile.id));
      const storagePath = `submission-scans/${assignmentId}/${profile.id}/q${questionNo}-${Date.now()}.jpg`;
      const downloadUrl = await uploadFileToStorage(storagePath, blob);

      const pageDocRef = doc(collection(db, "submission_pages"));
      await setDoc(pageDocRef, {
        id: pageDocRef.id,
        submission_id: record.id,
        question_no: questionNo,
        page_order: (pages.data?.length || 0) + 1,
        image_url: downloadUrl,
        uploaded_at: new Date().toISOString(),
      });
    },
    onSuccess: (_, variables) => {
      toast.custom(
        () => (
          <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 font-medium text-slate-800 shadow-xl ring-1 ring-black/10 dark:bg-slate-900 dark:text-white">
            <CheckCircle2 className="size-5 text-emerald-500" />
            <span className="text-sm font-semibold">
              Photo added to Question {variables.questionNo}!
            </span>
          </div>
        ),
        { duration: 3000 },
      );
      queryClient.invalidateQueries({ queryKey: ["my-submission", assignmentId, profile?.id] });
      queryClient.invalidateQueries({ queryKey: ["pages"] });
      setCaptureQuestion(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const removeScan = useMutation({
    mutationFn: async (pageId: string) => {
      await deletePage(pageId);
    },
    onSuccess: () => {
      toast.success("Photo removed");
      queryClient.invalidateQueries({ queryKey: ["pages"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const submit = useMutation({
    mutationFn: async () => {
      if (!submission.data) throw new Error("Capture at least one answer first");
      await updateDoc(doc(db, "submissions", submission.data.id), {
        status: "submitted",
        submitted_at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      toast.success("Assignment submitted successfully!");
      queryClient.invalidateQueries({ queryKey: ["my-submission", assignmentId, profile?.id] });
      queryClient.invalidateQueries({ queryKey: ["submissions"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const marks = useQuery({
    queryKey: ["question-marks", submission.data?.id],
    enabled: !!submission.data?.id,
    queryFn: async () => {
      const q = query(
        collection(db, "question_marks"),
        where("submission_id", "==", submission.data!.id),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<QuestionMark, "id">),
      }));
    },
  });

  const totalQuestions = assignment.data?.total_questions ?? 0;
  const marksPerQuestion = getAssignmentMarksPerQuestion(assignment.data);
  const totalAssignmentMarks =
    getAssignmentTotalMarks(assignment.data) || totalQuestions * marksPerQuestion;
  const cleanTitle = getCleanAssignmentTitle(assignment.data?.title);
  const questions = Array.from({ length: totalQuestions }, (_, i) => i + 1);

  // Calculate how many questions have at least one photo
  const answeredQuestionsCount = questions.filter((q) =>
    pages.data?.some((p) => p.question_no === q),
  ).length;

  return (
    <AppShell profile={profile ?? null}>
      {/* Top Header Bar */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Link
              to="/student"
              className="flex items-center gap-1 transition hover:text-foreground"
            >
              <ArrowLeft className="size-4" /> Assignments
            </Link>
            <span>/</span>
            <span className="text-foreground font-semibold">{cleanTitle || "Assignment"}</span>
          </div>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {cleanTitle || "Assignment"}
          </h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Assignment #{assignment.data?.assignment_no} • {totalQuestions} questions •{" "}
            {marksPerQuestion} Marks/Q • Total {totalAssignmentMarks} Marks
          </p>
        </div>

        <div className="flex items-center gap-3">
          {paperUrl && (
            <QuestionPaperDialog
              url={paperUrl}
              title={`${cleanTitle || "Assignment"} — Question Paper`}
              className="rounded-xl border-[#b8ded4] bg-white/90 text-[#0d5c52] hover:bg-[#e6f2ee] dark:border-slate-700 dark:bg-card dark:text-emerald-400 dark:hover:bg-slate-800"
            />
          )}
        </div>
      </div>

      {/* Main Questions List */}
      <div className="space-y-4">
        {questions.map((questionNo) => {
          const capturedPages = pages.data?.filter((p) => p.question_no === questionNo) ?? [];
          const mark = marks.data?.find((m) => m.question_no === questionNo);
          const hasPhoto = capturedPages.length > 0;

          return (
            <div
              key={questionNo}
              className="group relative overflow-hidden rounded-2xl border border-border/80 bg-card p-4 shadow-xs transition-all hover:border-[#0d5c52]/30 hover:shadow-md sm:p-5 dark:bg-card"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                {/* Left question info & status */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-base font-bold text-foreground sm:text-lg">
                      Question #{questionNo}
                    </h3>
                  </div>

                  {/* Status pills */}
                  <div className="flex items-center gap-2 pt-1">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                      <span className="size-1.5 rounded-full bg-emerald-600" />
                      Open
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        hasPhoto
                          ? "bg-[#e2f1ec] text-[#0d5c52] dark:bg-teal-950/50 dark:text-teal-300"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                      }`}
                    >
                      <span
                        className={`size-1.5 rounded-full ${hasPhoto ? "bg-[#0d5c52]" : "bg-slate-400"}`}
                      />
                      {hasPhoto
                        ? `${capturedPages.length} Photo${capturedPages.length > 1 ? "s" : ""}`
                        : "Not submitted"}
                    </span>
                  </div>
                </div>

                {/* Scanned Thumbnails & Capture Actions */}
                <div className="flex flex-wrap items-center gap-3">
                  {capturedPages.map((page) => (
                    <PageThumbnail
                      key={page.id}
                      page={page}
                      locked={locked}
                      onDelete={() => removeScan.mutate(page.id)}
                      onRetake={() => setCaptureQuestion(questionNo)}
                    />
                  ))}

                  {/* Add / Capture Photo Button */}
                  {!locked && (
                    <button
                      type="button"
                      onClick={() => setCaptureQuestion(questionNo)}
                      className={`flex items-center gap-2 rounded-xl border border-dashed px-4 py-3 text-sm font-semibold transition ${
                        hasPhoto
                          ? "border-border bg-secondary/40 text-foreground hover:bg-secondary"
                          : "border-[#0d5c52]/40 bg-[#0d5c52]/5 text-[#0d5c52] hover:bg-[#0d5c52]/10 dark:text-teal-300"
                      }`}
                    >
                      {hasPhoto ? (
                        <>
                          <Plus className="size-4" /> Add Page
                        </>
                      ) : (
                        <>
                          <Camera className="size-4" /> Scan Answer
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Teacher Feedback / Marks Card if graded */}
              {(mark?.marks_awarded !== null && mark?.marks_awarded !== undefined) ||
              mark?.feedback ? (
                <div className="mt-4 rounded-xl border border-[#b8ded4] bg-[#e6f2ee]/50 p-3.5 dark:border-teal-900/50 dark:bg-teal-950/30">
                  {mark?.marks_awarded !== null && mark?.marks_awarded !== undefined && (
                    <div className="flex items-center justify-between text-xs font-bold text-[#0d5c52] dark:text-teal-300">
                      <span>Question Score</span>
                      <span className="rounded-md bg-white px-2.5 py-1 shadow-xs dark:bg-slate-900">
                        {mark.marks_awarded} / {marksPerQuestion} Marks
                      </span>
                    </div>
                  )}
                  {mark?.feedback && (
                    <p className="mt-2 text-sm text-foreground/90">
                      <span className="font-semibold text-foreground">Teacher feedback: </span>
                      {mark.feedback}
                    </p>
                  )}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* Bottom Sticky Status & Submit Bar */}
      <div className="sticky bottom-4 mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/80 bg-card/95 p-4 shadow-xl backdrop-blur-md dark:bg-card/95">
        <div className="flex items-center gap-2">
          <span className="font-display text-sm font-bold text-foreground">
            {answeredQuestionsCount}/{totalQuestions} questions
          </span>
          <span className="text-sm text-muted-foreground">have photos captured</span>
        </div>

        <div className="flex items-center gap-3">
          {submission.data?.status === "submitted" ? (
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-100 px-4 py-2.5 text-sm font-bold text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
              <CheckCircle2 className="size-4" /> Submitted
            </span>
          ) : !assignment.data?.is_open ? (
            <span className="text-sm font-medium text-destructive">Submission closed</span>
          ) : (
            <Button
              size="lg"
              disabled={submit.isPending || !pages.data?.length}
              onClick={() => submit.mutate()}
              className="h-11 rounded-xl bg-[#0d5c52] px-6 text-sm font-bold text-white shadow-md transition hover:bg-[#0a4840] active:scale-[0.98] dark:bg-emerald-600 dark:hover:bg-emerald-700"
            >
              <Send className="mr-2 size-4" />
              {submit.isPending ? "Submitting…" : "Submit Assignment"}
            </Button>
          )}
        </div>
      </div>

      {/* Camera Capture Dialog */}
      <CameraCapture
        open={captureQuestion !== null}
        questionNo={captureQuestion ?? 1}
        onClose={() => setCaptureQuestion(null)}
        onConfirm={async (blob) => {
          await upload.mutateAsync({ blob, questionNo: captureQuestion ?? 1 });
        }}
      />
    </AppShell>
  );
}

function PageThumbnail({
  page,
  locked,
  onDelete,
  onRetake,
}: {
  page: SubmissionPage;
  locked: boolean;
  onDelete: () => void;
  onRetake: () => void;
}) {
  const url = useSignedUrl("submission-scans", page.image_url);

  return (
    <div className="group/thumb relative h-20 w-16 overflow-hidden rounded-lg border border-border bg-muted shadow-xs transition hover:shadow-md sm:h-24 sm:w-20">
      {url ? (
        <img
          src={url}
          alt={`Question ${page.question_no} scan`}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="h-full w-full animate-pulse bg-slate-200 dark:bg-slate-800" />
      )}

      {/* Hover action overlay with Trash and Retake icons */}
      {!locked && (
        <div className="absolute inset-0 flex items-center justify-center gap-1.5 bg-black/60 opacity-0 transition group-hover/thumb:opacity-100">
          <button
            type="button"
            aria-label="Delete photo"
            onClick={onDelete}
            className="flex size-7 items-center justify-center rounded-full bg-red-600/90 text-white shadow-sm transition hover:scale-110 hover:bg-red-600"
          >
            <Trash2 className="size-3.5" />
          </button>
          <button
            type="button"
            aria-label="Retake photo"
            onClick={onRetake}
            className="flex size-7 items-center justify-center rounded-full bg-slate-700/90 text-white shadow-sm transition hover:scale-110 hover:bg-slate-700"
          >
            <RotateCw className="size-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
