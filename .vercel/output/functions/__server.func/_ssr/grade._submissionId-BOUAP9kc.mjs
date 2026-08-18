import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { _ as useNavigate, g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { r as createServerFn } from "./server-JZmi1U-o2.mjs";
import { t as supabase } from "./client-BZqcN8FK.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as require_jsx_dev_runtime } from "../_libs/react.mjs";
import { F as CircleCheck, H as Bot, I as ChevronRight, L as ChevronLeft, O as FileXCorner, S as LoaderCircle, _ as MessageSquare, f as RotateCcw, g as Minimize2, n as ZoomIn, s as Sparkles, t as ZoomOut, v as Maximize2 } from "../_libs/lucide-react.mjs";
import { C as listPages, d as Button, f as cn, h as useSignedUrl, i as AppShell, m as useProfile, n as Route$2, y as getAssignment } from "./router-DbtMI3nh.mjs";
import { t as createSsrRpc } from "./createSsrRpc-B-t8zquH.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/grade._submissionId-BOUAP9kc.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_dev_runtime = require_jsx_dev_runtime();
var _jsxFileName$1 = "/app/applet/src/components/ui/textarea.tsx";
var Textarea = import_react.forwardRef(({ className, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("textarea", {
		className: cn("flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm", className),
		ref,
		...props
	}, void 0, false, {
		fileName: _jsxFileName$1,
		lineNumber: 8,
		columnNumber: 7
	}, void 0);
});
Textarea.displayName = "Textarea";
var generateAiFeedbackServerAction = createServerFn({ method: "POST" }).validator((data) => data).handler(createSsrRpc("8f31eb015edeb0bfed9d050c5721887cba08fe8ceae262675989bcbb1c4edf86"));
var _jsxFileName = "/app/applet/src/routes/_authenticated/teacher/grade.$submissionId.tsx?tsr-split=component";
var QUICK_FEEDBACK_PROMPTS = [
	"Great step-by-step working!",
	"Check calculations in line 2.",
	"Formula applied correctly.",
	"Incomplete final answer.",
	"Very neat and well-structured."
];
function GradePage() {
	const { submissionId } = Route$2.useParams();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { data: profile } = useProfile();
	const [marks, setMarks] = (0, import_react.useState)({});
	const [feedback, setFeedback] = (0, import_react.useState)({});
	const [overallFeedback, setOverallFeedback] = (0, import_react.useState)("");
	const [selectedQuestion, setSelectedQuestion] = (0, import_react.useState)(1);
	const [selectedPageIndex, setSelectedPageIndex] = (0, import_react.useState)(0);
	const [isFullscreen, setIsFullscreen] = (0, import_react.useState)(false);
	const [isGeneratingAI, setIsGeneratingAI] = (0, import_react.useState)(false);
	const viewerContainerRef = (0, import_react.useRef)(null);
	const submission = useQuery({
		queryKey: ["submission", submissionId],
		queryFn: async () => {
			const { data, error } = await supabase.from("submissions").select("*, student:profiles!submissions_student_id_fkey(full_name, enrollment_no)").eq("id", submissionId).maybeSingle();
			if (error) throw error;
			return data;
		}
	});
	const assignment = useQuery({
		queryKey: ["assignment", submission.data?.assignment_id],
		enabled: !!submission.data?.assignment_id,
		queryFn: () => getAssignment(submission.data.assignment_id)
	});
	const pages = useQuery({
		queryKey: ["pages", submissionId],
		queryFn: () => listPages(submissionId)
	});
	const existingMarks = useQuery({
		queryKey: ["question-marks", submissionId],
		queryFn: async () => {
			const { data, error } = await supabase.from("question_marks").select("*").eq("submission_id", submissionId);
			if (error) throw error;
			return data ?? [];
		}
	});
	(0, import_react.useEffect)(() => {
		if (existingMarks.data?.length) {
			setMarks(Object.fromEntries(existingMarks.data.map((m) => [m.question_no, String(m.marks_awarded ?? 0)])));
			setFeedback(Object.fromEntries(existingMarks.data.map((m) => [m.question_no, m.feedback ?? ""])));
		}
	}, [existingMarks.data]);
	const totalQuestions = assignment.data?.total_questions ?? 5;
	const questions = Array.from({ length: totalQuestions }, (_, i) => i + 1);
	const maxPossibleMarks = totalQuestions * 5;
	const currentTotal = Object.values(marks).reduce((sum, value) => sum + (Number(value) || 0), 0);
	const save = useMutation({
		mutationFn: async () => {
			const rows = Array.from(/* @__PURE__ */ new Set([...Object.entries(marks).filter(([, value]) => value !== "").map(([q]) => Number(q)), ...Object.entries(feedback).filter(([, value]) => value.trim() !== "").map(([q]) => Number(q))])).map((questionNo) => ({
				submission_id: submissionId,
				question_no: questionNo,
				marks_awarded: marks[questionNo] !== void 0 && marks[questionNo] !== "" ? Number(marks[questionNo]) : null,
				feedback: feedback[questionNo]?.trim() ? feedback[questionNo].trim() : null
			}));
			if (rows.length) {
				const { error } = await supabase.from("question_marks").upsert(rows, { onConflict: "submission_id,question_no" });
				if (error) throw error;
			}
			const { error: updateError } = await supabase.from("submissions").update({
				checked_status: "checked",
				total_marks: currentTotal,
				checked_at: (/* @__PURE__ */ new Date()).toISOString()
			}).eq("id", submissionId);
			if (updateError) throw updateError;
			const studentId = submission.data?.student_id;
			const notes = rows.filter((row) => !!row.feedback).map((row) => ({
				user_id: studentId,
				submission_id: submissionId,
				assignment_no: assignment.data?.assignment_no ?? null,
				assignment_title: assignment.data?.title ?? null,
				question_no: row.question_no,
				message: row.feedback
			}));
			if (overallFeedback.trim() && studentId) notes.push({
				user_id: studentId,
				submission_id: submissionId,
				assignment_no: assignment.data?.assignment_no ?? null,
				assignment_title: assignment.data?.title ?? null,
				question_no: 0,
				message: `Overall: ${overallFeedback.trim()}`
			});
			if (studentId && notes.length) {
				const { error: notifyError } = await supabase.from("notifications").insert(notes);
				if (notifyError) throw notifyError;
			}
		},
		onSuccess: () => {
			toast.success("Marks and feedback published successfully!");
			queryClient.invalidateQueries({ queryKey: ["submissions"] });
			queryClient.invalidateQueries({ queryKey: ["submission", submissionId] });
			if (submission.data?.assignment_id) navigate({
				to: "/teacher/assignments/$assignmentId",
				params: { assignmentId: submission.data.assignment_id }
			});
		},
		onError: (error) => toast.error(error.message)
	});
	const student = submission.data?.student;
	const displayPages = pages.data?.filter((p) => p.question_no === selectedQuestion) ?? [];
	const activePage = displayPages[selectedPageIndex] ?? null;
	function handleNextPage() {
		if (displayPages.length > 0 && selectedPageIndex < displayPages.length - 1) setSelectedPageIndex((prev) => prev + 1);
		else if (selectedQuestion < totalQuestions) {
			setSelectedQuestion((q) => q + 1);
			setSelectedPageIndex(0);
		}
	}
	function handlePrevPage() {
		if (selectedPageIndex > 0) setSelectedPageIndex((prev) => prev - 1);
		else if (selectedQuestion > 1) {
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
			const imagesPayload = [];
			for (const page of targetPages) {
				let fileBlob = null;
				const { data: downloaded, error } = await supabase.storage.from("submission-scans").download(page.image_url);
				if (!error && downloaded) fileBlob = downloaded;
				else {
					const { data: signed } = await supabase.storage.from("submission-scans").createSignedUrl(page.image_url, 300);
					if (signed?.signedUrl) {
						const resp = await fetch(signed.signedUrl);
						if (resp.ok) fileBlob = await resp.blob();
					}
				}
				if (!fileBlob) continue;
				const compressed = await new Promise((resolve) => {
					const img = new Image();
					const objUrl = URL.createObjectURL(fileBlob);
					img.onload = () => {
						URL.revokeObjectURL(objUrl);
						const maxDim = 1200;
						let { width, height } = img;
						if (width > maxDim || height > maxDim) {
							if (width > height) {
								height = Math.round(height * maxDim / width);
								width = maxDim;
							} else {
								width = Math.round(width * maxDim / height);
								height = maxDim;
							}
						}
						const canvas = document.createElement("canvas");
						canvas.width = width;
						canvas.height = height;
						const ctx = canvas.getContext("2d");
						if (ctx) {
							ctx.drawImage(img, 0, 0, width, height);
							resolve({
								mimeType: "image/jpeg",
								data: canvas.toDataURL("image/jpeg", .8).split(",")[1] || ""
							});
							return;
						}
						const reader = new FileReader();
						reader.onloadend = () => {
							const res = reader.result || "";
							resolve({
								mimeType: fileBlob.type || "image/jpeg",
								data: res.split(",")[1] || ""
							});
						};
						reader.readAsDataURL(fileBlob);
					};
					img.onerror = () => {
						URL.revokeObjectURL(objUrl);
						const reader = new FileReader();
						reader.onloadend = () => {
							const res = reader.result || "";
							resolve({
								mimeType: fileBlob.type || "image/jpeg",
								data: res.split(",")[1] || ""
							});
						};
						reader.readAsDataURL(fileBlob);
					};
					img.src = objUrl;
				});
				if (compressed.data) imagesPayload.push(compressed);
			}
			if (imagesPayload.length === 0) throw new Error("Unable to retrieve scanned images for analysis.");
			const generated = await generateAiFeedbackServerAction({ data: {
				questionNo: selectedQuestion,
				assignmentTitle: assignment.data?.title,
				images: imagesPayload
			} });
			setFeedback((prev) => ({
				...prev,
				[selectedQuestion]: prev[selectedQuestion] ? `${prev[selectedQuestion]}\n\n${generated}` : generated
			}));
			toast.success(`AI feedback generated for Question ${selectedQuestion}!`, { id: toastId });
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Failed to generate AI feedback", { id: toastId });
		} finally {
			setIsGeneratingAI(false);
		}
	}
	function toggleFullscreen() {
		if (!viewerContainerRef.current) return;
		if (!document.fullscreenElement) {
			viewerContainerRef.current.requestFullscreen?.().catch(() => void 0);
			setIsFullscreen(true);
		} else {
			document.exitFullscreen?.().catch(() => void 0);
			setIsFullscreen(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(AppShell, {
		profile: profile ?? null,
		children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("nav", {
			className: "mb-6 flex flex-wrap items-center gap-2 text-sm font-medium text-muted-foreground",
			children: [
				/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Link, {
					to: "/teacher",
					className: "text-[#0d5c52] transition hover:underline dark:text-emerald-400",
					children: "Assignments"
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 313,
					columnNumber: 9
				}, this),
				/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(ChevronRight, { className: "size-4 text-muted-foreground/60" }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 316,
					columnNumber: 9
				}, this),
				/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Link, {
					to: "/teacher/assignments/$assignmentId",
					params: { assignmentId: submission.data?.assignment_id ?? "" },
					className: "text-foreground transition hover:underline",
					children: assignment.data?.title ?? "Assignment"
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 317,
					columnNumber: 9
				}, this),
				/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(ChevronRight, { className: "size-4 text-muted-foreground/60" }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 322,
					columnNumber: 9
				}, this),
				submission.data?.student_id ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Link, {
					to: "/teacher/students/$studentId",
					params: { studentId: submission.data.student_id },
					className: "text-foreground transition hover:text-[#0d5c52] hover:underline",
					children: student?.full_name ?? "Student Vault"
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 323,
					columnNumber: 40
				}, this) : /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
					className: "font-semibold text-foreground",
					children: student?.full_name ?? "Student Submission"
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 327,
					columnNumber: 21
				}, this),
				/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(ChevronRight, { className: "size-4 text-muted-foreground/60" }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 330,
					columnNumber: 9
				}, this),
				/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
					className: "font-semibold text-[#0d5c52] dark:text-emerald-400",
					children: "Grade & Answer Scans"
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 331,
					columnNumber: 9
				}, this)
			]
		}, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 312,
			columnNumber: 7
		}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
			className: "grid grid-cols-1 gap-6 lg:grid-cols-12 xl:gap-8",
			children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
				ref: viewerContainerRef,
				className: "flex flex-col rounded-3xl border border-[#b8ded4]/70 bg-[#e6f0ee]/50 p-4 shadow-sm sm:p-6 lg:col-span-8 dark:border-teal-950 dark:bg-card/70",
				children: [
					/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
						className: "mb-4 flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
							className: "flex items-center gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("h2", {
								className: "font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl",
								children: ["Question ", selectedQuestion]
							}, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 343,
								columnNumber: 15
							}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
								className: "hidden sm:flex items-center gap-1",
								children: questions.map((q) => {
									const hasAnswer = pages.data?.some((p) => p.question_no === q);
									const isGraded = marks[q] !== void 0 && marks[q] !== "";
									return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", {
										type: "button",
										onClick: () => {
											setSelectedQuestion(q);
											setSelectedPageIndex(0);
										},
										title: hasAnswer ? `Question ${q}` : `Question ${q} — no upload for this question`,
										className: `relative size-7 rounded-lg text-xs font-semibold transition ${selectedQuestion === q ? "bg-[#0d5c52] text-white shadow-xs" : isGraded ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-300" : hasAnswer ? "bg-white/80 text-foreground hover:bg-white dark:bg-slate-800" : "border border-dashed border-border/70 text-muted-foreground/60 hover:bg-white/50"}`,
										children: q
									}, q, false, {
										fileName: _jsxFileName,
										lineNumber: 351,
										columnNumber: 24
									}, this);
								})
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 347,
								columnNumber: 15
							}, this)]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 342,
							columnNumber: 13
						}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", {
								type: "button",
								onClick: generateAiFeedback,
								disabled: isGeneratingAI || displayPages.length === 0,
								className: "inline-flex items-center gap-1.5 rounded-xl border border-[#0d5c52]/30 bg-white/95 px-3 py-1.5 text-xs font-bold text-[#0d5c52] shadow-xs transition hover:bg-[#0d5c52]/10 active:scale-95 disabled:opacity-50 dark:border-emerald-500/40 dark:bg-slate-900/95 dark:text-emerald-300",
								children: isGeneratingAI ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(import_jsx_dev_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(LoaderCircle, { className: "size-3.5 animate-spin text-[#0d5c52]" }, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 365,
									columnNumber: 21
								}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { children: [
									"AI Analyzing Q",
									selectedQuestion,
									"…"
								] }, void 0, true, {
									fileName: _jsxFileName,
									lineNumber: 366,
									columnNumber: 21
								}, this)] }, void 0, true, {
									fileName: _jsxFileName,
									lineNumber: 364,
									columnNumber: 35
								}, this) : /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(import_jsx_dev_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Bot, { className: "size-3.5 text-[#0d5c52] dark:text-emerald-400" }, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 368,
									columnNumber: 21
								}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { children: "Generate AI Feedback" }, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 369,
									columnNumber: 21
								}, this)] }, void 0, true, {
									fileName: _jsxFileName,
									lineNumber: 367,
									columnNumber: 25
								}, this)
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 363,
								columnNumber: 15
							}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
								className: "flex items-center gap-1.5 rounded-xl border border-[#b8ded4] bg-white/90 p-1 shadow-xs dark:border-slate-700 dark:bg-slate-900",
								children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", {
									type: "button",
									"aria-label": "Toggle Fullscreen",
									onClick: toggleFullscreen,
									className: "flex size-8 items-center justify-center rounded-lg text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800",
									children: isFullscreen ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Minimize2, { className: "size-4" }, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 375,
										columnNumber: 35
									}, this) : /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Maximize2, { className: "size-4" }, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 375,
										columnNumber: 70
									}, this)
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 374,
									columnNumber: 17
								}, this)
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 373,
								columnNumber: 15
							}, this)]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 362,
							columnNumber: 13
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 341,
						columnNumber: 11
					}, this),
					/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
						className: "relative flex min-h-[460px] flex-1 gap-4 overflow-hidden rounded-2xl bg-white p-3 shadow-inner sm:min-h-[560px] dark:bg-neutral-900",
						children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
							className: "hidden w-24 shrink-0 flex-col gap-3 overflow-y-auto pr-1 sm:flex md:w-28",
							children: displayPages.length === 0 ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
								className: "flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 p-3 text-center text-muted-foreground",
								children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(FileXCorner, { className: "size-5 text-muted-foreground/50 mb-1" }, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 386,
									columnNumber: 19
								}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
									className: "text-[10px] font-medium leading-tight",
									children: "no upload for this question"
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 387,
									columnNumber: 19
								}, this)]
							}, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 385,
								columnNumber: 44
							}, this) : displayPages.map((page, idx) => /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(PageThumbnailButton, {
								page,
								isActive: activePage?.id === page.id,
								onClick: () => setSelectedPageIndex(idx)
							}, page.id, false, {
								fileName: _jsxFileName,
								lineNumber: 390,
								columnNumber: 58
							}, this))
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 384,
							columnNumber: 13
						}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
							className: "relative flex flex-1 items-center justify-center overflow-hidden rounded-xl bg-slate-50 dark:bg-neutral-950",
							children: [
								activePage ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(InteractiveScanCanvas, {
									pagePath: activePage.image_url,
									questionNo: selectedQuestion
								}, activePage.id, false, {
									fileName: _jsxFileName,
									lineNumber: 395,
									columnNumber: 29
								}, this) : /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
									className: "flex flex-col items-center justify-center p-8 text-center max-w-sm",
									children: [
										/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
											className: "mb-3 flex size-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 ring-1 ring-amber-200/70 dark:bg-amber-950/40 dark:text-amber-400 dark:ring-amber-900/60",
											children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(FileXCorner, { className: "size-7" }, void 0, false, {
												fileName: _jsxFileName,
												lineNumber: 397,
												columnNumber: 21
											}, this)
										}, void 0, false, {
											fileName: _jsxFileName,
											lineNumber: 396,
											columnNumber: 19
										}, this),
										/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("h3", {
											className: "font-display text-base font-bold text-foreground",
											children: "no upload for this question"
										}, void 0, false, {
											fileName: _jsxFileName,
											lineNumber: 399,
											columnNumber: 19
										}, this),
										/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", {
											className: "mt-1.5 text-xs text-muted-foreground leading-relaxed",
											children: [
												"The student has not submitted or captured any answer scan for Question",
												" ",
												selectedQuestion,
												"."
											]
										}, void 0, true, {
											fileName: _jsxFileName,
											lineNumber: 402,
											columnNumber: 19
										}, this),
										/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
											className: "mt-4 inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50/80 px-3 py-1 text-[11px] font-semibold text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/50 dark:text-amber-300",
											children: "Remark: no upload for this question"
										}, void 0, false, {
											fileName: _jsxFileName,
											lineNumber: 406,
											columnNumber: 19
										}, this)
									]
								}, void 0, true, {
									fileName: _jsxFileName,
									lineNumber: 395,
									columnNumber: 139
								}, this),
								/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", {
									type: "button",
									"aria-label": "Previous Page",
									onClick: handlePrevPage,
									disabled: selectedQuestion === 1 && selectedPageIndex === 0,
									className: "absolute left-3 flex size-10 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow-md backdrop-blur-sm transition hover:scale-105 hover:bg-white disabled:opacity-30 dark:bg-slate-800/90 dark:text-white dark:hover:bg-slate-800",
									children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(ChevronLeft, { className: "size-5" }, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 413,
										columnNumber: 17
									}, this)
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 412,
									columnNumber: 15
								}, this),
								/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", {
									type: "button",
									"aria-label": "Next Page",
									onClick: handleNextPage,
									disabled: selectedQuestion === totalQuestions && (displayPages.length === 0 || selectedPageIndex >= displayPages.length - 1),
									className: "absolute right-3 flex size-10 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow-md backdrop-blur-sm transition hover:scale-105 hover:bg-white disabled:opacity-30 dark:bg-slate-800/90 dark:text-white dark:hover:bg-slate-800",
									children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(ChevronRight, { className: "size-5" }, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 417,
										columnNumber: 17
									}, this)
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 416,
									columnNumber: 15
								}, this)
							]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 394,
							columnNumber: 13
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 382,
						columnNumber: 11
					}, this),
					/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
						className: "mt-4 flex items-center justify-between pt-2",
						children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", {
							type: "button",
							onClick: () => {
								if (selectedQuestion < totalQuestions) {
									setSelectedQuestion((q) => q + 1);
									setSelectedPageIndex(0);
								}
							},
							className: "flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground",
							children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { children: ["Question ", Math.min(selectedQuestion + 1, totalQuestions)] }, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 430,
								columnNumber: 15
							}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(ChevronRight, { className: "size-4" }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 431,
								columnNumber: 15
							}, this)]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 424,
							columnNumber: 13
						}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
							className: "text-xs text-muted-foreground font-medium",
							children: displayPages.length === 0 ? "no upload for this question" : `Page ${selectedPageIndex + 1} of ${displayPages.length}`
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 433,
							columnNumber: 13
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 423,
						columnNumber: 11
					}, this)
				]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 339,
				columnNumber: 9
			}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
				className: "flex flex-col space-y-4 lg:col-span-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
						className: "rounded-2xl border border-[#c1e5dc] bg-[#e2f1ec] p-4 text-[#134e4a] shadow-xs dark:border-teal-900/60 dark:bg-teal-950/60 dark:text-teal-200",
						children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
							className: "font-semibold text-sm leading-snug",
							children: [
								"Grading: ",
								student?.full_name ?? "Student",
								" —",
								" ",
								/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
									className: "font-normal capitalize",
									children: submission.data?.checked_status === "checked" ? "Checked" : submission.data?.status === "submitted" ? "Submitted - pending" : "Not submitted"
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 445,
									columnNumber: 15
								}, this)
							]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 443,
							columnNumber: 13
						}, this), student?.enrollment_no && /* @__PURE__ */ (void 0)("p", {
							className: "mt-0.5 text-xs text-[#134e4a]/75 dark:text-teal-300/75",
							children: ["Roll / Enrollment: ", student.enrollment_no]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 449,
							columnNumber: 40
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 442,
						columnNumber: 11
					}, this),
					/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
						className: "space-y-2.5 rounded-2xl border border-border bg-card p-4 shadow-xs dark:bg-card",
						children: [
							questions.map((questionNo) => {
								const isCurrent = selectedQuestion === questionNo;
								const hasAnswer = pages.data?.some((p) => p.question_no === questionNo);
								return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
									onClick: () => {
										setSelectedQuestion(questionNo);
										setSelectedPageIndex(0);
									},
									className: `flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 transition ${isCurrent ? "bg-[#e6f0ee]/80 ring-1 ring-[#0d5c52]/30 dark:bg-teal-950/40" : "hover:bg-accent/40"}`,
									children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
										className: "flex items-center gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("label", {
											htmlFor: `marks-${questionNo}`,
											className: "cursor-pointer text-sm font-semibold text-foreground",
											children: [
												"Q",
												questionNo,
												" Marks"
											]
										}, void 0, true, {
											fileName: _jsxFileName,
											lineNumber: 464,
											columnNumber: 21
										}, this), !hasAnswer && /* @__PURE__ */ (void 0)("span", {
											className: "rounded-md bg-amber-100/70 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
											children: "no upload"
										}, void 0, false, {
											fileName: _jsxFileName,
											lineNumber: 467,
											columnNumber: 36
										}, this)]
									}, void 0, true, {
										fileName: _jsxFileName,
										lineNumber: 463,
										columnNumber: 19
									}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("input", {
										id: `marks-${questionNo}`,
										type: "number",
										min: 0,
										max: 100,
										placeholder: "—",
										value: marks[questionNo] ?? "",
										onChange: (e) => setMarks((prev) => ({
											...prev,
											[questionNo]: e.target.value
										})),
										className: "h-10 w-24 rounded-xl border border-border bg-white px-3 text-center text-base font-bold text-foreground shadow-xs outline-none transition focus:border-[#0d5c52] focus:ring-2 focus:ring-[#0d5c52]/20 dark:bg-slate-900"
									}, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 471,
										columnNumber: 19
									}, this)]
								}, questionNo, true, {
									fileName: _jsxFileName,
									lineNumber: 459,
									columnNumber: 20
								}, this);
							}),
							/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
								className: "border-t border-border/60 pt-3 text-xs font-medium text-muted-foreground",
								children: [
									"Running-sum calculation suggests your moves + Q1 = ",
									currentTotal,
									"/",
									maxPossibleMarks
								]
							}, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 479,
								columnNumber: 13
							}, this),
							/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
								className: "flex items-center justify-between pt-1",
								children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
									className: "font-display text-base font-bold text-foreground",
									children: "Total Marks"
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 485,
									columnNumber: 15
								}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
									className: "rounded-xl border border-[#fed7aa] bg-[#fef7ee] px-4 py-2 text-base font-bold text-[#7c2d12] shadow-xs dark:border-amber-900/60 dark:bg-amber-950/60 dark:text-amber-200",
									children: [
										currentTotal,
										"/",
										maxPossibleMarks
									]
								}, void 0, true, {
									fileName: _jsxFileName,
									lineNumber: 486,
									columnNumber: 15
								}, this)]
							}, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 484,
								columnNumber: 13
							}, this)
						]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 455,
						columnNumber: 11
					}, this),
					/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
						className: "space-y-3 rounded-2xl border border-border bg-card p-4 shadow-xs dark:bg-card",
						children: [
							/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
								className: "flex flex-wrap items-center justify-between gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
									className: "flex items-center gap-1.5 font-display text-sm font-bold text-foreground",
									children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(MessageSquare, { className: "size-4 text-[#0d5c52] dark:text-teal-400" }, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 496,
										columnNumber: 17
									}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { children: [
										"Teacher Feedback (Q",
										selectedQuestion,
										")"
									] }, void 0, true, {
										fileName: _jsxFileName,
										lineNumber: 497,
										columnNumber: 17
									}, this)]
								}, void 0, true, {
									fileName: _jsxFileName,
									lineNumber: 495,
									columnNumber: 15
								}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", {
									type: "button",
									onClick: generateAiFeedback,
									disabled: isGeneratingAI || displayPages.length === 0,
									className: "inline-flex items-center gap-1.5 rounded-lg border border-[#0d5c52]/30 bg-[#0d5c52]/10 px-2.5 py-1 text-[11px] font-bold text-[#0d5c52] shadow-2xs transition hover:bg-[#0d5c52]/20 active:scale-95 disabled:opacity-50 dark:border-emerald-500/40 dark:bg-emerald-950/60 dark:text-emerald-300",
									children: isGeneratingAI ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(import_jsx_dev_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(LoaderCircle, { className: "size-3 animate-spin text-[#0d5c52]" }, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 502,
										columnNumber: 21
									}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { children: "Analyzing scans…" }, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 503,
										columnNumber: 21
									}, this)] }, void 0, true, {
										fileName: _jsxFileName,
										lineNumber: 501,
										columnNumber: 35
									}, this) : /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(import_jsx_dev_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Bot, { className: "size-3 text-[#0d5c52] dark:text-emerald-400" }, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 505,
										columnNumber: 21
									}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { children: "Generate AI Feedback" }, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 506,
										columnNumber: 21
									}, this)] }, void 0, true, {
										fileName: _jsxFileName,
										lineNumber: 504,
										columnNumber: 25
									}, this)
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 500,
									columnNumber: 15
								}, this)]
							}, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 494,
								columnNumber: 13
							}, this),
							/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
								className: "flex flex-wrap gap-1.5",
								children: QUICK_FEEDBACK_PROMPTS.map((prompt) => /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", {
									type: "button",
									onClick: () => setFeedback((prev) => ({
										...prev,
										[selectedQuestion]: prev[selectedQuestion] ? `${prev[selectedQuestion]} ${prompt}` : prompt
									})),
									className: "inline-flex items-center gap-1 rounded-lg border border-border bg-accent/30 px-2 py-1 text-[11px] font-medium text-foreground transition hover:bg-accent hover:border-[#0d5c52]/30",
									children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Sparkles, { className: "size-2.5 text-[#0d5c52]" }, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 517,
										columnNumber: 19
									}, this), prompt]
								}, prompt, true, {
									fileName: _jsxFileName,
									lineNumber: 513,
									columnNumber: 53
								}, this))
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 512,
								columnNumber: 13
							}, this),
							/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Textarea, {
								rows: 3,
								placeholder: `Write specific notes or guidance for Question ${selectedQuestion}...`,
								value: feedback[selectedQuestion] ?? "",
								onChange: (e) => setFeedback((prev) => ({
									...prev,
									[selectedQuestion]: e.target.value
								})),
								className: "resize-none rounded-xl border-border bg-white text-sm dark:bg-slate-900"
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 523,
								columnNumber: 13
							}, this),
							/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
								className: "pt-2",
								children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("label", {
									htmlFor: "overall-notes",
									className: "block text-xs font-semibold text-muted-foreground mb-1",
									children: "Overall Assignment Remarks (Optional)"
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 530,
									columnNumber: 15
								}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Textarea, {
									id: "overall-notes",
									rows: 2,
									placeholder: "Overall praise, constructive tips, or general review...",
									value: overallFeedback,
									onChange: (e) => setOverallFeedback(e.target.value),
									className: "resize-none rounded-xl border-border bg-white text-xs dark:bg-slate-900"
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 533,
									columnNumber: 15
								}, this)]
							}, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 529,
								columnNumber: 13
							}, this)
						]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 493,
						columnNumber: 11
					}, this),
					/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Button, {
						size: "lg",
						onClick: () => save.mutate(),
						disabled: save.isPending,
						className: "h-12 w-full rounded-xl bg-[#0d5c52] text-sm font-bold text-white shadow-md transition hover:bg-[#0a4840] active:scale-[0.99] dark:bg-emerald-600 dark:hover:bg-emerald-700",
						children: save.isPending ? "Submitting..." : /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(import_jsx_dev_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(CircleCheck, { className: "mr-2 size-4" }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 540,
							columnNumber: 17
						}, this), "Submit Checked Status"] }, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 539,
							columnNumber: 49
						}, this)
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 538,
						columnNumber: 11
					}, this)
				]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 440,
				columnNumber: 9
			}, this)]
		}, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 337,
			columnNumber: 7
		}, this)]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 310,
		columnNumber: 10
	}, this);
}
function PageThumbnailButton({ page, isActive, onClick }) {
	const url = useSignedUrl("submission-scans", page.image_url);
	return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", {
		type: "button",
		onClick,
		className: `group relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-slate-100 transition-all ${isActive ? "border-2 border-[#0d5c52] shadow-md ring-2 ring-[#0d5c52]/20" : "border border-border opacity-70 hover:opacity-100"}`,
		children: [url ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("img", {
			src: url,
			alt: `Page ${page.question_no}`,
			className: "h-full w-full object-cover"
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 559,
			columnNumber: 14
		}, this) : /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "h-full w-full animate-pulse bg-slate-200" }, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 559,
			columnNumber: 106
		}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
			className: "absolute bottom-1 right-1 rounded bg-black/60 px-1 py-0.5 text-[9px] font-semibold text-white",
			children: ["Q", page.question_no]
		}, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 560,
			columnNumber: 7
		}, this)]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 558,
		columnNumber: 10
	}, this);
}
function InteractiveScanCanvas({ pagePath, questionNo }) {
	const url = useSignedUrl("submission-scans", pagePath);
	const containerRef = (0, import_react.useRef)(null);
	const [zoom, setZoom] = (0, import_react.useState)(1);
	const [offset, setOffset] = (0, import_react.useState)({
		x: 0,
		y: 0
	});
	const dragRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		setZoom(1);
		setOffset({
			x: 0,
			y: 0
		});
	}, [pagePath]);
	function zoomBy(factor) {
		setZoom((z) => Math.min(5, Math.max(.8, z * factor)));
	}
	function resetZoom() {
		setZoom(1);
		setOffset({
			x: 0,
			y: 0
		});
	}
	if (!url) return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
		className: "flex h-full w-full items-center justify-center",
		children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "size-8 animate-spin rounded-full border-2 border-[#0d5c52] border-t-transparent" }, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 605,
			columnNumber: 9
		}, this)
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 604,
		columnNumber: 12
	}, this);
	return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
		ref: containerRef,
		className: "relative flex h-full w-full cursor-grab items-center justify-center overflow-hidden touch-none active:cursor-grabbing",
		onPointerDown: (e) => {
			e.target.setPointerCapture?.(e.pointerId);
			dragRef.current = {
				x: e.clientX,
				y: e.clientY,
				ox: offset.x,
				oy: offset.y
			};
		},
		onPointerMove: (e) => {
			const d = dragRef.current;
			if (!d) return;
			setOffset({
				x: d.ox + (e.clientX - d.x),
				y: d.oy + (e.clientY - d.y)
			});
		},
		onPointerUp: () => {
			dragRef.current = null;
		},
		children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("img", {
			src: url,
			alt: `Student answer scan for question ${questionNo}`,
			draggable: false,
			className: "max-h-full max-w-full select-none object-contain transition-transform duration-75 ease-out",
			style: { transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})` }
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 626,
			columnNumber: 7
		}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
			className: "absolute bottom-3 right-3 flex items-center gap-1 rounded-xl border border-border/80 bg-white/90 p-1 shadow-md backdrop-blur-md dark:bg-slate-900/90",
			children: [
				/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", {
					type: "button",
					"aria-label": "Zoom In",
					onClick: (e) => {
						e.stopPropagation();
						zoomBy(1.25);
					},
					className: "flex size-7 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800",
					children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(ZoomIn, { className: "size-3.5" }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 636,
						columnNumber: 11
					}, this)
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 632,
					columnNumber: 9
				}, this),
				/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", {
					type: "button",
					"aria-label": "Zoom Out",
					onClick: (e) => {
						e.stopPropagation();
						zoomBy(1 / 1.25);
					},
					className: "flex size-7 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800",
					children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(ZoomOut, { className: "size-3.5" }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 642,
						columnNumber: 11
					}, this)
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 638,
					columnNumber: 9
				}, this),
				/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", {
					type: "button",
					"aria-label": "Reset Zoom",
					onClick: (e) => {
						e.stopPropagation();
						resetZoom();
					},
					className: "flex size-7 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800",
					children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(RotateCcw, { className: "size-3.5" }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 648,
						columnNumber: 11
					}, this)
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 644,
					columnNumber: 9
				}, this)
			]
		}, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 631,
			columnNumber: 7
		}, this)]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 608,
		columnNumber: 10
	}, this);
}
//#endregion
export { GradePage as component };
