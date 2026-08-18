import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import {
  ChevronRight,
  ChevronLeft,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCcw,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  Send,
  Bot,
  Loader2,
  FileX2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useProfile, useSignedUrl } from "@/hooks/use-assignease";
import { getAssignment, listPages, type SubmissionPage } from "@/lib/db";
import { generateAiFeedbackServerAction } from "@/lib/ai-feedback-action";

export const Route = createFileRoute("/_authenticated/teacher/grade/$submissionId")({
  head: () => ({
    meta: [
      { title: "Grade submission — AssignEase" },
      {
        name: "description",
        content:
          "Zoom into each scanned answer, award marks per question, and publish the total to the student.",
      },
      { property: "og:title", content: "Grade submission — AssignEase" },
      { property: "og:description", content: "Award per-question marks on scanned answers." },
    ],
  }),
  component: GradePage,
});

const QUICK_FEEDBACK_PROMPTS = [
  "Great step-by-step working!",
  "Check calculations in line 2.",
  "Formula applied correctly.",
  "Incomplete final answer.",
  "Very neat and well-structured.",
];

function GradePage() {
  const { submissionId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();

  const [marks, setMarks] = useState<Record<number, string>>({});
  const [feedback, setFeedback] = useState<Record<number, string>>({});
  const [overallFeedback, setOverallFeedback] = useState<string>("");
  const [selectedQuestion, setSelectedQuestion] = useState<number>(1);
  const [selectedPageIndex, setSelectedPageIndex] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const viewerContainerRef = useRef<HTMLDivElement | null>(null);

  const submission = useQuery({
    queryKey: ["submission", submissionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("submissions")
        .select("*, student:profiles!submissions_student_id_fkey(full_name, enrollment_no)")
        .eq("id", submissionId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const assignment = useQuery({
    queryKey: ["assignment", submission.data?.assignment_id],
    enabled: !!submission.data?.assignment_id,
    queryFn: () => getAssignment(submission.data!.assignment_id),
  });

  const pages = useQuery({
    queryKey: ["pages", submissionId],
    queryFn: () => listPages(submissionId),
  });

  const existingMarks = useQuery({
    queryKey: ["question-marks", submissionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("question_marks")
        .select("*")
        .eq("submission_id", submissionId);
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    if (existingMarks.data?.length) {
      setMarks(
        Object.fromEntries(
          existingMarks.data.map((m) => [m.question_no, String(m.marks_awarded ?? 0)]),
        ) as Record<number, string>,
      );
      setFeedback(
        Object.fromEntries(
          existingMarks.data.map((m) => [m.question_no, m.feedback ?? ""]),
        ) as Record<number, string>,
      );
    }
  }, [existingMarks.data]);

  const totalQuestions = assignment.data?.total_questions ?? 5;
  const questions = Array.from({ length: totalQuestions }, (_, i) => i + 1);

  // Maximum possible marks calculation (default 5 marks per question if unspecified, or totalQuestions * 5)
  const maxPossibleMarks = totalQuestions * 5;
  const currentTotal = Object.values(marks).reduce((sum, value) => sum + (Number(value) || 0), 0);

  const save = useMutation({
    mutationFn: async () => {
      const questionNos = Array.from(
        new Set([
          ...Object.entries(marks)
            .filter(([, value]) => value !== "")
            .map(([q]) => Number(q)),
          ...Object.entries(feedback)
            .filter(([, value]) => value.trim() !== "")
            .map(([q]) => Number(q)),
        ]),
      );
      const rows = questionNos.map((questionNo) => ({
        submission_id: submissionId,
        question_no: questionNo,
        marks_awarded:
          marks[questionNo] !== undefined && marks[questionNo] !== ""
            ? Number(marks[questionNo])
            : null,
        feedback: feedback[questionNo]?.trim() ? feedback[questionNo].trim() : null,
      }));
      if (rows.length) {
        const { error } = await supabase
          .from("question_marks")
          .upsert(rows, { onConflict: "submission_id,question_no" });
        if (error) throw error;
      }
      const { error: updateError } = await supabase
        .from("submissions")
        .update({
          checked_status: "checked",
          total_marks: currentTotal,
          checked_at: new Date().toISOString(),
        })
        .eq("id", submissionId);
      if (updateError) throw updateError;

      // Notify the student with feedback
      const studentId = submission.data?.student_id;
      const notes = rows
        .filter((row) => !!row.feedback)
        .map((row) => ({
          user_id: studentId!,
          submission_id: submissionId,
          assignment_no: assignment.data?.assignment_no ?? null,
          assignment_title: assignment.data?.title ?? null,
          question_no: row.question_no,
          message: row.feedback as string,
        }));

      if (overallFeedback.trim() && studentId) {
        notes.push({
          user_id: studentId,
          submission_id: submissionId,
          assignment_no: assignment.data?.assignment_no ?? null,
          assignment_title: assignment.data?.title ?? null,
          question_no: 0,
          message: `Overall: ${overallFeedback.trim()}`,
        });
      }

      if (studentId && notes.length) {
        const { error: notifyError } = await supabase.from("notifications").insert(notes);
        if (notifyError) throw notifyError;
      }
    },
    onSuccess: () => {
      toast.success("Marks and feedback published successfully!");
      queryClient.invalidateQueries({ queryKey: ["submissions"] });
      queryClient.invalidateQueries({ queryKey: ["submission", submissionId] });
      if (submission.data?.assignment_id) {
        navigate({
          to: "/teacher/assignments/$assignmentId",
          params: { assignmentId: submission.data.assignment_id },
        });
      }
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const student = submission.data?.student as
    { full_name: string; enrollment_no: string | null } | null | undefined;

  // Pages strictly associated with current question
  const currentQuestionPages = pages.data?.filter((p) => p.question_no === selectedQuestion) ?? [];
  const displayPages = currentQuestionPages;
  const activePage = displayPages[selectedPageIndex] ?? null;

  function handleNextPage() {
    if (displayPages.length > 0 && selectedPageIndex < displayPages.length - 1) {
      setSelectedPageIndex((prev) => prev + 1);
    } else if (selectedQuestion < totalQuestions) {
      setSelectedQuestion((q) => q + 1);
      setSelectedPageIndex(0);
    }
  }

  function handlePrevPage() {
    if (selectedPageIndex > 0) {
      setSelectedPageIndex((prev) => prev - 1);
    } else if (selectedQuestion > 1) {
      setSelectedQuestion((q) => q - 1);
      setSelectedPageIndex(0);
    }
  }

  async function generateAiFeedback() {
    const targetPages = displayPages;
    if (targetPages.length === 0) {
      toast.error(`No uploaded scans found for Question ${selectedQuestion} to analyze.`);
      return;
    }

    setIsGeneratingAI(true);
    const toastId = toast.loading(`AI is analyzing Question ${selectedQuestion} scans...`);
    try {
      const imagesPayload: Array<{ mimeType: string; data: string }> = [];

      for (const page of targetPages) {
        // Try download from Supabase storage
        let fileBlob: Blob | null = null;
        const { data: downloaded, error } = await supabase.storage
          .from("submission-scans")
          .download(page.image_url);

        if (!error && downloaded) {
          fileBlob = downloaded;
        } else {
          // Fallback: create signed url and fetch blob
          const { data: signed } = await supabase.storage
            .from("submission-scans")
            .createSignedUrl(page.image_url, 300);
          if (signed?.signedUrl) {
            const resp = await fetch(signed.signedUrl);
            if (resp.ok) {
              fileBlob = await resp.blob();
            }
          }
        }

        if (!fileBlob) continue;

        // Compress and optimize image to max 1200px for ultra-fast transfer & AI recognition
        const compressed = await new Promise<{ mimeType: string; data: string }>((resolve) => {
          const img = new Image();
          const objUrl = URL.createObjectURL(fileBlob!);
          img.onload = () => {
            URL.revokeObjectURL(objUrl);
            const maxDim = 1200;
            let { width, height } = img;
            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              } else {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
              resolve({
                mimeType: "image/jpeg",
                data: dataUrl.split(",")[1] || "",
              });
              return;
            }
            // fallback
            const reader = new FileReader();
            reader.onloadend = () => {
              const res = (reader.result as string) || "";
              resolve({
                mimeType: fileBlob!.type || "image/jpeg",
                data: res.split(",")[1] || "",
              });
            };
            reader.readAsDataURL(fileBlob!);
          };
          img.onerror = () => {
            URL.revokeObjectURL(objUrl);
            const reader = new FileReader();
            reader.onloadend = () => {
              const res = (reader.result as string) || "";
              resolve({
                mimeType: fileBlob!.type || "image/jpeg",
                data: res.split(",")[1] || "",
              });
            };
            reader.readAsDataURL(fileBlob!);
          };
          img.src = objUrl;
        });

        if (compressed.data) {
          imagesPayload.push(compressed);
        }
      }

      if (imagesPayload.length === 0) {
        throw new Error("Unable to retrieve scanned images for analysis.");
      }

      const generated = await generateAiFeedbackServerAction({
        data: {
          questionNo: selectedQuestion,
          assignmentTitle: assignment.data?.title,
          images: imagesPayload,
        },
      });

      setFeedback((prev) => ({
        ...prev,
        [selectedQuestion]: prev[selectedQuestion]
          ? `${prev[selectedQuestion]}\n\n${generated}`
          : generated,
      }));

      toast.success(`AI feedback generated for Question ${selectedQuestion}!`, { id: toastId });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to generate AI feedback", {
        id: toastId,
      });
    } finally {
      setIsGeneratingAI(false);
    }
  }

  function toggleFullscreen() {
    if (!viewerContainerRef.current) return;
    if (!document.fullscreenElement) {
      viewerContainerRef.current.requestFullscreen?.().catch(() => undefined);
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => undefined);
      setIsFullscreen(false);
    }
  }

  return (
    <AppShell profile={profile ?? null}>
      {/* Top Breadcrumb Navigation */}
      <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm font-medium text-muted-foreground">
        <Link
          to="/teacher"
          className="text-[#0d5c52] transition hover:underline dark:text-emerald-400"
        >
          Assignments
        </Link>
        <ChevronRight className="size-4 text-muted-foreground/60" />
        <Link
          to="/teacher/assignments/$assignmentId"
          params={{ assignmentId: submission.data?.assignment_id ?? "" }}
          className="text-foreground transition hover:underline"
        >
          {assignment.data?.title ?? "Assignment"}
        </Link>
        <ChevronRight className="size-4 text-muted-foreground/60" />
        {submission.data?.student_id ? (
          <Link
            to="/teacher/students/$studentId"
            params={{ studentId: submission.data.student_id }}
            className="text-foreground transition hover:text-[#0d5c52] hover:underline"
          >
            {student?.full_name ?? "Student Vault"}
          </Link>
        ) : (
          <span className="font-semibold text-foreground">
            {student?.full_name ?? "Student Submission"}
          </span>
        )}
        <ChevronRight className="size-4 text-muted-foreground/60" />
        <span className="font-semibold text-[#0d5c52] dark:text-emerald-400">
          Grade & Answer Scans
        </span>
      </nav>

      {/* Main 2-Column Grading Layout from Image 2 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 xl:gap-8">
        {/* Left Column: Document Viewer Workspace (Image 2) */}
        <div
          ref={viewerContainerRef}
          className="flex flex-col rounded-3xl border border-[#b8ded4]/70 bg-[#e6f0ee]/50 p-4 shadow-sm sm:p-6 lg:col-span-8 dark:border-teal-950 dark:bg-card/70"
        >
          {/* Header of viewer */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                Question {selectedQuestion}
              </h2>
              {/* Question selector tabs */}
              <div className="hidden sm:flex items-center gap-1">
                {questions.map((q) => {
                  const hasAnswer = pages.data?.some((p) => p.question_no === q);
                  const isGraded = marks[q] !== undefined && marks[q] !== "";
                  return (
                    <button
                      key={q}
                      type="button"
                      onClick={() => {
                        setSelectedQuestion(q);
                        setSelectedPageIndex(0);
                      }}
                      title={
                        hasAnswer ? `Question ${q}` : `Question ${q} — no upload for this question`
                      }
                      className={`relative size-7 rounded-lg text-xs font-semibold transition ${
                        selectedQuestion === q
                          ? "bg-[#0d5c52] text-white shadow-xs"
                          : isGraded
                            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-300"
                            : hasAnswer
                              ? "bg-white/80 text-foreground hover:bg-white dark:bg-slate-800"
                              : "border border-dashed border-border/70 text-muted-foreground/60 hover:bg-white/50"
                      }`}
                    >
                      {q}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Top right floating actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={generateAiFeedback}
                disabled={isGeneratingAI || displayPages.length === 0}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#0d5c52]/30 bg-white/95 px-3 py-1.5 text-xs font-bold text-[#0d5c52] shadow-xs transition hover:bg-[#0d5c52]/10 active:scale-95 disabled:opacity-50 dark:border-emerald-500/40 dark:bg-slate-900/95 dark:text-emerald-300"
              >
                {isGeneratingAI ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin text-[#0d5c52]" />
                    <span>AI Analyzing Q{selectedQuestion}…</span>
                  </>
                ) : (
                  <>
                    <Bot className="size-3.5 text-[#0d5c52] dark:text-emerald-400" />
                    <span>Generate AI Feedback</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-1.5 rounded-xl border border-[#b8ded4] bg-white/90 p-1 shadow-xs dark:border-slate-700 dark:bg-slate-900">
                <button
                  type="button"
                  aria-label="Toggle Fullscreen"
                  onClick={toggleFullscreen}
                  className="flex size-8 items-center justify-center rounded-lg text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  {isFullscreen ? (
                    <Minimize2 className="size-4" />
                  ) : (
                    <Maximize2 className="size-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Viewer Body: Thumbnails Strip + Canvas + Floating Chevrons */}
          <div className="relative flex min-h-[460px] flex-1 gap-4 overflow-hidden rounded-2xl bg-white p-3 shadow-inner sm:min-h-[560px] dark:bg-neutral-900">
            {/* Left Thumbnail Strip */}
            <div className="hidden w-24 shrink-0 flex-col gap-3 overflow-y-auto pr-1 sm:flex md:w-28">
              {displayPages.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 p-3 text-center text-muted-foreground">
                  <FileX2 className="size-5 text-muted-foreground/50 mb-1" />
                  <span className="text-[10px] font-medium leading-tight">
                    no upload for this question
                  </span>
                </div>
              ) : (
                displayPages.map((page, idx) => (
                  <PageThumbnailButton
                    key={page.id}
                    page={page}
                    isActive={activePage?.id === page.id}
                    onClick={() => setSelectedPageIndex(idx)}
                  />
                ))
              )}
            </div>

            {/* Main Center Image Canvas */}
            <div className="relative flex flex-1 items-center justify-center overflow-hidden rounded-xl bg-slate-50 dark:bg-neutral-950">
              {activePage ? (
                <InteractiveScanCanvas
                  key={activePage.id}
                  pagePath={activePage.image_url}
                  questionNo={selectedQuestion}
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center max-w-sm">
                  <div className="mb-3 flex size-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 ring-1 ring-amber-200/70 dark:bg-amber-950/40 dark:text-amber-400 dark:ring-amber-900/60">
                    <FileX2 className="size-7" />
                  </div>
                  <h3 className="font-display text-base font-bold text-foreground">
                    no upload for this question
                  </h3>
                  <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                    The student has not submitted or captured any answer scan for Question{" "}
                    {selectedQuestion}.
                  </p>
                  <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50/80 px-3 py-1 text-[11px] font-semibold text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/50 dark:text-amber-300">
                    Remark: no upload for this question
                  </div>
                </div>
              )}

              {/* Floating Left & Right Chevron Navigation */}
              <button
                type="button"
                aria-label="Previous Page"
                onClick={handlePrevPage}
                disabled={selectedQuestion === 1 && selectedPageIndex === 0}
                className="absolute left-3 flex size-10 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow-md backdrop-blur-sm transition hover:scale-105 hover:bg-white disabled:opacity-30 dark:bg-slate-800/90 dark:text-white dark:hover:bg-slate-800"
              >
                <ChevronLeft className="size-5" />
              </button>

              <button
                type="button"
                aria-label="Next Page"
                onClick={handleNextPage}
                disabled={
                  selectedQuestion === totalQuestions &&
                  (displayPages.length === 0 || selectedPageIndex >= displayPages.length - 1)
                }
                className="absolute right-3 flex size-10 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow-md backdrop-blur-sm transition hover:scale-105 hover:bg-white disabled:opacity-30 dark:bg-slate-800/90 dark:text-white dark:hover:bg-slate-800"
              >
                <ChevronRight className="size-5" />
              </button>
            </div>
          </div>

          {/* Bottom Next Question Indicator */}
          <div className="mt-4 flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => {
                if (selectedQuestion < totalQuestions) {
                  setSelectedQuestion((q) => q + 1);
                  setSelectedPageIndex(0);
                }
              }}
              className="flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
            >
              <span>Question {Math.min(selectedQuestion + 1, totalQuestions)}</span>
              <ChevronRight className="size-4" />
            </button>
            <span className="text-xs text-muted-foreground font-medium">
              {displayPages.length === 0
                ? "no upload for this question"
                : `Page ${selectedPageIndex + 1} of ${displayPages.length}`}
            </span>
          </div>
        </div>

        {/* Right Column: Grading Panel & Feedback System (Image 2) */}
        <div className="flex flex-col space-y-4 lg:col-span-4">
          {/* Header Card matching Image 2 */}
          <div className="rounded-2xl border border-[#c1e5dc] bg-[#e2f1ec] p-4 text-[#134e4a] shadow-xs dark:border-teal-900/60 dark:bg-teal-950/60 dark:text-teal-200">
            <div className="font-semibold text-sm leading-snug">
              Grading: {student?.full_name ?? "Student"} —{" "}
              <span className="font-normal capitalize">
                {submission.data?.checked_status === "checked"
                  ? "Checked"
                  : submission.data?.status === "submitted"
                    ? "Submitted - pending"
                    : "Not submitted"}
              </span>
            </div>
            {student?.enrollment_no && (
              <p className="mt-0.5 text-xs text-[#134e4a]/75 dark:text-teal-300/75">
                Roll / Enrollment: {student.enrollment_no}
              </p>
            )}
          </div>

          {/* Per-Question Marks Inputs List matching Image 2 */}
          <div className="space-y-2.5 rounded-2xl border border-border bg-card p-4 shadow-xs dark:bg-card">
            {questions.map((questionNo) => {
              const isCurrent = selectedQuestion === questionNo;
              const hasAnswer = pages.data?.some((p) => p.question_no === questionNo);
              return (
                <div
                  key={questionNo}
                  onClick={() => {
                    setSelectedQuestion(questionNo);
                    setSelectedPageIndex(0);
                  }}
                  className={`flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 transition ${
                    isCurrent
                      ? "bg-[#e6f0ee]/80 ring-1 ring-[#0d5c52]/30 dark:bg-teal-950/40"
                      : "hover:bg-accent/40"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor={`marks-${questionNo}`}
                      className="cursor-pointer text-sm font-semibold text-foreground"
                    >
                      Q{questionNo} Marks
                    </label>
                    {!hasAnswer && (
                      <span className="rounded-md bg-amber-100/70 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                        no upload
                      </span>
                    )}
                  </div>
                  <input
                    id={`marks-${questionNo}`}
                    type="number"
                    min={0}
                    max={100}
                    placeholder="—"
                    value={marks[questionNo] ?? ""}
                    onChange={(e) =>
                      setMarks((prev) => ({ ...prev, [questionNo]: e.target.value }))
                    }
                    className="h-10 w-24 rounded-xl border border-border bg-white px-3 text-center text-base font-bold text-foreground shadow-xs outline-none transition focus:border-[#0d5c52] focus:ring-2 focus:ring-[#0d5c52]/20 dark:bg-slate-900"
                  />
                </div>
              );
            })}

            {/* Dynamic Running-sum helper text matching Image 2 */}
            <div className="border-t border-border/60 pt-3 text-xs font-medium text-muted-foreground">
              Running-sum calculation suggests your moves + Q1 = {currentTotal}/{maxPossibleMarks}
            </div>

            {/* Total Marks Row matching Image 2 */}
            <div className="flex items-center justify-between pt-1">
              <span className="font-display text-base font-bold text-foreground">Total Marks</span>
              <div className="rounded-xl border border-[#fed7aa] bg-[#fef7ee] px-4 py-2 text-base font-bold text-[#7c2d12] shadow-xs dark:border-amber-900/60 dark:bg-amber-950/60 dark:text-amber-200">
                {currentTotal}/{maxPossibleMarks}
              </div>
            </div>
          </div>

          {/* Send Feedback System (Integrated in UI) */}
          <div className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-xs dark:bg-card">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 font-display text-sm font-bold text-foreground">
                <MessageSquare className="size-4 text-[#0d5c52] dark:text-teal-400" />
                <span>Teacher Feedback (Q{selectedQuestion})</span>
              </div>

              <button
                type="button"
                onClick={generateAiFeedback}
                disabled={isGeneratingAI || displayPages.length === 0}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#0d5c52]/30 bg-[#0d5c52]/10 px-2.5 py-1 text-[11px] font-bold text-[#0d5c52] shadow-2xs transition hover:bg-[#0d5c52]/20 active:scale-95 disabled:opacity-50 dark:border-emerald-500/40 dark:bg-emerald-950/60 dark:text-emerald-300"
              >
                {isGeneratingAI ? (
                  <>
                    <Loader2 className="size-3 animate-spin text-[#0d5c52]" />
                    <span>Analyzing scans…</span>
                  </>
                ) : (
                  <>
                    <Bot className="size-3 text-[#0d5c52] dark:text-emerald-400" />
                    <span>Generate AI Feedback</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick feedback chips */}
            <div className="flex flex-wrap gap-1.5">
              {QUICK_FEEDBACK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() =>
                    setFeedback((prev) => ({
                      ...prev,
                      [selectedQuestion]: prev[selectedQuestion]
                        ? `${prev[selectedQuestion]} ${prompt}`
                        : prompt,
                    }))
                  }
                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-accent/30 px-2 py-1 text-[11px] font-medium text-foreground transition hover:bg-accent hover:border-[#0d5c52]/30"
                >
                  <Sparkles className="size-2.5 text-[#0d5c52]" />
                  {prompt}
                </button>
              ))}
            </div>

            {/* Feedback textarea */}
            <Textarea
              rows={3}
              placeholder={`Write specific notes or guidance for Question ${selectedQuestion}...`}
              value={feedback[selectedQuestion] ?? ""}
              onChange={(e) =>
                setFeedback((prev) => ({ ...prev, [selectedQuestion]: e.target.value }))
              }
              className="resize-none rounded-xl border-border bg-white text-sm dark:bg-slate-900"
            />

            {/* Overall assignment comment */}
            <div className="pt-2">
              <label
                htmlFor="overall-notes"
                className="block text-xs font-semibold text-muted-foreground mb-1"
              >
                Overall Assignment Remarks (Optional)
              </label>
              <Textarea
                id="overall-notes"
                rows={2}
                placeholder="Overall praise, constructive tips, or general review..."
                value={overallFeedback}
                onChange={(e) => setOverallFeedback(e.target.value)}
                className="resize-none rounded-xl border-border bg-white text-xs dark:bg-slate-900"
              />
            </div>
          </div>

          {/* Submit Checked Status Button matching Image 2 */}
          <Button
            size="lg"
            onClick={() => save.mutate()}
            disabled={save.isPending}
            className="h-12 w-full rounded-xl bg-[#0d5c52] text-sm font-bold text-white shadow-md transition hover:bg-[#0a4840] active:scale-[0.99] dark:bg-emerald-600 dark:hover:bg-emerald-700"
          >
            {save.isPending ? (
              "Submitting..."
            ) : (
              <>
                <CheckCircle2 className="mr-2 size-4" />
                Submit Checked Status
              </>
            )}
          </Button>
        </div>
      </div>
    </AppShell>
  );
}

function PageThumbnailButton({
  page,
  isActive,
  onClick,
}: {
  page: SubmissionPage;
  isActive: boolean;
  onClick: () => void;
}) {
  const url = useSignedUrl("submission-scans", page.image_url);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-slate-100 transition-all ${
        isActive
          ? "border-2 border-[#0d5c52] shadow-md ring-2 ring-[#0d5c52]/20"
          : "border border-border opacity-70 hover:opacity-100"
      }`}
    >
      {url ? (
        <img src={url} alt={`Page ${page.question_no}`} className="h-full w-full object-cover" />
      ) : (
        <div className="h-full w-full animate-pulse bg-slate-200" />
      )}
      <div className="absolute bottom-1 right-1 rounded bg-black/60 px-1 py-0.5 text-[9px] font-semibold text-white">
        Q{page.question_no}
      </div>
    </button>
  );
}

function InteractiveScanCanvas({ pagePath, questionNo }: { pagePath: string; questionNo: number }) {
  const url = useSignedUrl("submission-scans", pagePath);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  useEffect(() => {
    // Reset zoom when switching images
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, [pagePath]);

  function zoomBy(factor: number) {
    setZoom((z) => Math.min(5, Math.max(0.8, z * factor)));
  }

  function resetZoom() {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }

  if (!url) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-[#0d5c52] border-t-transparent" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative flex h-full w-full cursor-grab items-center justify-center overflow-hidden touch-none active:cursor-grabbing"
      onPointerDown={(e) => {
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        dragRef.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
      }}
      onPointerMove={(e) => {
        const d = dragRef.current;
        if (!d) return;
        setOffset({ x: d.ox + (e.clientX - d.x), y: d.oy + (e.clientY - d.y) });
      }}
      onPointerUp={() => {
        dragRef.current = null;
      }}
    >
      <img
        src={url}
        alt={`Student answer scan for question ${questionNo}`}
        draggable={false}
        className="max-h-full max-w-full select-none object-contain transition-transform duration-75 ease-out"
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
        }}
      />

      {/* Floating Canvas Zoom Controls */}
      <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-xl border border-border/80 bg-white/90 p-1 shadow-md backdrop-blur-md dark:bg-slate-900/90">
        <button
          type="button"
          aria-label="Zoom In"
          onClick={(e) => {
            e.stopPropagation();
            zoomBy(1.25);
          }}
          className="flex size-7 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <ZoomIn className="size-3.5" />
        </button>
        <button
          type="button"
          aria-label="Zoom Out"
          onClick={(e) => {
            e.stopPropagation();
            zoomBy(1 / 1.25);
          }}
          className="flex size-7 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <ZoomOut className="size-3.5" />
        </button>
        <button
          type="button"
          aria-label="Reset Zoom"
          onClick={(e) => {
            e.stopPropagation();
            resetZoom();
          }}
          className="flex size-7 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <RotateCcw className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
