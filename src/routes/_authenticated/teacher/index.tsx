import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Plus,
  FolderKanban,
  Clock,
  PieChart,
  Minus,
  FileText,
  Loader2,
  ChevronRight,
  Users,
  Trash2,
} from "lucide-react";
import { collection, doc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AppShell } from "@/components/app-shell";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useProfile } from "@/hooks/use-assignease";
import {
  listAssignments,
  listStudents,
  listSubmissions,
  uploadFileToStorage,
  deleteAssignment,
  type Assignment,
} from "@/lib/db";
import {
  getAssignmentMarksPerQuestion,
  getAssignmentTotalMarks,
  getCleanAssignmentTitle,
  encodeQuestionPaperUrl,
} from "@/lib/assignment-utils";

export const Route = createFileRoute("/_authenticated/teacher/")({
  head: () => ({
    meta: [
      { title: "Teacher Dashboard — AssignEase" },
      {
        name: "description",
        content: "Create assignments, track live submissions, and grade answer scans.",
      },
    ],
  }),
  component: TeacherDashboard,
});

export function TeacherDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: profile, isLoading } = useProfile();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deletingAssignment, setDeletingAssignment] = useState<{
    id: string;
    title: string;
  } | null>(null);

  useEffect(() => {
    if (!isLoading && profile && profile.role !== "teacher") {
      navigate({ to: "/student" });
    }
  }, [isLoading, profile, navigate]);

  const assignments = useQuery({ queryKey: ["assignments"], queryFn: listAssignments });
  const students = useQuery({ queryKey: ["students"], queryFn: listStudents });
  const submissions = useQuery({ queryKey: ["submissions"], queryFn: () => listSubmissions() });

  const deleteAssignmentMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteAssignment(id);
    },
    onSuccess: () => {
      toast.success("Assignment permanently deleted from database");
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      queryClient.invalidateQueries({ queryKey: ["submissions"] });
      setDeletingAssignment(null);
    },
    onError: (err: Error) => toast.error(err.message || "Failed to delete assignment"),
  });

  useEffect(() => {
    const unsubSubs = onSnapshot(collection(db, "submissions"), () => {
      queryClient.invalidateQueries({ queryKey: ["submissions"] });
    });
    const unsubAssigns = onSnapshot(collection(db, "assignments"), () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
    });
    return () => {
      unsubSubs();
      unsubAssigns();
    };
  }, [queryClient]);

  const totalAssignments = assignments.data?.length ?? 0;
  const submittedCount = submissions.data?.filter((s) => s.status === "submitted").length ?? 0;
  const studentCount = students.data?.length ?? 0;
  const totalPossibleSubmissions = totalAssignments * studentCount;

  const pendingGradingCount =
    submissions.data?.filter((s) => s.status === "submitted" && s.checked_status !== "checked")
      .length ?? 0;

  const avgCompletion =
    totalPossibleSubmissions > 0
      ? Math.min(100, Math.round((submittedCount / totalPossibleSubmissions) * 100))
      : 0;

  // Recent ungraded submissions for "Needs Your Attention"
  const pendingSubmissions =
    submissions.data
      ?.filter((s) => s.status === "submitted" && s.checked_status !== "checked")
      .slice(0, 5) ?? [];

  const assignmentMap = new Map(assignments.data?.map((a) => [a.id, a]) || []);

  function getAvatarColor(name: string | null) {
    const colors = [
      "bg-amber-100 text-amber-800",
      "bg-emerald-100 text-emerald-800",
      "bg-indigo-100 text-indigo-800",
      "bg-purple-100 text-purple-800",
      "bg-rose-100 text-rose-800",
    ];
    let hash = 0;
    const str = name || "student";
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  function getInitials(name: string | null) {
    if (!name) return "ST";
    return name
      .split(" ")
      .map((p) => p[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  }

  return (
    <AppShell profile={profile ?? null} breadcrumbs={[{ label: "Assignments" }]}>
      <div className="space-y-6">
        {/* Welcome Header & Navigation Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Teacher Dashboard
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Good Morning, {profile?.full_name || "Teacher"}
            </p>
          </div>

          {/* Navigation Pill Switcher */}
          <div className="inline-flex rounded-2xl border border-border/80 bg-neutral-100/80 p-1 shadow-xs dark:bg-neutral-800/80">
            <Link
              to="/teacher"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-[#0d5c52] shadow-xs dark:bg-neutral-900 dark:text-emerald-400"
            >
              <FileText className="size-4" />
              Assignments
            </Link>
            <Link
              to="/teacher/students"
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
            >
              <Users className="size-4" />
              Student List & Vault
            </Link>
          </div>
        </div>

        {/* 3 Bento Metric Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Card 1: Total Assignments */}
          <div className="flex items-center gap-4 rounded-3xl border border-border/80 bg-white p-5 shadow-xs dark:bg-neutral-900">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-100/70 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
              <FolderKanban className="size-6" />
            </div>
            <div>
              <div className="font-display text-2xl font-bold tracking-tight text-foreground">
                {assignments.isLoading ? "..." : totalAssignments}
              </div>
              <div className="text-xs font-medium text-muted-foreground">Total Assignments</div>
            </div>
          </div>

          {/* Card 2: Pending Grading */}
          <div className="flex items-center gap-4 rounded-3xl border border-border/80 bg-white p-5 shadow-xs dark:bg-neutral-900">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-rose-100/70 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400">
              <Clock className="size-6" />
            </div>
            <div>
              <div className="font-display text-2xl font-bold tracking-tight text-foreground">
                {submissions.isLoading ? "..." : pendingGradingCount}
              </div>
              <div className="text-xs font-medium text-muted-foreground">Pending Grading</div>
            </div>
          </div>

          {/* Card 3: Avg. Completion */}
          <div className="flex items-center gap-4 rounded-3xl border border-border/80 bg-white p-5 shadow-xs dark:bg-neutral-900">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-purple-100/70 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400">
              <PieChart className="size-6" />
            </div>
            <div>
              <div className="font-display text-2xl font-bold tracking-tight text-foreground">
                {assignments.isLoading || submissions.isLoading || students.isLoading
                  ? "..."
                  : `${avgCompletion}%`}
              </div>
              <div className="text-xs font-medium text-muted-foreground">Avg. Completion</div>
            </div>
          </div>
        </div>

        {/* Main Content Layout: Table on Left + Needs Attention on Right */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column: Assignments List */}
          <div className="space-y-4 lg:col-span-8">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setDialogOpen(true)}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#0d5c52] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#0a4840]"
              >
                <Plus className="size-4" />
                New Assignment
              </button>
            </div>

            <div className="overflow-hidden rounded-3xl border border-border/80 bg-white shadow-xs dark:bg-neutral-900">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border/70 bg-[#FDFBF7] text-xs font-semibold text-muted-foreground dark:bg-neutral-800/60">
                    <tr>
                      <th className="py-3.5 pl-6 pr-3">Title</th>
                      <th className="py-3.5 px-4">No.</th>
                      <th className="py-3.5 px-4">Questions & Marks</th>
                      <th className="py-3.5 px-4">Total Marks</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 pr-6 pl-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {assignments.isLoading ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                          Loading assignments...
                        </td>
                      </tr>
                    ) : assignments.data?.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                          No assignments yet. Click "+ New Assignment" to create one.
                        </td>
                      </tr>
                    ) : (
                      assignments.data?.map((assignment) => {
                        const mpq = getAssignmentMarksPerQuestion(assignment);
                        const totalMarks = getAssignmentTotalMarks(assignment);
                        const cleanTitle = getCleanAssignmentTitle(assignment.title);

                        return (
                          <tr
                            key={assignment.id}
                            className="transition hover:bg-neutral-50/80 dark:hover:bg-neutral-800/50"
                          >
                            <td className="py-4 pl-6 pr-3 font-semibold text-foreground">
                              <Link
                                to="/teacher/assignments/$assignmentId"
                                params={{ assignmentId: assignment.id }}
                                className="hover:underline"
                              >
                                {cleanTitle}
                              </Link>
                            </td>
                            <td className="py-4 px-4 font-mono text-xs text-muted-foreground">
                              #{assignment.assignment_no}
                            </td>
                            <td className="py-4 px-4 text-xs text-muted-foreground">
                              <span className="font-medium text-foreground">
                                {assignment.total_questions} Qs
                              </span>
                              <span className="text-muted-foreground/80"> • {mpq} M/Q</span>
                            </td>
                            <td className="py-4 px-4">
                              <span className="inline-flex items-center rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800 border border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/40">
                                {totalMarks} Marks
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <span
                                className={`inline-flex items-center rounded-full px-3 py-0.5 text-xs font-semibold ${
                                  assignment.is_open
                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                                    : "bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                                }`}
                              >
                                {assignment.is_open ? "Open" : "Closed"}
                              </span>
                            </td>
                            <td className="py-4 pr-6 pl-4 text-right">
                              <div className="inline-flex items-center gap-1.5">
                                <Link
                                  to="/teacher/assignments/$assignmentId"
                                  params={{ assignmentId: assignment.id }}
                                  className="inline-flex items-center gap-1 rounded-xl bg-neutral-100 px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700"
                                >
                                  View
                                  <ChevronRight className="size-3.5" />
                                </Link>
                                <button
                                  type="button"
                                  title="Delete assignment permanently"
                                  onClick={() =>
                                    setDeletingAssignment({
                                      id: assignment.id,
                                      title: cleanTitle,
                                    })
                                  }
                                  className="inline-flex items-center justify-center rounded-xl p-1.5 text-red-600 transition hover:bg-red-50 dark:hover:bg-red-950/40"
                                >
                                  <Trash2 className="size-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column: "Needs Your Attention" Card */}
          <div className="lg:col-span-4">
            <div className="rounded-3xl border border-border/80 bg-white p-6 shadow-xs dark:bg-neutral-900">
              <h2 className="font-display text-lg font-bold tracking-tight text-foreground">
                Needs Your Attention
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">Recent ungraded submissions</p>

              <div className="mt-5 space-y-4">
                {pendingSubmissions.length === 0 ? (
                  <p className="py-6 text-center text-xs text-muted-foreground">
                    All caught up! No pending submissions to grade.
                  </p>
                ) : (
                  pendingSubmissions.map((sub, idx) => {
                    const student = sub.student as { full_name: string } | null;
                    const name = student?.full_name || `Student #${idx + 1}`;
                    const initials = getInitials(name);
                    const colorClass = getAvatarColor(name);
                    const assign = assignmentMap.get(sub.assignment_id);
                    const assignTitle = assign
                      ? getCleanAssignmentTitle(assign.title)
                      : "Assignment Submission";

                    return (
                      <Link
                        key={sub.id}
                        to="/teacher/grade/$submissionId"
                        params={{ submissionId: sub.id }}
                        className="flex items-center justify-between gap-3 rounded-2xl p-2 transition hover:bg-neutral-50 dark:hover:bg-neutral-800/60"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex size-10 items-center justify-center rounded-full text-xs font-bold shadow-xs ${colorClass}`}
                          >
                            {initials}
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-foreground">{name}</div>
                            <div className="text-[11px] text-muted-foreground">{assignTitle}</div>
                          </div>
                        </div>
                        <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                          {sub.submitted_at
                            ? new Date(sub.submitted_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "Recently"}
                        </span>
                      </Link>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Assignment Confirmation Dialog */}
      <AlertDialog
        open={!!deletingAssignment}
        onOpenChange={(open) => {
          if (!open) setDeletingAssignment(null);
        }}
      >
        <AlertDialogContent className="rounded-3xl border border-white/60 bg-white/95 p-7 shadow-2xl backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900/95">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-xl font-bold text-red-600">
              Permanently delete assignment?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              Are you sure you want to permanently delete{" "}
              <strong className="text-foreground">{deletingAssignment?.title}</strong>? This will
              completely remove the assignment, all student submissions, scanned answer pages,
              grades, and notifications from the database. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-3">
            <AlertDialogCancel className="rounded-xl border border-border/80">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingAssignment) {
                  deleteAssignmentMutation.mutate(deletingAssignment.id);
                }
              }}
              disabled={deleteAssignmentMutation.isPending}
              className="rounded-xl bg-red-600 text-white hover:bg-red-700"
            >
              {deleteAssignmentMutation.isPending ? "Deleting..." : "Delete Permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* New Assignment Modal Dialog */}
      <NewAssignmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        teacherId={profile?.id ?? null}
        nextNo={(assignments.data?.length ?? 0) + 1}
      />
    </AppShell>
  );
}

function NewAssignmentDialog({
  open,
  onOpenChange,
  teacherId,
  nextNo,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacherId: string | null;
  nextNo: number;
}) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [assignmentNo, setAssignmentNo] = useState(String(nextNo));
  const [totalQuestions, setTotalQuestions] = useState(5);
  const [marksPerQuestion, setMarksPerQuestion] = useState(5);
  const [file, setFile] = useState<File | null>(null);

  const calculatedTotalMarks = Math.max(1, totalQuestions) * Math.max(1, marksPerQuestion);

  useEffect(() => {
    if (open) {
      setAssignmentNo(String(nextNo));
      setMarksPerQuestion(5);
    }
  }, [open, nextNo]);

  const create = useMutation({
    onMutate: async () => {
      // Cancel any outgoing refetches so they don't overwrite optimistic update
      await queryClient.cancelQueries({ queryKey: ["assignments"] });

      const previousAssignments = queryClient.getQueryData<Assignment[]>(["assignments"]) || [];
      const cleanTitleInput = getCleanAssignmentTitle(title);
      const fullTitleWithTag = `${cleanTitleInput} [${marksPerQuestion} Marks/Q]`;
      const tempId =
        "assign_" + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);

      const optimisticAssignment: Assignment = {
        id: tempId,
        teacher_id: teacherId || "teacher",
        title: fullTitleWithTag,
        assignment_no: Number(assignmentNo) || nextNo,
        total_questions: Number(totalQuestions) || 5,
        question_paper_url: encodeQuestionPaperUrl(null, marksPerQuestion),
        is_open: true,
        closed_at: null,
        created_at: new Date().toISOString(),
      };

      // Optimistically update React Query cache immediately
      queryClient.setQueryData<Assignment[]>(["assignments"], (old = []) => {
        const updated = [...old.filter((a) => a.id !== tempId), optimisticAssignment];
        return updated.sort((a, b) => (a.assignment_no || 0) - (b.assignment_no || 0));
      });

      // Close dialog immediately for instant UI feedback
      onOpenChange(false);
      toast.success("Assignment created successfully!");

      // Reset form fields
      const currentFile = file;
      const currentTitle = title;
      const currentAssignmentNo = assignmentNo;
      const currentTotalQuestions = totalQuestions;
      const currentMarksPerQuestion = marksPerQuestion;

      setTitle("");
      setFile(null);
      setTotalQuestions(5);
      setMarksPerQuestion(5);

      return {
        previousAssignments,
        tempId,
        currentFile,
        currentTitle,
        currentAssignmentNo,
        currentTotalQuestions,
        currentMarksPerQuestion,
      };
    },
    mutationFn: async (contextData?: {
      currentFile: File | null;
      currentTitle: string;
      currentAssignmentNo: string;
      currentTotalQuestions: number;
      currentMarksPerQuestion: number;
      tempId?: string;
    }) => {
      if (!teacherId) throw new Error("Missing teacher profile");

      const fileToUpload = contextData?.currentFile ?? file;
      const titleToUse = contextData?.currentTitle ?? title;
      const noToUse = contextData?.currentAssignmentNo ?? assignmentNo;
      const qCountToUse = contextData?.currentTotalQuestions ?? totalQuestions;
      const marksToUse = contextData?.currentMarksPerQuestion ?? marksPerQuestion;

      let questionPaperUrl: string | null = null;
      if (fileToUpload) {
        const storagePath = `question-papers/${teacherId}/${Date.now()}-${fileToUpload.name.replace(/[^\w.-]/g, "_")}`;
        questionPaperUrl = await uploadFileToStorage(storagePath, fileToUpload);
      }

      // Encode marksPerQuestion in question_paper_url and title tag
      const encodedPaperUrl = encodeQuestionPaperUrl(questionPaperUrl, marksToUse);
      const cleanTitleInput = getCleanAssignmentTitle(titleToUse);
      const fullTitleWithTag = `${cleanTitleInput} [${marksToUse} Marks/Q]`;

      const docRef = doc(collection(db, "assignments"));
      const newAssignment: Assignment = {
        id: docRef.id,
        teacher_id: teacherId,
        title: fullTitleWithTag,
        assignment_no: Number(noToUse),
        total_questions: Number(qCountToUse),
        question_paper_url: encodedPaperUrl,
        is_open: true,
        closed_at: null,
        created_at: new Date().toISOString(),
      };

      await setDoc(docRef, newAssignment);
      return newAssignment;
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousAssignments) {
        queryClient.setQueryData(["assignments"], context.previousAssignments);
      }
      toast.error(error.message || "Failed to create assignment");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl border border-white/60 bg-white/95 p-7 shadow-2xl backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900/95">
        <DialogHeader className="pb-1">
          <DialogTitle className="font-display text-xl font-bold tracking-tight text-center text-foreground">
            Create New Assignment
          </DialogTitle>
        </DialogHeader>

        <form
          className="space-y-4 pt-2"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate({
              currentFile: file,
              currentTitle: title,
              currentAssignmentNo: assignmentNo,
              currentTotalQuestions: totalQuestions,
              currentMarksPerQuestion: marksPerQuestion,
            });
          }}
        >
          {/* Title */}
          <div className="space-y-1.5">
            <label htmlFor="title" className="text-xs font-semibold text-muted-foreground">
              Assignment Title
            </label>
            <input
              id="title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Mathematics Chapter 4 Practice"
              className="h-11 w-full rounded-xl border border-border/80 bg-neutral-50/70 px-4 text-sm text-foreground shadow-xs transition placeholder:text-muted-foreground/60 focus:border-[#0d5c52] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0d5c52]/20 dark:bg-neutral-800/80"
            />
          </div>

          {/* Assignment No */}
          <div className="space-y-1.5">
            <label htmlFor="assignmentNo" className="text-xs font-semibold text-muted-foreground">
              Assignment Number
            </label>
            <input
              id="assignmentNo"
              type="number"
              min={1}
              required
              value={assignmentNo}
              onChange={(e) => setAssignmentNo(e.target.value)}
              placeholder="Assignment No."
              className="h-11 w-full rounded-xl border border-border/80 bg-neutral-50/70 px-4 text-sm text-foreground shadow-xs transition placeholder:text-muted-foreground/60 focus:border-[#0d5c52] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0d5c52]/20 dark:bg-neutral-800/80"
            />
          </div>

          {/* Number of Questions Stepper */}
          <div className="flex h-11 items-center justify-between rounded-xl border border-border/80 bg-neutral-50/70 px-4 shadow-xs dark:bg-neutral-800/80">
            <span className="text-sm font-medium text-foreground">Number of Questions</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setTotalQuestions((prev) => Math.max(1, prev - 1))}
                className="flex size-7 items-center justify-center rounded-lg border border-border/80 bg-white text-foreground hover:bg-neutral-100 dark:bg-neutral-700"
              >
                <Minus className="size-3.5" />
              </button>
              <input
                type="number"
                min={1}
                max={50}
                value={totalQuestions}
                onChange={(e) => setTotalQuestions(Math.max(1, Number(e.target.value) || 1))}
                className="w-10 text-center font-bold text-sm text-foreground bg-transparent border-none focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setTotalQuestions((prev) => prev + 1)}
                className="flex size-7 items-center justify-center rounded-lg border border-border/80 bg-white text-foreground hover:bg-neutral-100 dark:bg-neutral-700"
              >
                <Plus className="size-3.5" />
              </button>
            </div>
          </div>

          {/* Marks Per Question Stepper */}
          <div className="flex h-11 items-center justify-between rounded-xl border border-border/80 bg-neutral-50/70 px-4 shadow-xs dark:bg-neutral-800/80">
            <span className="text-sm font-medium text-foreground">Marks per Question</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMarksPerQuestion((prev) => Math.max(1, prev - 1))}
                className="flex size-7 items-center justify-center rounded-lg border border-border/80 bg-white text-foreground hover:bg-neutral-100 dark:bg-neutral-700"
              >
                <Minus className="size-3.5" />
              </button>
              <input
                type="number"
                min={1}
                max={100}
                value={marksPerQuestion}
                onChange={(e) => setMarksPerQuestion(Math.max(1, Number(e.target.value) || 1))}
                className="w-10 text-center font-bold text-sm text-foreground bg-transparent border-none focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setMarksPerQuestion((prev) => prev + 1)}
                className="flex size-7 items-center justify-center rounded-lg border border-border/80 bg-white text-foreground hover:bg-neutral-100 dark:bg-neutral-700"
              >
                <Plus className="size-3.5" />
              </button>
            </div>
          </div>

          {/* Dynamic Calculated Total Marks Banner */}
          <div className="rounded-2xl border border-amber-200/80 bg-amber-50/80 p-3.5 dark:border-amber-900/50 dark:bg-amber-950/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                Calculated Total Marks:
              </span>
              <span className="text-base font-bold text-amber-950 dark:text-amber-100">
                {calculatedTotalMarks} Marks
              </span>
            </div>
            <p className="mt-1 text-[11px] text-amber-800/80 dark:text-amber-300/80">
              {totalQuestions} questions × {marksPerQuestion} marks each
            </p>
          </div>

          {/* Question Paper Dropzone / Preview */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">
              Question Paper Document (Optional)
            </label>
            <label
              htmlFor="paper"
              className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/80 bg-neutral-50/50 p-5 text-center transition hover:bg-neutral-100/50 dark:bg-neutral-800/40"
            >
              <div className="mb-2 flex size-12 items-center justify-center rounded-xl bg-neutral-200/80 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300">
                <FileText className="size-6" />
              </div>
              <span className="text-xs font-semibold text-foreground">
                {file ? file.name : "question_paper.pdf"}
              </span>
              <span className="mt-1 text-[11px] text-muted-foreground">
                {file ? "Click to change PDF" : "Click to select assignment PDF (Optional)"}
              </span>
              <input
                id="paper"
                type="file"
                accept="application/pdf,image/*"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="hidden"
              />
            </label>
          </div>

          {/* Dialog Action Buttons */}
          <DialogFooter className="mt-6 flex flex-row items-center justify-between gap-3 sm:justify-between">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex-1 rounded-xl border border-border/80 bg-neutral-100/80 py-2.5 text-sm font-semibold text-foreground hover:bg-neutral-200/70 dark:bg-neutral-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={create.isPending}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#0d5c52] py-2.5 text-sm font-semibold text-white shadow-md hover:bg-[#0a4840] disabled:opacity-50"
            >
              {create.isPending && <Loader2 className="size-4 animate-spin text-white" />}
              Create Assignment
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
