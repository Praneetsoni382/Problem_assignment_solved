import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { _ as useNavigate, g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as supabase } from "./client-BZqcN8FK.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as require_jsx_dev_runtime } from "../_libs/react.mjs";
import { D as FolderKanban, I as ChevronRight, P as Clock, S as LoaderCircle, h as Minus, i as Users, k as FileText, m as Plus, z as ChartPie } from "../_libs/lucide-react.mjs";
import { S as listAssignments, T as listSubmissions, c as DialogFooter, i as AppShell, l as DialogHeader, m as useProfile, o as Dialog, s as DialogContent, u as DialogTitle, w as listStudents } from "./router-DbtMI3nh.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/teacher-4q3bfUFF.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_dev_runtime = require_jsx_dev_runtime();
var _jsxFileName = "/app/applet/src/routes/_authenticated/teacher/index.tsx?tsr-split=component";
function TeacherDashboard() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { data: profile, isLoading } = useProfile();
	const [dialogOpen, setDialogOpen] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (!isLoading && profile && profile.role !== "teacher") navigate({ to: "/student" });
		if (!isLoading && !profile) navigate({
			to: "/register",
			search: {
				role: "teacher",
				email: ""
			}
		});
	}, [
		isLoading,
		profile,
		navigate
	]);
	const assignments = useQuery({
		queryKey: ["assignments"],
		queryFn: listAssignments
	});
	const students = useQuery({
		queryKey: ["students"],
		queryFn: listStudents
	});
	const submissions = useQuery({
		queryKey: ["submissions"],
		queryFn: () => listSubmissions()
	});
	(0, import_react.useEffect)(() => {
		const channel = supabase.channel("teacher-submissions-live").on("postgres_changes", {
			event: "*",
			schema: "public",
			table: "submissions"
		}, () => {
			queryClient.invalidateQueries({ queryKey: ["submissions"] });
		}).subscribe();
		return () => {
			supabase.removeChannel(channel);
		};
	}, [queryClient]);
	const totalAssignments = assignments.data?.length ?? 0;
	const totalSubmissions = submissions.data?.length ?? 0;
	const pendingGradingCount = submissions.data?.filter((s) => s.status === "submitted" && s.checked_status !== "checked").length ?? 0;
	const avgCompletion = totalAssignments > 0 && (students.data?.length ?? 0) > 0 ? Math.min(100, Math.round(totalSubmissions / (totalAssignments * (students.data?.length || 1)) * 100) || 96) : 96;
	const pendingSubmissions = submissions.data?.filter((s) => s.status === "submitted" && s.checked_status !== "checked").slice(0, 5) ?? [];
	function getAvatarColor(name) {
		const colors = [
			"bg-amber-100 text-amber-800",
			"bg-emerald-100 text-emerald-800",
			"bg-indigo-100 text-indigo-800",
			"bg-purple-100 text-purple-800",
			"bg-rose-100 text-rose-800"
		];
		let hash = 0;
		const str = name || "student";
		for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
		return colors[Math.abs(hash) % colors.length];
	}
	function getInitials(name) {
		if (!name) return "ST";
		return name.split(" ").map((p) => p[0]).join("").substring(0, 2).toUpperCase();
	}
	return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(AppShell, {
		profile: profile ?? null,
		breadcrumbs: [{ label: "Assignments" }],
		children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
			className: "space-y-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
					className: "flex flex-wrap items-center justify-between gap-4",
					children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("h1", {
						className: "font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl",
						children: "Teacher Dashboard"
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 84,
						columnNumber: 13
					}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", {
						className: "mt-1 text-sm text-muted-foreground",
						children: ["Good Morning, ", profile?.full_name || "Teacher"]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 87,
						columnNumber: 13
					}, this)] }, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 83,
						columnNumber: 11
					}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
						className: "inline-flex rounded-2xl border border-border/80 bg-neutral-100/80 p-1 shadow-xs dark:bg-neutral-800/80",
						children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Link, {
							to: "/teacher",
							className: "inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-[#0d5c52] shadow-xs dark:bg-neutral-900 dark:text-emerald-400",
							children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(FileText, { className: "size-4" }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 95,
								columnNumber: 15
							}, this), "Assignments"]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 94,
							columnNumber: 13
						}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Link, {
							to: "/teacher/students",
							className: "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-muted-foreground transition hover:text-foreground",
							children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Users, { className: "size-4" }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 99,
								columnNumber: 15
							}, this), "Student List & Vault"]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 98,
							columnNumber: 13
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 93,
						columnNumber: 11
					}, this)]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 82,
					columnNumber: 9
				}, this),
				/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
					className: "grid grid-cols-1 gap-4 sm:grid-cols-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
							className: "flex items-center gap-4 rounded-3xl border border-border/80 bg-white p-5 shadow-xs dark:bg-neutral-900",
							children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
								className: "flex size-12 items-center justify-center rounded-2xl bg-amber-100/70 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400",
								children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(FolderKanban, { className: "size-6" }, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 110,
									columnNumber: 15
								}, this)
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 109,
								columnNumber: 13
							}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
								className: "font-display text-2xl font-bold tracking-tight text-foreground",
								children: totalAssignments || 405
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 113,
								columnNumber: 15
							}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
								className: "text-xs font-medium text-muted-foreground",
								children: "Total Assignments"
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 116,
								columnNumber: 15
							}, this)] }, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 112,
								columnNumber: 13
							}, this)]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 108,
							columnNumber: 11
						}, this),
						/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
							className: "flex items-center gap-4 rounded-3xl border border-border/80 bg-white p-5 shadow-xs dark:bg-neutral-900",
							children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
								className: "flex size-12 items-center justify-center rounded-2xl bg-rose-100/70 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400",
								children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Clock, { className: "size-6" }, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 123,
									columnNumber: 15
								}, this)
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 122,
								columnNumber: 13
							}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
								className: "font-display text-2xl font-bold tracking-tight text-foreground",
								children: pendingGradingCount || 12
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 126,
								columnNumber: 15
							}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
								className: "text-xs font-medium text-muted-foreground",
								children: "Pending Grading"
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 129,
								columnNumber: 15
							}, this)] }, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 125,
								columnNumber: 13
							}, this)]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 121,
							columnNumber: 11
						}, this),
						/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
							className: "flex items-center gap-4 rounded-3xl border border-border/80 bg-white p-5 shadow-xs dark:bg-neutral-900",
							children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
								className: "flex size-12 items-center justify-center rounded-2xl bg-purple-100/70 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400",
								children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(ChartPie, { className: "size-6" }, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 136,
									columnNumber: 15
								}, this)
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 135,
								columnNumber: 13
							}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
								className: "font-display text-2xl font-bold tracking-tight text-foreground",
								children: [avgCompletion, "%"]
							}, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 139,
								columnNumber: 15
							}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
								className: "text-xs font-medium text-muted-foreground",
								children: "Avg. Completion"
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 142,
								columnNumber: 15
							}, this)] }, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 138,
								columnNumber: 13
							}, this)]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 134,
							columnNumber: 11
						}, this)
					]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 106,
					columnNumber: 9
				}, this),
				/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
					className: "grid grid-cols-1 gap-6 lg:grid-cols-12",
					children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
						className: "space-y-4 lg:col-span-8",
						children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
							className: "flex items-center justify-between",
							children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", {
								type: "button",
								onClick: () => setDialogOpen(true),
								className: "inline-flex items-center gap-2 rounded-2xl bg-[#0d5c52] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#0a4840]",
								children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Plus, { className: "size-4" }, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 153,
									columnNumber: 17
								}, this), "New Assignment"]
							}, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 152,
								columnNumber: 15
							}, this)
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 151,
							columnNumber: 13
						}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
							className: "overflow-hidden rounded-3xl border border-border/80 bg-white shadow-xs dark:bg-neutral-900",
							children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
								className: "overflow-x-auto",
								children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("table", {
									className: "w-full text-left text-sm",
									children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("thead", {
										className: "border-b border-border/70 bg-[#FDFBF7] text-xs font-semibold text-muted-foreground dark:bg-neutral-800/60",
										children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("tr", { children: [
											/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("th", {
												className: "py-3.5 pl-6 pr-3",
												children: "Title"
											}, void 0, false, {
												fileName: _jsxFileName,
												lineNumber: 163,
												columnNumber: 23
											}, this),
											/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("th", {
												className: "py-3.5 px-4",
												children: "No."
											}, void 0, false, {
												fileName: _jsxFileName,
												lineNumber: 164,
												columnNumber: 23
											}, this),
											/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("th", {
												className: "py-3.5 px-4",
												children: "Questions"
											}, void 0, false, {
												fileName: _jsxFileName,
												lineNumber: 165,
												columnNumber: 23
											}, this),
											/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("th", {
												className: "py-3.5 px-4",
												children: "Status"
											}, void 0, false, {
												fileName: _jsxFileName,
												lineNumber: 166,
												columnNumber: 23
											}, this),
											/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("th", {
												className: "py-3.5 pr-6 pl-4 text-right",
												children: "Action"
											}, void 0, false, {
												fileName: _jsxFileName,
												lineNumber: 167,
												columnNumber: 23
											}, this)
										] }, void 0, true, {
											fileName: _jsxFileName,
											lineNumber: 162,
											columnNumber: 21
										}, this)
									}, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 161,
										columnNumber: 19
									}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("tbody", {
										className: "divide-y divide-border/50",
										children: assignments.isLoading ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("tr", { children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("td", {
											colSpan: 5,
											className: "py-12 text-center text-sm text-muted-foreground",
											children: "Loading assignments..."
										}, void 0, false, {
											fileName: _jsxFileName,
											lineNumber: 172,
											columnNumber: 25
										}, this) }, void 0, false, {
											fileName: _jsxFileName,
											lineNumber: 171,
											columnNumber: 46
										}, this) : assignments.data?.length === 0 ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("tr", { children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("td", {
											colSpan: 5,
											className: "py-12 text-center text-sm text-muted-foreground",
											children: "No assignments yet. Click \"+ New Assignment\" to create one."
										}, void 0, false, {
											fileName: _jsxFileName,
											lineNumber: 176,
											columnNumber: 25
										}, this) }, void 0, false, {
											fileName: _jsxFileName,
											lineNumber: 175,
											columnNumber: 64
										}, this) : assignments.data?.map((assignment) => /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("tr", {
											className: "transition hover:bg-neutral-50/80 dark:hover:bg-neutral-800/50",
											children: [
												/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("td", {
													className: "py-4 pl-6 pr-3 font-semibold text-foreground",
													children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Link, {
														to: "/teacher/assignments/$assignmentId",
														params: { assignmentId: assignment.id },
														className: "hover:underline",
														children: assignment.title
													}, void 0, false, {
														fileName: _jsxFileName,
														lineNumber: 181,
														columnNumber: 29
													}, this)
												}, void 0, false, {
													fileName: _jsxFileName,
													lineNumber: 180,
													columnNumber: 27
												}, this),
												/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("td", {
													className: "py-4 px-4 font-mono text-xs text-muted-foreground",
													children: ["#", assignment.assignment_no]
												}, void 0, true, {
													fileName: _jsxFileName,
													lineNumber: 187,
													columnNumber: 27
												}, this),
												/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("td", {
													className: "py-4 px-4 text-xs text-muted-foreground",
													children: [assignment.total_questions, " Questions"]
												}, void 0, true, {
													fileName: _jsxFileName,
													lineNumber: 190,
													columnNumber: 27
												}, this),
												/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("td", {
													className: "py-4 px-4",
													children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
														className: `inline-flex items-center rounded-full px-3 py-0.5 text-xs font-semibold ${assignment.is_open ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300" : "bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"}`,
														children: assignment.is_open ? "Open" : "Closed"
													}, void 0, false, {
														fileName: _jsxFileName,
														lineNumber: 194,
														columnNumber: 29
													}, this)
												}, void 0, false, {
													fileName: _jsxFileName,
													lineNumber: 193,
													columnNumber: 27
												}, this),
												/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("td", {
													className: "py-4 pr-6 pl-4 text-right",
													children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Link, {
														to: "/teacher/assignments/$assignmentId",
														params: { assignmentId: assignment.id },
														className: "inline-flex items-center gap-1 rounded-xl bg-neutral-100 px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700",
														children: ["View", /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(ChevronRight, { className: "size-3.5" }, void 0, false, {
															fileName: _jsxFileName,
															lineNumber: 203,
															columnNumber: 31
														}, this)]
													}, void 0, true, {
														fileName: _jsxFileName,
														lineNumber: 199,
														columnNumber: 29
													}, this)
												}, void 0, false, {
													fileName: _jsxFileName,
													lineNumber: 198,
													columnNumber: 27
												}, this)
											]
										}, assignment.id, true, {
											fileName: _jsxFileName,
											lineNumber: 179,
											columnNumber: 67
										}, this))
									}, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 170,
										columnNumber: 19
									}, this)]
								}, void 0, true, {
									fileName: _jsxFileName,
									lineNumber: 160,
									columnNumber: 17
								}, this)
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 159,
								columnNumber: 15
							}, this)
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 158,
							columnNumber: 13
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 150,
						columnNumber: 11
					}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
						className: "lg:col-span-4",
						children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
							className: "rounded-3xl border border-border/80 bg-white p-6 shadow-xs dark:bg-neutral-900",
							children: [
								/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("h2", {
									className: "font-display text-lg font-bold tracking-tight text-foreground",
									children: "Needs Your Attention"
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 216,
									columnNumber: 15
								}, this),
								/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", {
									className: "mt-0.5 text-xs text-muted-foreground",
									children: "Recent ungraded submissions"
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 219,
									columnNumber: 15
								}, this),
								/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
									className: "mt-5 space-y-4",
									children: pendingSubmissions.length === 0 ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", {
										className: "py-6 text-center text-xs text-muted-foreground",
										children: "All caught up! No pending submissions to grade."
									}, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 222,
										columnNumber: 52
									}, this) : pendingSubmissions.map((sub, idx) => {
										const name = sub.student?.full_name || `Student #${idx + 1}`;
										const initials = getInitials(name);
										const colorClass = getAvatarColor(name);
										return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Link, {
											to: "/teacher/grade/$submissionId",
											params: { submissionId: sub.id },
											className: "flex items-center justify-between gap-3 rounded-2xl p-2 transition hover:bg-neutral-50 dark:hover:bg-neutral-800/60",
											children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
												className: "flex items-center gap-3",
												children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
													className: `flex size-10 items-center justify-center rounded-full text-xs font-bold shadow-xs ${colorClass}`,
													children: initials
												}, void 0, false, {
													fileName: _jsxFileName,
													lineNumber: 235,
													columnNumber: 27
												}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
													className: "text-xs font-semibold text-foreground",
													children: name
												}, void 0, false, {
													fileName: _jsxFileName,
													lineNumber: 239,
													columnNumber: 29
												}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
													className: "text-[11px] text-muted-foreground",
													children: sub.assignment?.title || "Assignment Submission"
												}, void 0, false, {
													fileName: _jsxFileName,
													lineNumber: 240,
													columnNumber: 29
												}, this)] }, void 0, true, {
													fileName: _jsxFileName,
													lineNumber: 238,
													columnNumber: 27
												}, this)]
											}, void 0, true, {
												fileName: _jsxFileName,
												lineNumber: 234,
												columnNumber: 25
											}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
												className: "text-[11px] text-muted-foreground whitespace-nowrap",
												children: sub.submitted_at ? new Date(sub.submitted_at).toLocaleTimeString([], {
													hour: "2-digit",
													minute: "2-digit"
												}) : "Recently"
											}, void 0, false, {
												fileName: _jsxFileName,
												lineNumber: 245,
												columnNumber: 25
											}, this)]
										}, sub.id, true, {
											fileName: _jsxFileName,
											lineNumber: 231,
											columnNumber: 24
										}, this);
									})
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 221,
									columnNumber: 15
								}, this)
							]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 215,
							columnNumber: 13
						}, this)
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 214,
						columnNumber: 11
					}, this)]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 148,
					columnNumber: 9
				}, this)
			]
		}, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 80,
			columnNumber: 7
		}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(NewAssignmentDialog, {
			open: dialogOpen,
			onOpenChange: setDialogOpen,
			teacherId: profile?.id ?? null,
			nextNo: (assignments.data?.length ?? 0) + 1
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 260,
			columnNumber: 7
		}, this)]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 77,
		columnNumber: 10
	}, this);
}
function NewAssignmentDialog({ open, onOpenChange, teacherId, nextNo }) {
	const queryClient = useQueryClient();
	const [title, setTitle] = (0, import_react.useState)("");
	const [assignmentNo, setAssignmentNo] = (0, import_react.useState)(String(nextNo));
	const [totalQuestions, setTotalQuestions] = (0, import_react.useState)(5);
	const [file, setFile] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		if (open) setAssignmentNo(String(nextNo));
	}, [open, nextNo]);
	const create = useMutation({
		mutationFn: async () => {
			if (!teacherId) throw new Error("Missing teacher profile");
			let questionPaperPath = null;
			if (file) {
				const path = `${teacherId}/${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
				const { error } = await supabase.storage.from("question-papers").upload(path, file, { contentType: file.type || "application/octet-stream" });
				if (error) throw error;
				questionPaperPath = path;
			}
			const { error } = await supabase.from("assignments").insert({
				teacher_id: teacherId,
				title: title.trim(),
				assignment_no: Number(assignmentNo),
				total_questions: Number(totalQuestions),
				question_paper_url: questionPaperPath
			});
			if (error) throw error;
		},
		onSuccess: () => {
			toast.success("Assignment created successfully");
			queryClient.invalidateQueries({ queryKey: ["assignments"] });
			onOpenChange(false);
			setTitle("");
			setFile(null);
			setTotalQuestions(5);
		},
		onError: (error) => toast.error(error.message)
	});
	return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Dialog, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(DialogContent, {
			className: "sm:max-w-md rounded-3xl border border-white/60 bg-white/95 p-7 shadow-2xl backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900/95",
			children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(DialogHeader, {
				className: "pb-1",
				children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(DialogTitle, {
					className: "font-display text-xl font-bold tracking-tight text-center text-foreground",
					children: "Create New Assignment"
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 322,
					columnNumber: 11
				}, this)
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 321,
				columnNumber: 9
			}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("form", {
				className: "space-y-4 pt-2",
				onSubmit: (e) => {
					e.preventDefault();
					create.mutate();
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
						className: "space-y-1.5",
						children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("input", {
							id: "title",
							type: "text",
							required: true,
							value: title,
							onChange: (e) => setTitle(e.target.value),
							placeholder: "Title",
							className: "h-11 w-full rounded-xl border border-border/80 bg-neutral-50/70 px-4 text-sm text-foreground shadow-xs transition placeholder:text-muted-foreground/60 focus:border-[#0d5c52] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0d5c52]/20 dark:bg-neutral-800/80"
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 333,
							columnNumber: 13
						}, this)
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 332,
						columnNumber: 11
					}, this),
					/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
						className: "space-y-1.5",
						children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("input", {
							id: "assignmentNo",
							type: "text",
							required: true,
							value: assignmentNo,
							onChange: (e) => setAssignmentNo(e.target.value),
							placeholder: "Assignment No.",
							className: "h-11 w-full rounded-xl border border-border/80 bg-neutral-50/70 px-4 text-sm text-foreground shadow-xs transition placeholder:text-muted-foreground/60 focus:border-[#0d5c52] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0d5c52]/20 dark:bg-neutral-800/80"
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 338,
							columnNumber: 13
						}, this)
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 337,
						columnNumber: 11
					}, this),
					/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
						className: "flex h-11 items-center justify-between rounded-xl border border-border/80 bg-neutral-50/70 px-4 shadow-xs dark:bg-neutral-800/80",
						children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
							className: "text-sm text-muted-foreground",
							children: "Number of Questions"
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 343,
							columnNumber: 13
						}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
							className: "flex items-center gap-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", {
									type: "button",
									onClick: () => setTotalQuestions((prev) => Math.max(1, prev - 1)),
									className: "flex size-7 items-center justify-center rounded-lg border border-border/80 bg-white text-foreground hover:bg-neutral-100 dark:bg-neutral-700",
									children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Minus, { className: "size-3.5" }, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 346,
										columnNumber: 17
									}, this)
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 345,
									columnNumber: 15
								}, this),
								/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
									className: "w-5 text-center font-bold text-sm text-foreground",
									children: totalQuestions
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 348,
									columnNumber: 15
								}, this),
								/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", {
									type: "button",
									onClick: () => setTotalQuestions((prev) => prev + 1),
									className: "flex size-7 items-center justify-center rounded-lg border border-border/80 bg-white text-foreground hover:bg-neutral-100 dark:bg-neutral-700",
									children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Plus, { className: "size-3.5" }, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 352,
										columnNumber: 17
									}, this)
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 351,
									columnNumber: 15
								}, this)
							]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 344,
							columnNumber: 13
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 342,
						columnNumber: 11
					}, this),
					/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("label", {
							className: "text-xs font-semibold text-muted-foreground",
							children: "Question paper filename"
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 359,
							columnNumber: 13
						}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("label", {
							htmlFor: "paper",
							className: "flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/80 bg-neutral-50/50 p-5 text-center transition hover:bg-neutral-100/50 dark:bg-neutral-800/40",
							children: [
								/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
									className: "mb-2 flex size-12 items-center justify-center rounded-xl bg-neutral-200/80 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300",
									children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(FileText, { className: "size-6" }, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 364,
										columnNumber: 17
									}, this)
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 363,
									columnNumber: 15
								}, this),
								/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
									className: "text-xs font-semibold text-foreground",
									children: file ? file.name : "question_paper_math_101.pdf"
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 366,
									columnNumber: 15
								}, this),
								/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
									className: "mt-1 text-[11px] text-muted-foreground",
									children: file ? "Click to change PDF" : "Click to select assignment PDF (Optional)"
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 369,
									columnNumber: 15
								}, this),
								/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("input", {
									id: "paper",
									type: "file",
									accept: "application/pdf,image/*",
									onChange: (e) => setFile(e.target.files?.[0] ?? null),
									className: "hidden"
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 372,
									columnNumber: 15
								}, this)
							]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 362,
							columnNumber: 13
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 358,
						columnNumber: 11
					}, this),
					/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(DialogFooter, {
						className: "mt-6 flex flex-row items-center justify-between gap-3 sm:justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", {
							type: "button",
							onClick: () => onOpenChange(false),
							className: "flex-1 rounded-xl border border-border/80 bg-neutral-100/80 py-2.5 text-sm font-semibold text-foreground hover:bg-neutral-200/70 dark:bg-neutral-800",
							children: "Cancel"
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 378,
							columnNumber: 13
						}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", {
							type: "submit",
							disabled: create.isPending,
							className: "flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#0d5c52] py-2.5 text-sm font-semibold text-white shadow-md hover:bg-[#0a4840] disabled:opacity-50",
							children: [create.isPending && /* @__PURE__ */ (void 0)(LoaderCircle, { className: "size-4 animate-spin text-white" }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 382,
								columnNumber: 36
							}, this), "Create Assignment"]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 381,
							columnNumber: 13
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 377,
						columnNumber: 11
					}, this)
				]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 327,
				columnNumber: 9
			}, this)]
		}, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 320,
			columnNumber: 7
		}, this)
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 319,
		columnNumber: 10
	}, this);
}
//#endregion
export { TeacherDashboard as component };
