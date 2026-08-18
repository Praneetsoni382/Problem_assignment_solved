import { o as __toESM } from "../_runtime.mjs";
import { t as __exportAll } from "./rolldown-runtime-D7D4PA-g.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { _ as useNavigate, c as HeadContent, d as createRouter, f as Outlet, g as Link, h as createRootRouteWithContext, j as redirect, l as useRouterState, m as createFileRoute, p as lazyRouteComponent, s as Scripts, v as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as Overlay2, c as Title2, d as DialogContent$1, f as DialogDescription$1, h as DialogTitle$1, i as Description2, k as Slot, l as Dialog$1, m as DialogPortal$1, n as Cancel, o as Portal2, p as DialogOverlay$1, r as Content2, s as Root2, t as Action, u as DialogClose } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as supabase } from "./client-BZqcN8FK.mjs";
import { t as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { i as useQueryClient, n as useQuery, r as QueryClientProvider, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast, t as Toaster } from "../_libs/sonner.mjs";
import { t as require_jsx_dev_runtime } from "../_libs/react.mjs";
import { A as Eye, C as Layers, E as FolderLock, F as CircleCheck, G as ArrowRight, I as ChevronRight, K as ArrowLeft, M as Download, S as LoaderCircle, T as GraduationCap, U as Bell, V as Calendar, W as Award, _ as MessageSquare, a as UserRoundPen, i as Users, k as FileText, l as Search, r as X, x as LogOut, y as Mail } from "../_libs/lucide-react.mjs";
import { n as objectType, r as stringType, t as enumType } from "../_libs/zod.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { t as Root } from "../_libs/radix-ui__react-label.mjs";
import { i as Trigger, n as Portal, r as Root2$1, t as Content2$1 } from "../_libs/@radix-ui/react-popover+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/db-B79knL7Y.js
async function getCurrentProfile() {
	const { data: userData } = await supabase.auth.getUser();
	const user = userData.user;
	if (!user) return null;
	const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
	if (error) throw error;
	return data;
}
/**
* After email verification the user has a session but no profile row yet.
* Create it from the metadata captured at registration. If that metadata is
* missing (account created outside the registration form), return
* "needs-details" so the app can ask instead of inventing a name from the email.
*/
async function ensureProfile() {
	const existing = await getCurrentProfile();
	if (existing) return existing;
	const { data: userData } = await supabase.auth.getUser();
	const user = userData.user;
	if (!user) return null;
	const meta = user.user_metadata ?? {};
	const metaRole = meta["role"];
	const metaName = meta["full_name"];
	const metaEnrollment = meta["enrollment_no"];
	const role = metaRole === "teacher" ? "teacher" : metaRole === "student" ? "student" : null;
	const fullName = typeof metaName === "string" ? metaName.trim() : "";
	if (!role || fullName.length < 2) return "needs-details";
	if (role === "student" && !(typeof metaEnrollment === "string" && metaEnrollment.trim())) return "needs-details";
	return createMyProfile({
		role,
		fullName,
		enrollmentNo: role === "student" && typeof metaEnrollment === "string" ? metaEnrollment.trim() : null
	});
}
async function createMyProfile(input) {
	const { data: userData } = await supabase.auth.getUser();
	const user = userData.user;
	if (!user) throw new Error("You are not signed in.");
	const { data, error } = await supabase.from("profiles").insert({
		id: user.id,
		role: input.role,
		full_name: input.fullName.trim(),
		email: user.email ?? "",
		enrollment_no: input.role === "student" ? input.enrollmentNo?.trim() ?? null : null
	}).select("*").single();
	if (error) throw error;
	return data;
}
async function updateMyProfile(input) {
	const { data: userData } = await supabase.auth.getUser();
	const user = userData.user;
	if (!user) throw new Error("You are not signed in.");
	const patch = { full_name: input.fullName.trim() };
	if (input.enrollmentNo !== void 0) patch.enrollment_no = input.enrollmentNo?.trim() || null;
	const { data, error } = await supabase.from("profiles").update(patch).eq("id", user.id).select("*").single();
	if (error) throw error;
	return data;
}
async function listAssignments() {
	const { data, error } = await supabase.from("assignments").select("*").order("assignment_no", { ascending: true });
	if (error) throw error;
	return data ?? [];
}
async function getAssignment(id) {
	const { data, error } = await supabase.from("assignments").select("*").eq("id", id).maybeSingle();
	if (error) throw error;
	return data;
}
async function listStudents() {
	const { data, error } = await supabase.from("profiles").select("*").eq("role", "student").order("enrollment_no", { ascending: true });
	if (error) throw error;
	return data ?? [];
}
async function listSubmissions(assignmentId) {
	let query = supabase.from("submissions").select("*");
	if (assignmentId) query = query.eq("assignment_id", assignmentId);
	const { data, error } = await query;
	if (error) throw error;
	return data ?? [];
}
async function getOrCreateSubmission(assignmentId, studentId) {
	const { data: existing, error: readError } = await supabase.from("submissions").select("*").eq("assignment_id", assignmentId).eq("student_id", studentId).maybeSingle();
	if (readError) console.warn("Read submission error, trying server action:", readError);
	if (existing) return existing;
	const { data, error } = await supabase.from("submissions").insert({
		assignment_id: assignmentId,
		student_id: studentId
	}).select("*").single();
	if (error) {
		console.warn("Client insert submission failed (RLS), delegating to server action:", error);
		const { getOrCreateSubmissionServerAction } = await import("./submission-action-CYc4kF4v.mjs");
		return await getOrCreateSubmissionServerAction({ data: {
			assignmentId,
			studentId
		} });
	}
	return data;
}
async function listPages(submissionId) {
	const { data, error } = await supabase.from("submission_pages").select("*").eq("submission_id", submissionId).order("question_no", { ascending: true }).order("uploaded_at", { ascending: true });
	if (error) throw error;
	return data ?? [];
}
async function deletePage(pageId) {
	const { error } = await supabase.from("submission_pages").delete().eq("id", pageId);
	if (error) throw error;
}
async function signedUrl(bucket, path, expiresIn = 3600) {
	const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
	if (error) return null;
	return data?.signedUrl ?? null;
}
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/router-DbtMI3nh.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_dev_runtime = require_jsx_dev_runtime();
var styles_default = "/assets/styles-LaGfQIVV.css";
function reportLovableError(error, context = {}) {
	if (typeof window === "undefined") return;
	window.__lovableEvents?.captureException?.(error, {
		source: "react_error_boundary",
		route: window.location.pathname,
		...context
	}, {
		mechanism: "react_error_boundary",
		handled: false,
		severity: "error"
	});
	const message = error instanceof Response ? `Response ${error.status}${error.url ? ` at ${error.url}` : ""}` : error instanceof Error ? error.message : String(error);
	const stack = error instanceof Error ? error.stack : void 0;
	window.__lovableReportRuntimeError?.({
		message,
		...stack !== void 0 && { stack },
		filename: window.location.pathname
	});
}
var _jsxFileName$19 = "/app/applet/src/components/ui/sonner.tsx";
var Toaster$1 = ({ ...props }) => {
	return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Toaster, {
		className: "toaster group",
		toastOptions: { classNames: {
			toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
			description: "group-[.toast]:text-muted-foreground",
			actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
			cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground"
		} },
		...props
	}, void 0, false, {
		fileName: _jsxFileName$19,
		lineNumber: 7,
		columnNumber: 5
	}, void 0);
};
function useProfile() {
	return useQuery({
		queryKey: ["profile"],
		queryFn: getCurrentProfile,
		staleTime: 6e4
	});
}
function useSignedUrl(bucket, path) {
	const [url, setUrl] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		let active = true;
		if (!path) {
			setUrl(null);
			return;
		}
		signedUrl(bucket, path).then((value) => {
			if (active) setUrl(value);
		});
		return () => {
			active = false;
		};
	}, [bucket, path]);
	return url;
}
var _jsxFileName$18 = "/app/applet/src/components/student-grade-notification-listener.tsx";
function StudentGradeNotificationListener() {
	const { data: profile } = useProfile();
	const queryClient = useQueryClient();
	(0, import_react.useEffect)(() => {
		if (!profile?.id || profile.role !== "student") return;
		const notificationChannel = supabase.channel(`student-grading-toasts-${profile.id}`).on("postgres_changes", {
			event: "INSERT",
			schema: "public",
			table: "notifications",
			filter: `user_id=eq.${profile.id}`
		}, (payload) => {
			const newNotif = payload.new;
			const title = newNotif.assignment_title ? newNotif.assignment_title : newNotif.assignment_no ? `Assignment #${newNotif.assignment_no}` : "Assignment";
			const target = newNotif.question_no && newNotif.question_no > 0 ? `Question ${newNotif.question_no}` : "Overall Assignment";
			toast.custom(() => /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
				className: "flex w-full max-w-md items-start gap-3 rounded-2xl border border-[#b8ded4] bg-white p-4 shadow-xl ring-1 ring-black/5 dark:border-teal-900/60 dark:bg-slate-900",
				children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
					className: "flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#e6f2ee] text-[#0d5c52] dark:bg-teal-950 dark:text-teal-300",
					children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(MessageSquare, { className: "size-5" }, void 0, false, {
						fileName: _jsxFileName$18,
						lineNumber: 49,
						columnNumber: 19
					}, this)
				}, void 0, false, {
					fileName: _jsxFileName$18,
					lineNumber: 48,
					columnNumber: 17
				}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
					className: "flex-1 space-y-1",
					children: [
						/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
							className: "flex items-center justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", {
								className: "text-xs font-bold uppercase tracking-wider text-[#0d5c52] dark:text-teal-400",
								children: "New Teacher Feedback"
							}, void 0, false, {
								fileName: _jsxFileName$18,
								lineNumber: 53,
								columnNumber: 21
							}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
								className: "text-[10px] font-medium text-muted-foreground",
								children: target
							}, void 0, false, {
								fileName: _jsxFileName$18,
								lineNumber: 56,
								columnNumber: 21
							}, this)]
						}, void 0, true, {
							fileName: _jsxFileName$18,
							lineNumber: 52,
							columnNumber: 19
						}, this),
						/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", {
							className: "text-sm font-semibold text-foreground",
							children: title
						}, void 0, false, {
							fileName: _jsxFileName$18,
							lineNumber: 58,
							columnNumber: 19
						}, this),
						newNotif.message && /* @__PURE__ */ (void 0)("p", {
							className: "text-xs text-muted-foreground line-clamp-2",
							children: [
								"\"",
								newNotif.message,
								"\""
							]
						}, void 0, true, {
							fileName: _jsxFileName$18,
							lineNumber: 60,
							columnNumber: 21
						}, this)
					]
				}, void 0, true, {
					fileName: _jsxFileName$18,
					lineNumber: 51,
					columnNumber: 17
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName$18,
				lineNumber: 47,
				columnNumber: 15
			}, this), { duration: 6e3 });
			queryClient.invalidateQueries({ queryKey: ["notifications", profile.id] });
			queryClient.invalidateQueries({ queryKey: ["my-submissions"] });
			queryClient.invalidateQueries({ queryKey: ["question-marks"] });
		}).on("postgres_changes", {
			event: "UPDATE",
			schema: "public",
			table: "submissions",
			filter: `student_id=eq.${profile.id}`
		}, (payload) => {
			const oldRecord = payload.old;
			const newRecord = payload.new;
			if (newRecord.checked_status === "checked" && oldRecord.checked_status !== "checked") {
				toast.custom(() => /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
					className: "flex w-full max-w-md items-start gap-3 rounded-2xl border border-amber-200 bg-white p-4 shadow-xl ring-1 ring-black/5 dark:border-amber-900/60 dark:bg-slate-900",
					children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
						className: "flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300",
						children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Award, { className: "size-5" }, void 0, false, {
							fileName: _jsxFileName$18,
							lineNumber: 97,
							columnNumber: 21
						}, this)
					}, void 0, false, {
						fileName: _jsxFileName$18,
						lineNumber: 96,
						columnNumber: 19
					}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
						className: "flex-1 space-y-1",
						children: [
							/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
								className: "flex items-center justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", {
									className: "text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400",
									children: "Grading Complete"
								}, void 0, false, {
									fileName: _jsxFileName$18,
									lineNumber: 101,
									columnNumber: 23
								}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
									className: "flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400",
									children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(CircleCheck, { className: "size-3" }, void 0, false, {
										fileName: _jsxFileName$18,
										lineNumber: 105,
										columnNumber: 25
									}, this), " Checked"]
								}, void 0, true, {
									fileName: _jsxFileName$18,
									lineNumber: 104,
									columnNumber: 23
								}, this)]
							}, void 0, true, {
								fileName: _jsxFileName$18,
								lineNumber: 100,
								columnNumber: 21
							}, this),
							/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", {
								className: "text-sm font-semibold text-foreground",
								children: "Your assignment has been checked and graded!"
							}, void 0, false, {
								fileName: _jsxFileName$18,
								lineNumber: 108,
								columnNumber: 21
							}, this),
							newRecord.total_marks !== null && newRecord.total_marks !== void 0 && /* @__PURE__ */ (void 0)("p", {
								className: "text-xs font-medium text-muted-foreground",
								children: [
									"Total Marks Awarded:",
									" ",
									/* @__PURE__ */ (void 0)("strong", {
										className: "text-foreground",
										children: [newRecord.total_marks, " Marks"]
									}, void 0, true, {
										fileName: _jsxFileName$18,
										lineNumber: 114,
										columnNumber: 25
									}, this)
								]
							}, void 0, true, {
								fileName: _jsxFileName$18,
								lineNumber: 112,
								columnNumber: 23
							}, this)
						]
					}, void 0, true, {
						fileName: _jsxFileName$18,
						lineNumber: 99,
						columnNumber: 19
					}, this)]
				}, void 0, true, {
					fileName: _jsxFileName$18,
					lineNumber: 95,
					columnNumber: 17
				}, this), { duration: 7e3 });
				queryClient.invalidateQueries({ queryKey: ["my-submissions"] });
				queryClient.invalidateQueries({ queryKey: ["submissions"] });
				queryClient.invalidateQueries({ queryKey: ["student-submissions-list"] });
			}
		}).subscribe();
		return () => {
			supabase.removeChannel(notificationChannel);
		};
	}, [
		profile?.id,
		profile?.role,
		queryClient
	]);
	return null;
}
var _jsxFileName$17 = "/app/applet/src/routes/__root.tsx";
function NotFoundComponent() {
	return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("h1", {
					className: "text-7xl font-bold text-foreground",
					children: "404"
				}, void 0, false, {
					fileName: _jsxFileName$17,
					lineNumber: 22,
					columnNumber: 9
				}, this),
				/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("h2", {
					className: "mt-4 text-xl font-semibold text-foreground",
					children: "Page not found"
				}, void 0, false, {
					fileName: _jsxFileName$17,
					lineNumber: 23,
					columnNumber: 9
				}, this),
				/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "The page you're looking for doesn't exist or has been moved."
				}, void 0, false, {
					fileName: _jsxFileName$17,
					lineNumber: 24,
					columnNumber: 9
				}, this),
				/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
					className: "mt-6",
					children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Link, {
						to: "/",
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "Go home"
					}, void 0, false, {
						fileName: _jsxFileName$17,
						lineNumber: 28,
						columnNumber: 11
					}, this)
				}, void 0, false, {
					fileName: _jsxFileName$17,
					lineNumber: 27,
					columnNumber: 9
				}, this)
			]
		}, void 0, true, {
			fileName: _jsxFileName$17,
			lineNumber: 21,
			columnNumber: 7
		}, this)
	}, void 0, false, {
		fileName: _jsxFileName$17,
		lineNumber: 20,
		columnNumber: 5
	}, this);
}
function ErrorComponent({ error, reset }) {
	console.error(error);
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		reportLovableError(error, { boundary: "tanstack_root_error_component" });
	}, [error]);
	return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("h1", {
					className: "text-xl font-semibold tracking-tight text-foreground",
					children: "This page didn't load"
				}, void 0, false, {
					fileName: _jsxFileName$17,
					lineNumber: 50,
					columnNumber: 9
				}, this),
				/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "Something went wrong on our end. You can try refreshing or head back home."
				}, void 0, false, {
					fileName: _jsxFileName$17,
					lineNumber: 53,
					columnNumber: 9
				}, this),
				/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
					className: "mt-6 flex flex-wrap justify-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", {
						onClick: () => {
							router.invalidate();
							reset();
						},
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "Try again"
					}, void 0, false, {
						fileName: _jsxFileName$17,
						lineNumber: 57,
						columnNumber: 11
					}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("a", {
						href: "/",
						className: "inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent",
						children: "Go home"
					}, void 0, false, {
						fileName: _jsxFileName$17,
						lineNumber: 66,
						columnNumber: 11
					}, this)]
				}, void 0, true, {
					fileName: _jsxFileName$17,
					lineNumber: 56,
					columnNumber: 9
				}, this)
			]
		}, void 0, true, {
			fileName: _jsxFileName$17,
			lineNumber: 49,
			columnNumber: 7
		}, this)
	}, void 0, false, {
		fileName: _jsxFileName$17,
		lineNumber: 48,
		columnNumber: 5
	}, this);
}
var Route$12 = createRootRouteWithContext()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: "AssignEase — Assignment Submission & Grading" },
			{
				name: "description",
				content: "AssignEase lets students scan handwritten assignments with their camera and teachers grade them with live status updates."
			},
			{
				property: "og:title",
				content: "AssignEase — Assignment Submission & Grading"
			},
			{
				property: "og:description",
				content: "Scan handwritten assignments, submit them, and get marks the moment grading is done."
			},
			{
				property: "og:type",
				content: "website"
			},
			{
				name: "twitter:card",
				content: "summary_large_image"
			}
		],
		links: [
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com"
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous"
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=DM+Sans:wght@400;500;600&display=swap"
			},
			{
				rel: "icon",
				href: "/favicon.ico",
				type: "image/x-icon"
			}
		]
	}),
	shellComponent: RootShell,
	component: RootComponent,
	notFoundComponent: NotFoundComponent,
	errorComponent: ErrorComponent
});
function RootShell({ children }) {
	return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("html", {
		lang: "en",
		children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("head", { children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(HeadContent, {}, void 0, false, {
			fileName: _jsxFileName$17,
			lineNumber: 119,
			columnNumber: 9
		}, this) }, void 0, false, {
			fileName: _jsxFileName$17,
			lineNumber: 118,
			columnNumber: 7
		}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("body", { children: [children, /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Scripts, {}, void 0, false, {
			fileName: _jsxFileName$17,
			lineNumber: 123,
			columnNumber: 9
		}, this)] }, void 0, true, {
			fileName: _jsxFileName$17,
			lineNumber: 121,
			columnNumber: 7
		}, this)]
	}, void 0, true, {
		fileName: _jsxFileName$17,
		lineNumber: 117,
		columnNumber: 5
	}, this);
}
function RootComponent() {
	const { queryClient } = Route$12.useRouteContext();
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		const { data } = supabase.auth.onAuthStateChange((event) => {
			if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
			router.invalidate();
			if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
		});
		return () => data.subscription.unsubscribe();
	}, [router, queryClient]);
	return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(QueryClientProvider, {
		client: queryClient,
		children: [
			/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(StudentGradeNotificationListener, {}, void 0, false, {
				fileName: _jsxFileName$17,
				lineNumber: 144,
				columnNumber: 7
			}, this),
			/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Outlet, {}, void 0, false, {
				fileName: _jsxFileName$17,
				lineNumber: 146,
				columnNumber: 7
			}, this),
			/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Toaster$1, {
				richColors: true,
				position: "top-center"
			}, void 0, false, {
				fileName: _jsxFileName$17,
				lineNumber: 147,
				columnNumber: 7
			}, this)
		]
	}, void 0, true, {
		fileName: _jsxFileName$17,
		lineNumber: 143,
		columnNumber: 5
	}, this);
}
var $$splitComponentImporter$7 = () => import("./routes-fl2OVeTI.mjs");
var Route$11 = createFileRoute("/")({
	head: () => ({ meta: [
		{ title: "Sign In — AssignEase" },
		{
			name: "description",
			content: "Sign in to AssignEase with your email and password. Students submit assignments; teachers grade them in real time."
		},
		{
			property: "og:title",
			content: "Sign In — AssignEase"
		},
		{
			property: "og:description",
			content: "Email and password sign in for students and teachers on AssignEase."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
var $$splitComponentImporter$6 = () => import("./route-CRRSyPUS.mjs");
var Route$10 = createFileRoute("/_authenticated")({
	ssr: false,
	beforeLoad: async () => {
		const { data, error } = await supabase.auth.getUser();
		if (error || !data.user) throw redirect({ to: "/" });
		return { user: data.user };
	},
	component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
var $$splitComponentImporter$5 = () => import("./complete-profile-BdfzNIzM.mjs");
var Route$9 = createFileRoute("/complete-profile")({
	head: () => ({ meta: [{ title: "Complete Profile — AssignEase" }, {
		name: "description",
		content: "Finish setting up your AssignEase profile details."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
var $$splitComponentImporter$4 = () => import("./register-BULzZvJ0.mjs");
var searchSchema = objectType({
	role: enumType(["student", "teacher"]).catch("student"),
	email: stringType().catch("")
});
var Route$8 = createFileRoute("/register")({
	validateSearch: searchSchema,
	head: () => ({ meta: [
		{ title: "Create Account — AssignEase" },
		{
			name: "description",
			content: "Register on AssignEase as a student with your enrollment number, or as a teacher to manage assignments."
		},
		{
			property: "og:title",
			content: "Create Account — AssignEase"
		},
		{
			property: "og:description",
			content: "Register for AssignEase with email and password, then verify via the emailed link."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
var $$splitComponentImporter$3 = () => import("./reset-password-BAFq2FJe.mjs");
var Route$7 = createFileRoute("/reset-password")({
	head: () => ({ meta: [
		{ title: "Set New Password — AssignEase" },
		{
			name: "description",
			content: "Choose a new AssignEase password after following the reset link sent to your email."
		},
		{
			property: "og:title",
			content: "Set New Password — AssignEase"
		},
		{
			property: "og:description",
			content: "Securely set a new password for your AssignEase account."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var _jsxFileName$16 = "/app/applet/src/components/ui/button.tsx";
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0", {
	variants: {
		variant: {
			default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
			destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
			outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
			secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
			ghost: "hover:bg-accent hover:text-accent-foreground",
			link: "text-primary underline-offset-4 hover:underline",
			gold: "bg-auth-gold text-auth-gold-foreground shadow hover:bg-auth-gold-hover focus-visible:ring-auth-gold/50"
		},
		size: {
			default: "h-9 px-4 py-2",
			sm: "h-8 rounded-md px-3 text-xs",
			lg: "h-10 rounded-md px-8",
			icon: "h-9 w-9"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
var Button = import_react.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(asChild ? Slot : "button", {
		className: cn(buttonVariants({
			variant,
			size,
			className
		})),
		ref,
		...props
	}, void 0, false, {
		fileName: _jsxFileName$16,
		lineNumber: 44,
		columnNumber: 7
	}, void 0);
});
Button.displayName = "Button";
var _jsxFileName$15 = "/app/applet/src/components/ui/input.tsx";
var Input = import_react.forwardRef(({ className, type, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("input", {
		type,
		className: cn("flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm", className),
		ref,
		...props
	}, void 0, false, {
		fileName: _jsxFileName$15,
		lineNumber: 8,
		columnNumber: 7
	}, void 0);
});
Input.displayName = "Input";
var _jsxFileName$14 = "/app/applet/src/components/ui/label.tsx";
var labelVariants = cva("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70");
var Label = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Root, {
	ref,
	className: cn(labelVariants(), className),
	...props
}, void 0, false, {
	fileName: _jsxFileName$14,
	lineNumber: 17,
	columnNumber: 3
}, void 0));
Label.displayName = Root.displayName;
var _jsxFileName$13 = "/app/applet/src/components/ui/dialog.tsx";
var Dialog = Dialog$1;
var DialogPortal = DialogPortal$1;
var DialogOverlay = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(DialogOverlay$1, {
	ref,
	className: cn("fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0", className),
	...props
}, void 0, false, {
	fileName: _jsxFileName$13,
	lineNumber: 21,
	columnNumber: 3
}, void 0));
DialogOverlay.displayName = DialogOverlay$1.displayName;
var DialogContent = import_react.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(DialogPortal, { children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(DialogOverlay, {}, void 0, false, {
	fileName: _jsxFileName$13,
	lineNumber: 37,
	columnNumber: 5
}, void 0), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(DialogContent$1, {
	ref,
	className: cn("fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg", className),
	...props,
	children: [children, /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(DialogClose, {
		className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background cursor-pointer transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground",
		children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(X, { className: "h-4 w-4" }, void 0, false, {
			fileName: _jsxFileName$13,
			lineNumber: 48,
			columnNumber: 9
		}, void 0), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
			className: "sr-only",
			children: "Close"
		}, void 0, false, {
			fileName: _jsxFileName$13,
			lineNumber: 49,
			columnNumber: 9
		}, void 0)]
	}, void 0, true, {
		fileName: _jsxFileName$13,
		lineNumber: 47,
		columnNumber: 7
	}, void 0)]
}, void 0, true, {
	fileName: _jsxFileName$13,
	lineNumber: 38,
	columnNumber: 5
}, void 0)] }, void 0, true, {
	fileName: _jsxFileName$13,
	lineNumber: 36,
	columnNumber: 3
}, void 0));
DialogContent.displayName = DialogContent$1.displayName;
var DialogHeader = ({ className, ...props }) => /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
	className: cn("flex flex-col space-y-1.5 text-center sm:text-left", className),
	...props
}, void 0, false, {
	fileName: _jsxFileName$13,
	lineNumber: 57,
	columnNumber: 3
}, void 0);
DialogHeader.displayName = "DialogHeader";
var DialogFooter = ({ className, ...props }) => /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
	className: cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className),
	...props
}, void 0, false, {
	fileName: _jsxFileName$13,
	lineNumber: 62,
	columnNumber: 3
}, void 0);
DialogFooter.displayName = "DialogFooter";
var DialogTitle = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(DialogTitle$1, {
	ref,
	className: cn("text-lg font-semibold leading-none tracking-tight", className),
	...props
}, void 0, false, {
	fileName: _jsxFileName$13,
	lineNumber: 73,
	columnNumber: 3
}, void 0));
DialogTitle.displayName = DialogTitle$1.displayName;
var DialogDescription = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(DialogDescription$1, {
	ref,
	className: cn("text-sm text-muted-foreground", className),
	...props
}, void 0, false, {
	fileName: _jsxFileName$13,
	lineNumber: 85,
	columnNumber: 3
}, void 0));
DialogDescription.displayName = DialogDescription$1.displayName;
var _jsxFileName$12 = "/app/applet/src/components/edit-profile-dialog.tsx";
function EditProfileDialog({ profile, open, onOpenChange }) {
	const queryClient = useQueryClient();
	const [fullName, setFullName] = (0, import_react.useState)(profile.full_name);
	const [enrollmentNo, setEnrollmentNo] = (0, import_react.useState)(profile.enrollment_no ?? "");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	async function save(e) {
		e.preventDefault();
		setError(null);
		if (fullName.trim().length < 2) return setError("Please enter your full name.");
		if (profile.role === "student" && !enrollmentNo.trim()) return setError("Please enter your enrollment number.");
		setBusy(true);
		try {
			await updateMyProfile({
				fullName,
				...profile.role === "student" ? { enrollmentNo } : {}
			});
			await queryClient.invalidateQueries();
			toast.success("Profile updated");
			onOpenChange(false);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not save your details.");
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Dialog, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(DialogContent, { children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(DialogTitle, { children: "Edit your profile" }, void 0, false, {
			fileName: _jsxFileName$12,
			lineNumber: 59,
			columnNumber: 11
		}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(DialogDescription, { children: "Your full name is what appears in the teacher's student list." }, void 0, false, {
			fileName: _jsxFileName$12,
			lineNumber: 60,
			columnNumber: 11
		}, this)] }, void 0, true, {
			fileName: _jsxFileName$12,
			lineNumber: 58,
			columnNumber: 9
		}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("form", {
			onSubmit: save,
			className: "space-y-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
					className: "space-y-2",
					children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Label, {
						htmlFor: "profileName",
						children: "Full name"
					}, void 0, false, {
						fileName: _jsxFileName$12,
						lineNumber: 66,
						columnNumber: 13
					}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Input, {
						id: "profileName",
						required: true,
						maxLength: 100,
						value: fullName,
						onChange: (e) => setFullName(e.target.value)
					}, void 0, false, {
						fileName: _jsxFileName$12,
						lineNumber: 67,
						columnNumber: 13
					}, this)]
				}, void 0, true, {
					fileName: _jsxFileName$12,
					lineNumber: 65,
					columnNumber: 11
				}, this),
				profile.role === "student" && /* @__PURE__ */ (void 0)("div", {
					className: "space-y-2",
					children: [/* @__PURE__ */ (void 0)(Label, {
						htmlFor: "profileEnrollment",
						children: "Enrollment number"
					}, void 0, false, {
						fileName: _jsxFileName$12,
						lineNumber: 77,
						columnNumber: 15
					}, this), /* @__PURE__ */ (void 0)(Input, {
						id: "profileEnrollment",
						required: true,
						maxLength: 40,
						value: enrollmentNo,
						onChange: (e) => setEnrollmentNo(e.target.value)
					}, void 0, false, {
						fileName: _jsxFileName$12,
						lineNumber: 78,
						columnNumber: 15
					}, this)]
				}, void 0, true, {
					fileName: _jsxFileName$12,
					lineNumber: 76,
					columnNumber: 13
				}, this),
				error && /* @__PURE__ */ (void 0)("p", {
					className: "text-sm text-destructive",
					children: error
				}, void 0, false, {
					fileName: _jsxFileName$12,
					lineNumber: 87,
					columnNumber: 21
				}, this),
				/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(DialogFooter, { children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Button, {
					type: "submit",
					disabled: busy,
					children: busy ? "Saving…" : "Save changes"
				}, void 0, false, {
					fileName: _jsxFileName$12,
					lineNumber: 89,
					columnNumber: 13
				}, this) }, void 0, false, {
					fileName: _jsxFileName$12,
					lineNumber: 88,
					columnNumber: 11
				}, this)
			]
		}, void 0, true, {
			fileName: _jsxFileName$12,
			lineNumber: 64,
			columnNumber: 9
		}, this)] }, void 0, true, {
			fileName: _jsxFileName$12,
			lineNumber: 57,
			columnNumber: 7
		}, this)
	}, void 0, false, {
		fileName: _jsxFileName$12,
		lineNumber: 56,
		columnNumber: 5
	}, this);
}
var _jsxFileName$11 = "/app/applet/src/components/particle-field.tsx";
var PARTICLES = [
	{
		left: "6%",
		top: "12%",
		size: 90,
		delay: "0s",
		color: "oklch(0.55 0.09 258 / 0.16)"
	},
	{
		left: "22%",
		top: "68%",
		size: 54,
		delay: "-3s",
		color: "oklch(0.75 0.13 75 / 0.18)"
	},
	{
		left: "44%",
		top: "24%",
		size: 34,
		delay: "-6s",
		color: "oklch(0.55 0.09 258 / 0.14)"
	},
	{
		left: "63%",
		top: "78%",
		size: 120,
		delay: "-9s",
		color: "oklch(0.75 0.13 75 / 0.12)"
	},
	{
		left: "82%",
		top: "18%",
		size: 68,
		delay: "-4.5s",
		color: "oklch(0.55 0.09 258 / 0.18)"
	},
	{
		left: "92%",
		top: "62%",
		size: 40,
		delay: "-7.5s",
		color: "oklch(0.75 0.13 75 / 0.2)"
	},
	{
		left: "34%",
		top: "92%",
		size: 26,
		delay: "-12s",
		color: "oklch(0.55 0.09 258 / 0.2)"
	},
	{
		left: "72%",
		top: "42%",
		size: 22,
		delay: "-15s",
		color: "oklch(0.75 0.13 75 / 0.22)"
	}
];
/** Decorative animated 3D-ish particle layer behind app content. */
function ParticleField() {
	return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
		"aria-hidden": true,
		className: "pointer-events-none fixed inset-0 -z-10 overflow-hidden",
		children: PARTICLES.map((p, i) => /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
			className: "particle",
			style: {
				left: p.left,
				top: p.top,
				width: p.size,
				height: p.size,
				animationDelay: p.delay,
				animationDuration: `${14 + i % 5 * 3}s`,
				background: `radial-gradient(circle at 32% 28%, ${p.color}, transparent 70%)`,
				boxShadow: `inset 0 0 ${p.size / 2}px ${p.color}`
			}
		}, i, false, {
			fileName: _jsxFileName$11,
			lineNumber: 17,
			columnNumber: 9
		}, this))
	}, void 0, false, {
		fileName: _jsxFileName$11,
		lineNumber: 15,
		columnNumber: 5
	}, this);
}
var _jsxFileName$10 = "/app/applet/src/components/ui/popover.tsx";
var Popover = Root2$1;
var PopoverTrigger = Trigger;
var PopoverContent = import_react.forwardRef(({ className, align = "center", sideOffset = 4, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Portal, { children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Content2$1, {
	ref,
	align,
	sideOffset,
	className: cn("z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-popover-content-transform-origin)", className),
	...props
}, void 0, false, {
	fileName: _jsxFileName$10,
	lineNumber: 17,
	columnNumber: 5
}, void 0) }, void 0, false, {
	fileName: _jsxFileName$10,
	lineNumber: 16,
	columnNumber: 3
}, void 0));
PopoverContent.displayName = Content2$1.displayName;
var _jsxFileName$9 = "/app/applet/src/components/notification-bell.tsx";
async function listMyNotifications(userId) {
	const { data, error } = await supabase.from("notifications").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(50);
	if (error) throw error;
	return data ?? [];
}
function NotificationBell({ userId }) {
	const queryClient = useQueryClient();
	const [open, setOpen] = (0, import_react.useState)(false);
	const notifications = useQuery({
		queryKey: ["notifications", userId],
		queryFn: () => listMyNotifications(userId)
	});
	(0, import_react.useEffect)(() => {
		const channel = supabase.channel(`notifications-${userId}`).on("postgres_changes", {
			event: "*",
			schema: "public",
			table: "notifications",
			filter: `user_id=eq.${userId}`
		}, () => queryClient.invalidateQueries({ queryKey: ["notifications", userId] })).subscribe();
		return () => {
			supabase.removeChannel(channel);
		};
	}, [queryClient, userId]);
	const items = notifications.data ?? [];
	const unread = items.filter((n) => !n.is_read).length;
	async function markAllRead() {
		const ids = items.filter((n) => !n.is_read).map((n) => n.id);
		if (!ids.length) return;
		await supabase.from("notifications").update({ is_read: true }).in("id", ids);
		queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
	}
	return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Popover, {
		open,
		onOpenChange: (next) => {
			setOpen(next);
			if (next) markAllRead();
		},
		children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(PopoverTrigger, {
			asChild: true,
			children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", {
				type: "button",
				"aria-label": `Notifications${unread ? ` (${unread} unread)` : ""}`,
				className: "relative flex size-9 items-center justify-center rounded-full border border-border bg-card transition hover:bg-accent/60",
				children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Bell, { className: "size-4 text-muted-foreground" }, void 0, false, {
					fileName: _jsxFileName$9,
					lineNumber: 69,
					columnNumber: 11
				}, this), unread > 0 && /* @__PURE__ */ (void 0)("span", {
					className: "absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-4 text-destructive-foreground",
					children: unread > 9 ? "9+" : unread
				}, void 0, false, {
					fileName: _jsxFileName$9,
					lineNumber: 71,
					columnNumber: 13
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName$9,
				lineNumber: 64,
				columnNumber: 9
			}, this)
		}, void 0, false, {
			fileName: _jsxFileName$9,
			lineNumber: 63,
			columnNumber: 7
		}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(PopoverContent, {
			align: "end",
			className: "w-80 p-0",
			children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
				className: "flex items-center justify-between border-b px-4 py-3",
				children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", {
					className: "text-sm font-semibold",
					children: "Notifications"
				}, void 0, false, {
					fileName: _jsxFileName$9,
					lineNumber: 79,
					columnNumber: 11
				}, this), items.length > 0 && /* @__PURE__ */ (void 0)(Button, {
					variant: "ghost",
					size: "sm",
					onClick: markAllRead,
					children: "Mark all read"
				}, void 0, false, {
					fileName: _jsxFileName$9,
					lineNumber: 81,
					columnNumber: 13
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName$9,
				lineNumber: 78,
				columnNumber: 9
			}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
				className: "max-h-80 overflow-y-auto",
				children: [items.length === 0 && /* @__PURE__ */ (void 0)("p", {
					className: "px-4 py-8 text-center text-sm text-muted-foreground",
					children: "No notifications yet."
				}, void 0, false, {
					fileName: _jsxFileName$9,
					lineNumber: 88,
					columnNumber: 13
				}, this), items.map((n) => /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
					className: `border-b px-4 py-3 last:border-b-0 ${n.is_read ? "" : "bg-accent/40"}`,
					children: [
						/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", {
							className: "text-xs font-semibold text-primary",
							children: [
								n.assignment_no !== null ? `Assignment ${n.assignment_no}` : "Assignment",
								n.assignment_title ? ` · ${n.assignment_title}` : "",
								n.question_no !== null ? ` · Question ${n.question_no}` : ""
							]
						}, void 0, true, {
							fileName: _jsxFileName$9,
							lineNumber: 97,
							columnNumber: 15
						}, this),
						/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", {
							className: "mt-1 text-sm text-foreground",
							children: n.message
						}, void 0, false, {
							fileName: _jsxFileName$9,
							lineNumber: 102,
							columnNumber: 15
						}, this),
						/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", {
							className: "mt-1 text-[11px] text-muted-foreground",
							children: new Date(n.created_at).toLocaleString()
						}, void 0, false, {
							fileName: _jsxFileName$9,
							lineNumber: 103,
							columnNumber: 15
						}, this)
					]
				}, n.id, true, {
					fileName: _jsxFileName$9,
					lineNumber: 93,
					columnNumber: 13
				}, this))]
			}, void 0, true, {
				fileName: _jsxFileName$9,
				lineNumber: 86,
				columnNumber: 9
			}, this)]
		}, void 0, true, {
			fileName: _jsxFileName$9,
			lineNumber: 77,
			columnNumber: 7
		}, this)]
	}, void 0, true, {
		fileName: _jsxFileName$9,
		lineNumber: 56,
		columnNumber: 5
	}, this);
}
var _jsxFileName$8 = "/app/applet/src/components/assignease-logo.tsx";
function AssignEaseLogo({ className = "", size = "md" }) {
	const iconSize = size === "sm" ? 28 : size === "lg" ? 44 : 36;
	const textSize = size === "sm" ? "text-xl" : size === "lg" ? "text-3xl" : "text-2xl";
	return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
		className: `inline-flex items-center gap-2.5 ${className}`,
		children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("svg", {
			width: iconSize,
			height: iconSize,
			viewBox: "0 0 48 48",
			fill: "none",
			xmlns: "http://www.w3.org/2000/svg",
			className: "shrink-0 drop-shadow-xs",
			"aria-hidden": "true",
			children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("path", {
				d: "M26 24C29.5 28.5 33.5 35 34 38.5C34.5 42 32 44 28.5 44C25.5 44 23 41.5 22 38",
				stroke: "#E6A694",
				strokeWidth: "5",
				strokeLinecap: "round",
				strokeLinejoin: "round"
			}, void 0, false, {
				fileName: _jsxFileName$8,
				lineNumber: 24,
				columnNumber: 9
			}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("path", {
				d: "M17 38C15 34 14 27 19 16C23 7 30 6 32 10C34 14 31 22 22 28C16 32 11 37 13 41C14.5 44 19 44 25 39",
				stroke: "#0D5C52",
				strokeWidth: "5",
				strokeLinecap: "round",
				strokeLinejoin: "round"
			}, void 0, false, {
				fileName: _jsxFileName$8,
				lineNumber: 32,
				columnNumber: 9
			}, this)]
		}, void 0, true, {
			fileName: _jsxFileName$8,
			lineNumber: 14,
			columnNumber: 7
		}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
			className: `font-display ${textSize} font-bold tracking-tight text-[#16332E] dark:text-emerald-100`,
			children: "AssignEase"
		}, void 0, false, {
			fileName: _jsxFileName$8,
			lineNumber: 40,
			columnNumber: 7
		}, this)]
	}, void 0, true, {
		fileName: _jsxFileName$8,
		lineNumber: 12,
		columnNumber: 5
	}, this);
}
var _jsxFileName$7 = "/app/applet/src/components/app-shell.tsx";
function AppShell({ profile, breadcrumbs, children }) {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [editing, setEditing] = (0, import_react.useState)(false);
	const currentPath = useRouterState().location.pathname;
	async function signOut() {
		await queryClient.cancelQueries();
		queryClient.clear();
		await supabase.auth.signOut();
		navigate({
			to: "/",
			replace: true
		});
	}
	return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
		className: "app-bg min-h-screen",
		children: [
			/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(ParticleField, {}, void 0, false, {
				fileName: _jsxFileName$7,
				lineNumber: 38,
				columnNumber: 7
			}, this),
			/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("header", {
				className: "sticky top-0 z-30 border-b border-border/60 bg-card/80 backdrop-blur-xl",
				children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
					className: "mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3",
					children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
						className: "flex items-center gap-6",
						children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Link, {
							to: profile?.role === "teacher" ? "/teacher" : "/student",
							className: "flex items-center",
							children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(AssignEaseLogo, { size: "sm" }, void 0, false, {
								fileName: _jsxFileName$7,
								lineNumber: 46,
								columnNumber: 15
							}, this)
						}, void 0, false, {
							fileName: _jsxFileName$7,
							lineNumber: 42,
							columnNumber: 13
						}, this), profile?.role === "teacher" && /* @__PURE__ */ (void 0)("nav", {
							className: "hidden md:flex items-center gap-1",
							children: [/* @__PURE__ */ (void 0)(Link, {
								to: "/teacher",
								className: `inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${currentPath === "/teacher" || currentPath.startsWith("/teacher/assignments") ? "bg-[#0d5c52]/10 text-[#0d5c52] dark:bg-emerald-950/60 dark:text-emerald-300" : "text-muted-foreground hover:bg-neutral-100 hover:text-foreground dark:hover:bg-neutral-800"}`,
								children: [/* @__PURE__ */ (void 0)(FileText, { className: "size-3.5" }, void 0, false, {
									fileName: _jsxFileName$7,
									lineNumber: 60,
									columnNumber: 19
								}, this), "Assignments"]
							}, void 0, true, {
								fileName: _jsxFileName$7,
								lineNumber: 52,
								columnNumber: 17
							}, this), /* @__PURE__ */ (void 0)(Link, {
								to: "/teacher/students",
								className: `inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${currentPath.startsWith("/teacher/students") ? "bg-[#0d5c52]/10 text-[#0d5c52] dark:bg-emerald-950/60 dark:text-emerald-300" : "text-muted-foreground hover:bg-neutral-100 hover:text-foreground dark:hover:bg-neutral-800"}`,
								children: [/* @__PURE__ */ (void 0)(Users, { className: "size-3.5" }, void 0, false, {
									fileName: _jsxFileName$7,
									lineNumber: 71,
									columnNumber: 19
								}, this), "Student List & Vault"]
							}, void 0, true, {
								fileName: _jsxFileName$7,
								lineNumber: 63,
								columnNumber: 17
							}, this)]
						}, void 0, true, {
							fileName: _jsxFileName$7,
							lineNumber: 51,
							columnNumber: 15
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName$7,
						lineNumber: 41,
						columnNumber: 11
					}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
						className: "flex items-center gap-2 sm:gap-3",
						children: [
							profile && /* @__PURE__ */ (void 0)(NotificationBell, { userId: profile.id }, void 0, false, {
								fileName: _jsxFileName$7,
								lineNumber: 79,
								columnNumber: 25
							}, this),
							profile && /* @__PURE__ */ (void 0)("button", {
								type: "button",
								onClick: () => setEditing(true),
								"aria-label": "Edit your profile",
								className: "flex items-center gap-2 rounded-full border border-border bg-card px-2 py-1.5 text-left transition hover:bg-accent/60 sm:px-3",
								children: [
									/* @__PURE__ */ (void 0)("span", {
										className: "flex size-8 items-center justify-center rounded-full bg-auth-gold-subtle text-xs font-bold text-auth-gold-foreground",
										children: profile.full_name.slice(0, 2).toUpperCase()
									}, void 0, false, {
										fileName: _jsxFileName$7,
										lineNumber: 87,
										columnNumber: 17
									}, this),
									/* @__PURE__ */ (void 0)("span", {
										className: "hidden leading-tight sm:block",
										children: [/* @__PURE__ */ (void 0)("span", {
											className: "block text-sm font-semibold",
											children: profile.full_name
										}, void 0, false, {
											fileName: _jsxFileName$7,
											lineNumber: 91,
											columnNumber: 19
										}, this), /* @__PURE__ */ (void 0)("span", {
											className: "block text-xs capitalize text-muted-foreground",
											children: profile.role === "student" ? profile.enrollment_no : "Teacher"
										}, void 0, false, {
											fileName: _jsxFileName$7,
											lineNumber: 92,
											columnNumber: 19
										}, this)]
									}, void 0, true, {
										fileName: _jsxFileName$7,
										lineNumber: 90,
										columnNumber: 17
									}, this),
									/* @__PURE__ */ (void 0)(UserRoundPen, { className: "size-4 text-muted-foreground" }, void 0, false, {
										fileName: _jsxFileName$7,
										lineNumber: 96,
										columnNumber: 17
									}, this)
								]
							}, void 0, true, {
								fileName: _jsxFileName$7,
								lineNumber: 81,
								columnNumber: 15
							}, this),
							/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Button, {
								size: "sm",
								onClick: signOut,
								children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(LogOut, { className: "mr-2 size-4" }, void 0, false, {
									fileName: _jsxFileName$7,
									lineNumber: 100,
									columnNumber: 15
								}, this), " Sign out"]
							}, void 0, true, {
								fileName: _jsxFileName$7,
								lineNumber: 99,
								columnNumber: 13
							}, this)
						]
					}, void 0, true, {
						fileName: _jsxFileName$7,
						lineNumber: 78,
						columnNumber: 11
					}, this)]
				}, void 0, true, {
					fileName: _jsxFileName$7,
					lineNumber: 40,
					columnNumber: 9
				}, this)
			}, void 0, false, {
				fileName: _jsxFileName$7,
				lineNumber: 39,
				columnNumber: 7
			}, this),
			profile && /* @__PURE__ */ (void 0)(EditProfileDialog, {
				profile,
				open: editing,
				onOpenChange: setEditing
			}, void 0, false, {
				fileName: _jsxFileName$7,
				lineNumber: 105,
				columnNumber: 19
			}, this),
			/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("main", {
				className: "relative mx-auto max-w-6xl px-4 py-8",
				children: [breadcrumbs && breadcrumbs.length > 0 && /* @__PURE__ */ (void 0)("nav", {
					className: "mb-4 flex flex-wrap items-center gap-1.5 text-xs font-medium text-muted-foreground",
					children: breadcrumbs.map((crumb, idx) => {
						const isLast = idx === breadcrumbs.length - 1;
						return /* @__PURE__ */ (void 0)("div", {
							className: "flex items-center gap-1.5",
							children: [idx > 0 && /* @__PURE__ */ (void 0)(ChevronRight, { className: "size-3 text-muted-foreground/60" }, void 0, false, {
								fileName: _jsxFileName$7,
								lineNumber: 113,
								columnNumber: 31
							}, this), crumb.href && !isLast ? /* @__PURE__ */ (void 0)(Link, {
								to: crumb.href,
								className: "transition hover:text-[#0d5c52] hover:underline",
								children: crumb.label
							}, void 0, false, {
								fileName: _jsxFileName$7,
								lineNumber: 115,
								columnNumber: 21
							}, this) : /* @__PURE__ */ (void 0)("span", {
								className: isLast ? "font-semibold text-foreground" : "",
								children: crumb.label
							}, void 0, false, {
								fileName: _jsxFileName$7,
								lineNumber: 122,
								columnNumber: 21
							}, this)]
						}, crumb.label, true, {
							fileName: _jsxFileName$7,
							lineNumber: 112,
							columnNumber: 17
						}, this);
					})
				}, void 0, false, {
					fileName: _jsxFileName$7,
					lineNumber: 108,
					columnNumber: 11
				}, this), children]
			}, void 0, true, {
				fileName: _jsxFileName$7,
				lineNumber: 106,
				columnNumber: 7
			}, this)
		]
	}, void 0, true, {
		fileName: _jsxFileName$7,
		lineNumber: 37,
		columnNumber: 5
	}, this);
}
var _jsxFileName$6 = "/app/applet/src/components/ui/badge.tsx";
var badgeVariants = cva("inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", {
	variants: { variant: {
		default: "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
		secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
		destructive: "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
		outline: "text-foreground"
	} },
	defaultVariants: { variant: "default" }
});
function Badge({ className, variant, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
		className: cn(badgeVariants({ variant }), className),
		...props
	}, void 0, false, {
		fileName: _jsxFileName$6,
		lineNumber: 29,
		columnNumber: 10
	}, this);
}
var _jsxFileName$5 = "/app/applet/src/components/status-badge.tsx";
function StatusBadge({ submission, audience }) {
	if (!submission || submission.status === "not_submitted") return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Badge, {
		variant: "outline",
		children: "Not submitted"
	}, void 0, false, {
		fileName: _jsxFileName$5,
		lineNumber: 12,
		columnNumber: 12
	}, this);
	if (submission.checked_status === "checked") return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Badge, { children: ["Checked — ", submission.total_marks ?? 0] }, void 0, true, {
		fileName: _jsxFileName$5,
		lineNumber: 15,
		columnNumber: 12
	}, this);
	return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Badge, {
		variant: "secondary",
		children: audience === "student" ? "Submitted — awaiting check" : "Submitted — pending"
	}, void 0, false, {
		fileName: _jsxFileName$5,
		lineNumber: 18,
		columnNumber: 5
	}, this);
}
var _jsxFileName$4 = "/app/applet/src/routes/_authenticated/student/index.tsx";
var Route$6 = createFileRoute("/_authenticated/student/")({
	head: () => ({ meta: [
		{ title: "My assignments — AssignEase" },
		{
			name: "description",
			content: "See your open assignments, scan answers with your camera, submit them, and check your marks."
		},
		{
			property: "og:title",
			content: "My assignments — AssignEase"
		},
		{
			property: "og:description",
			content: "Scan and submit your assignments, then see your marks."
		}
	] }),
	component: StudentDashboard
});
function StudentDashboard() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { data: profile, isLoading } = useProfile();
	(0, import_react.useEffect)(() => {
		if (!isLoading && profile && profile.role === "teacher") navigate({ to: "/teacher" });
		if (!isLoading && !profile) navigate({
			to: "/register",
			search: {
				role: "student",
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
	const submissions = useQuery({
		queryKey: ["submissions"],
		queryFn: () => listSubmissions()
	});
	(0, import_react.useEffect)(() => {
		const channel = supabase.channel("student-submissions").on("postgres_changes", {
			event: "*",
			schema: "public",
			table: "submissions"
		}, () => queryClient.invalidateQueries({ queryKey: ["submissions"] })).subscribe();
		return () => {
			supabase.removeChannel(channel);
		};
	}, [queryClient]);
	return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(AppShell, {
		profile: profile ?? null,
		breadcrumbs: [{ label: "My Assignments" }],
		children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
			className: "space-y-6",
			children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("h1", {
				className: "font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl",
				children: "My Assignments"
			}, void 0, false, {
				fileName: _jsxFileName$4,
				lineNumber: 60,
				columnNumber: 11
			}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", {
				className: "mt-1 text-sm text-muted-foreground",
				children: "Capture photos of your answers, submit them for grading, and view your marks."
			}, void 0, false, {
				fileName: _jsxFileName$4,
				lineNumber: 63,
				columnNumber: 11
			}, this)] }, void 0, true, {
				fileName: _jsxFileName$4,
				lineNumber: 59,
				columnNumber: 9
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
									children: "Assignment"
								}, void 0, false, {
									fileName: _jsxFileName$4,
									lineNumber: 73,
									columnNumber: 19
								}, this),
								/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("th", {
									className: "py-3.5 px-4",
									children: "No."
								}, void 0, false, {
									fileName: _jsxFileName$4,
									lineNumber: 74,
									columnNumber: 19
								}, this),
								/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("th", {
									className: "py-3.5 px-4",
									children: "Questions"
								}, void 0, false, {
									fileName: _jsxFileName$4,
									lineNumber: 75,
									columnNumber: 19
								}, this),
								/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("th", {
									className: "py-3.5 px-4",
									children: "Submission Status"
								}, void 0, false, {
									fileName: _jsxFileName$4,
									lineNumber: 76,
									columnNumber: 19
								}, this),
								/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("th", {
									className: "py-3.5 pr-6 pl-4 text-right",
									children: "Action"
								}, void 0, false, {
									fileName: _jsxFileName$4,
									lineNumber: 77,
									columnNumber: 19
								}, this)
							] }, void 0, true, {
								fileName: _jsxFileName$4,
								lineNumber: 72,
								columnNumber: 17
							}, this)
						}, void 0, false, {
							fileName: _jsxFileName$4,
							lineNumber: 71,
							columnNumber: 15
						}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("tbody", {
							className: "divide-y divide-border/50",
							children: assignments.isLoading ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("tr", { children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("td", {
								colSpan: 5,
								className: "py-12 text-center text-sm text-muted-foreground",
								children: "Loading assignments..."
							}, void 0, false, {
								fileName: _jsxFileName$4,
								lineNumber: 83,
								columnNumber: 21
							}, this) }, void 0, false, {
								fileName: _jsxFileName$4,
								lineNumber: 82,
								columnNumber: 19
							}, this) : assignments.data?.length === 0 ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("tr", { children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("td", {
								colSpan: 5,
								className: "py-12 text-center text-sm text-muted-foreground",
								children: "No assignments have been posted yet."
							}, void 0, false, {
								fileName: _jsxFileName$4,
								lineNumber: 89,
								columnNumber: 21
							}, this) }, void 0, false, {
								fileName: _jsxFileName$4,
								lineNumber: 88,
								columnNumber: 19
							}, this) : assignments.data?.map((assignment) => {
								const submission = submissions.data?.find((s) => s.assignment_id === assignment.id);
								const isSubmitted = submission?.status === "submitted";
								const isChecked = submission?.checked_status === "checked";
								return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("tr", {
									className: "transition hover:bg-neutral-50/80 dark:hover:bg-neutral-800/50",
									children: [
										/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("td", {
											className: "py-4 pl-6 pr-3 font-semibold text-foreground",
											children: assignment.title
										}, void 0, false, {
											fileName: _jsxFileName$4,
											lineNumber: 106,
											columnNumber: 25
										}, this),
										/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("td", {
											className: "py-4 px-4 font-mono text-xs text-muted-foreground",
											children: ["#", assignment.assignment_no]
										}, void 0, true, {
											fileName: _jsxFileName$4,
											lineNumber: 109,
											columnNumber: 25
										}, this),
										/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("td", {
											className: "py-4 px-4 text-xs text-muted-foreground",
											children: [assignment.total_questions, " Questions"]
										}, void 0, true, {
											fileName: _jsxFileName$4,
											lineNumber: 112,
											columnNumber: 25
										}, this),
										/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("td", {
											className: "py-4 px-4",
											children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(StatusBadge, {
												submission,
												audience: "student"
											}, void 0, false, {
												fileName: _jsxFileName$4,
												lineNumber: 116,
												columnNumber: 27
											}, this)
										}, void 0, false, {
											fileName: _jsxFileName$4,
											lineNumber: 115,
											columnNumber: 25
										}, this),
										/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("td", {
											className: "py-4 pr-6 pl-4 text-right",
											children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Button, {
												asChild: true,
												size: "sm",
												className: "rounded-xl bg-[#0d5c52] font-semibold text-white shadow-xs hover:bg-[#0a4840]",
												children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Link, {
													to: "/student/assignments/$assignmentId",
													params: { assignmentId: assignment.id },
													children: isChecked ? "View Marks" : isSubmitted ? "View Submission" : "Submit Answers"
												}, void 0, false, {
													fileName: _jsxFileName$4,
													lineNumber: 124,
													columnNumber: 29
												}, this)
											}, void 0, false, {
												fileName: _jsxFileName$4,
												lineNumber: 119,
												columnNumber: 27
											}, this)
										}, void 0, false, {
											fileName: _jsxFileName$4,
											lineNumber: 118,
											columnNumber: 25
										}, this)
									]
								}, assignment.id, true, {
									fileName: _jsxFileName$4,
									lineNumber: 102,
									columnNumber: 23
								}, this);
							})
						}, void 0, false, {
							fileName: _jsxFileName$4,
							lineNumber: 80,
							columnNumber: 15
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName$4,
						lineNumber: 70,
						columnNumber: 13
					}, this)
				}, void 0, false, {
					fileName: _jsxFileName$4,
					lineNumber: 69,
					columnNumber: 11
				}, this)
			}, void 0, false, {
				fileName: _jsxFileName$4,
				lineNumber: 68,
				columnNumber: 9
			}, this)]
		}, void 0, true, {
			fileName: _jsxFileName$4,
			lineNumber: 58,
			columnNumber: 7
		}, this)
	}, void 0, false, {
		fileName: _jsxFileName$4,
		lineNumber: 57,
		columnNumber: 5
	}, this);
}
var $$splitComponentImporter$2 = () => import("./teacher-4q3bfUFF.mjs");
var Route$5 = createFileRoute("/_authenticated/teacher/")({
	head: () => ({ meta: [{ title: "Teacher Dashboard — AssignEase" }, {
		name: "description",
		content: "Create assignments, track live submissions, and grade answer scans."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
var $$splitComponentImporter$1 = () => import("./assignments._assignmentId-DlTv8Kaz.mjs");
var Route$4 = createFileRoute("/_authenticated/student/assignments/$assignmentId")({
	head: () => ({ meta: [
		{ title: "Scan & submit — AssignEase" },
		{
			name: "description",
			content: "Capture a photo of each answer with your device camera and submit the assignment to your teacher."
		},
		{
			property: "og:title",
			content: "Scan & submit — AssignEase"
		},
		{
			property: "og:description",
			content: "Capture answers with your camera and submit."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
var _jsxFileName$3 = "/app/applet/src/components/ui/alert-dialog.tsx";
var AlertDialog = Root2;
var AlertDialogPortal = Portal2;
var AlertDialogOverlay = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Overlay2, {
	className: cn("fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0", className),
	...props,
	ref
}, void 0, false, {
	fileName: _jsxFileName$3,
	lineNumber: 17,
	columnNumber: 3
}, void 0));
AlertDialogOverlay.displayName = Overlay2.displayName;
var AlertDialogContent = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(AlertDialogPortal, { children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(AlertDialogOverlay, {}, void 0, false, {
	fileName: _jsxFileName$3,
	lineNumber: 33,
	columnNumber: 5
}, void 0), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Content2, {
	ref,
	className: cn("fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg", className),
	...props
}, void 0, false, {
	fileName: _jsxFileName$3,
	lineNumber: 34,
	columnNumber: 5
}, void 0)] }, void 0, true, {
	fileName: _jsxFileName$3,
	lineNumber: 32,
	columnNumber: 3
}, void 0));
AlertDialogContent.displayName = Content2.displayName;
var AlertDialogHeader = ({ className, ...props }) => /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
	className: cn("flex flex-col space-y-2 text-center sm:text-left", className),
	...props
}, void 0, false, {
	fileName: _jsxFileName$3,
	lineNumber: 47,
	columnNumber: 3
}, void 0);
AlertDialogHeader.displayName = "AlertDialogHeader";
var AlertDialogFooter = ({ className, ...props }) => /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
	className: cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className),
	...props
}, void 0, false, {
	fileName: _jsxFileName$3,
	lineNumber: 52,
	columnNumber: 3
}, void 0);
AlertDialogFooter.displayName = "AlertDialogFooter";
var AlertDialogTitle = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Title2, {
	ref,
	className: cn("text-lg font-semibold", className),
	...props
}, void 0, false, {
	fileName: _jsxFileName$3,
	lineNumber: 63,
	columnNumber: 3
}, void 0));
AlertDialogTitle.displayName = Title2.displayName;
var AlertDialogDescription = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Description2, {
	ref,
	className: cn("text-sm text-muted-foreground", className),
	...props
}, void 0, false, {
	fileName: _jsxFileName$3,
	lineNumber: 75,
	columnNumber: 3
}, void 0));
AlertDialogDescription.displayName = Description2.displayName;
var AlertDialogAction = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Action, {
	ref,
	className: cn(buttonVariants(), className),
	...props
}, void 0, false, {
	fileName: _jsxFileName$3,
	lineNumber: 87,
	columnNumber: 3
}, void 0));
AlertDialogAction.displayName = Action.displayName;
var AlertDialogCancel = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Cancel, {
	ref,
	className: cn(buttonVariants({ variant: "outline" }), "mt-2 sm:mt-0", className),
	...props
}, void 0, false, {
	fileName: _jsxFileName$3,
	lineNumber: 95,
	columnNumber: 3
}, void 0));
AlertDialogCancel.displayName = Cancel.displayName;
var _jsxFileName$2 = "/app/applet/src/routes/_authenticated/teacher/assignments.$assignmentId.tsx";
var Route$3 = createFileRoute("/_authenticated/teacher/assignments/$assignmentId")({
	head: () => ({ meta: [
		{ title: "Assignment submissions — AssignEase" },
		{
			name: "description",
			content: "Track who has submitted this assignment, close the submission window, and open a student's scans to grade."
		},
		{
			property: "og:title",
			content: "Assignment submissions — AssignEase"
		},
		{
			property: "og:description",
			content: "Live submission status for one assignment."
		}
	] }),
	component: TeacherAssignmentPage
});
function TeacherAssignmentPage() {
	const { assignmentId } = Route$3.useParams();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { data: profile } = useProfile();
	const [confirmOpen, setConfirmOpen] = (0, import_react.useState)(false);
	const assignment = useQuery({
		queryKey: ["assignment", assignmentId],
		queryFn: () => getAssignment(assignmentId)
	});
	const students = useQuery({
		queryKey: ["students"],
		queryFn: listStudents
	});
	const submissions = useQuery({
		queryKey: ["submissions", assignmentId],
		queryFn: () => listSubmissions(assignmentId)
	});
	const paperUrl = useSignedUrl("question-papers", assignment.data?.question_paper_url);
	(0, import_react.useEffect)(() => {
		const channel = supabase.channel(`assignment-${assignmentId}`).on("postgres_changes", {
			event: "*",
			schema: "public",
			table: "submissions",
			filter: `assignment_id=eq.${assignmentId}`
		}, () => queryClient.invalidateQueries({ queryKey: ["submissions", assignmentId] })).subscribe();
		return () => {
			supabase.removeChannel(channel);
		};
	}, [assignmentId, queryClient]);
	const close = useMutation({
		mutationFn: async () => {
			const { error } = await supabase.from("assignments").update({
				is_open: false,
				closed_at: (/* @__PURE__ */ new Date()).toISOString()
			}).eq("id", assignmentId);
			if (error) throw error;
		},
		onSuccess: () => {
			toast.success("Submission window closed");
			queryClient.invalidateQueries({ queryKey: ["assignment", assignmentId] });
			queryClient.invalidateQueries({ queryKey: ["assignments"] });
			setConfirmOpen(false);
		},
		onError: (error) => toast.error(error.message)
	});
	const openGrading = useMutation({
		mutationFn: async (studentId) => {
			const existing = submissions.data?.find((s) => s.student_id === studentId);
			if (existing) return existing.id;
			return (await getOrCreateSubmission(assignmentId, studentId)).id;
		},
		onError: (error) => toast.error(error.message)
	});
	function getAvatarColor(name) {
		const colors = [
			"bg-amber-100 text-amber-800",
			"bg-emerald-100 text-emerald-800",
			"bg-indigo-100 text-indigo-800",
			"bg-purple-100 text-purple-800",
			"bg-rose-100 text-rose-800",
			"bg-teal-100 text-teal-800"
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
		breadcrumbs: [{
			label: "Assignments",
			href: "/teacher"
		}, { label: assignment.data?.title || "Assignment Details" }],
		children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
			className: "space-y-6",
			children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
				className: "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("h1", {
					className: "font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl",
					children: assignment.data?.title || "Midterm Math Quiz"
				}, void 0, false, {
					fileName: _jsxFileName$2,
					lineNumber: 152,
					columnNumber: 13
				}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", {
					className: "mt-1 text-sm text-muted-foreground font-medium",
					children: [assignment.data?.total_questions || 5, " Questions"]
				}, void 0, true, {
					fileName: _jsxFileName$2,
					lineNumber: 155,
					columnNumber: 13
				}, this)] }, void 0, true, {
					fileName: _jsxFileName$2,
					lineNumber: 151,
					columnNumber: 11
				}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
					className: "flex items-center gap-3",
					children: [
						assignment.data?.is_open ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
							className: "inline-flex items-center rounded-full bg-[#0d5c52] px-4 py-1.5 text-xs font-semibold text-white shadow-xs",
							children: "Open"
						}, void 0, false, {
							fileName: _jsxFileName$2,
							lineNumber: 162,
							columnNumber: 15
						}, this) : /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
							className: "inline-flex items-center rounded-full bg-neutral-200 px-4 py-1.5 text-xs font-semibold text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
							children: "Closed"
						}, void 0, false, {
							fileName: _jsxFileName$2,
							lineNumber: 166,
							columnNumber: 15
						}, this),
						paperUrl && /* @__PURE__ */ (void 0)("a", {
							href: paperUrl,
							target: "_blank",
							rel: "noreferrer",
							className: "inline-flex items-center gap-1.5 rounded-2xl border border-border/80 bg-white px-4 py-2 text-xs font-semibold text-foreground shadow-xs transition hover:bg-neutral-50 dark:bg-neutral-900",
							children: "Question paper"
						}, void 0, false, {
							fileName: _jsxFileName$2,
							lineNumber: 172,
							columnNumber: 15
						}, this),
						assignment.data?.is_open && /* @__PURE__ */ (void 0)("button", {
							type: "button",
							onClick: () => setConfirmOpen(true),
							className: "inline-flex items-center gap-2 rounded-2xl border border-border/80 bg-white px-4 py-2 text-xs font-semibold text-foreground shadow-xs transition hover:bg-neutral-50 dark:bg-neutral-900",
							children: "Close Submission Window"
						}, void 0, false, {
							fileName: _jsxFileName$2,
							lineNumber: 183,
							columnNumber: 15
						}, this)
					]
				}, void 0, true, {
					fileName: _jsxFileName$2,
					lineNumber: 160,
					columnNumber: 11
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName$2,
				lineNumber: 150,
				columnNumber: 9
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
									className: "py-3.5 pl-6 pr-3 w-16",
									children: "Avatar"
								}, void 0, false, {
									fileName: _jsxFileName$2,
									lineNumber: 200,
									columnNumber: 19
								}, this),
								/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("th", {
									className: "py-3.5 px-4",
									children: "Student Name"
								}, void 0, false, {
									fileName: _jsxFileName$2,
									lineNumber: 201,
									columnNumber: 19
								}, this),
								/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("th", {
									className: "py-3.5 px-4",
									children: "Enrollment No."
								}, void 0, false, {
									fileName: _jsxFileName$2,
									lineNumber: 202,
									columnNumber: 19
								}, this),
								/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("th", {
									className: "py-3.5 px-4",
									children: "Submission Date"
								}, void 0, false, {
									fileName: _jsxFileName$2,
									lineNumber: 203,
									columnNumber: 19
								}, this),
								/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("th", {
									className: "py-3.5 px-4",
									children: "Status"
								}, void 0, false, {
									fileName: _jsxFileName$2,
									lineNumber: 204,
									columnNumber: 19
								}, this),
								/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("th", {
									className: "py-3.5 pr-6 pl-4 text-right",
									children: "Action"
								}, void 0, false, {
									fileName: _jsxFileName$2,
									lineNumber: 205,
									columnNumber: 19
								}, this)
							] }, void 0, true, {
								fileName: _jsxFileName$2,
								lineNumber: 199,
								columnNumber: 17
							}, this)
						}, void 0, false, {
							fileName: _jsxFileName$2,
							lineNumber: 198,
							columnNumber: 15
						}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("tbody", {
							className: "divide-y divide-border/50",
							children: students.isLoading || submissions.isLoading ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("tr", { children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("td", {
								colSpan: 6,
								className: "py-12 text-center text-sm text-muted-foreground",
								children: "Loading submissions..."
							}, void 0, false, {
								fileName: _jsxFileName$2,
								lineNumber: 211,
								columnNumber: 21
							}, this) }, void 0, false, {
								fileName: _jsxFileName$2,
								lineNumber: 210,
								columnNumber: 19
							}, this) : students.data?.length === 0 ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("tr", { children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("td", {
								colSpan: 6,
								className: "py-12 text-center text-sm text-muted-foreground",
								children: "No students registered yet."
							}, void 0, false, {
								fileName: _jsxFileName$2,
								lineNumber: 217,
								columnNumber: 21
							}, this) }, void 0, false, {
								fileName: _jsxFileName$2,
								lineNumber: 216,
								columnNumber: 19
							}, this) : students.data?.map((student) => {
								const sub = submissions.data?.find((s) => s.student_id === student.id);
								const isChecked = sub?.checked_status === "checked" || sub?.total_marks !== null && sub?.total_marks !== void 0;
								const isSubmitted = sub?.status === "submitted";
								const initials = getInitials(student.full_name);
								const colorClass = getAvatarColor(student.full_name);
								sub?.submitted_at && new Date(sub.submitted_at).toLocaleDateString("en-GB");
								return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("tr", {
									className: "transition hover:bg-neutral-50/80 dark:hover:bg-neutral-800/50",
									children: [
										/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("td", {
											className: "py-4 pl-6 pr-3",
											children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
												className: `flex size-9 items-center justify-center rounded-full text-xs font-bold shadow-xs ${colorClass}`,
												children: initials
											}, void 0, false, {
												fileName: _jsxFileName$2,
												lineNumber: 241,
												columnNumber: 27
											}, this)
										}, void 0, false, {
											fileName: _jsxFileName$2,
											lineNumber: 240,
											columnNumber: 25
										}, this),
										/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("td", {
											className: "py-4 px-4 font-semibold text-foreground",
											children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Link, {
												to: "/teacher/students/$studentId",
												params: { studentId: student.id },
												className: "transition hover:text-[#0d5c52] hover:underline",
												title: "View student vault",
												children: student.full_name || "Unnamed Student"
											}, void 0, false, {
												fileName: _jsxFileName$2,
												lineNumber: 250,
												columnNumber: 27
											}, this)
										}, void 0, false, {
											fileName: _jsxFileName$2,
											lineNumber: 249,
											columnNumber: 25
										}, this),
										/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("td", {
											className: "py-4 px-4 font-mono text-xs text-muted-foreground",
											children: student.enrollment_no || "014202"
										}, void 0, false, {
											fileName: _jsxFileName$2,
											lineNumber: 261,
											columnNumber: 25
										}, this),
										/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("td", {
											className: "py-4 px-4 text-xs text-muted-foreground",
											children: sub?.submitted_at ? new Date(sub.submitted_at).toLocaleDateString("en-GB") : "21/07/2023"
										}, void 0, false, {
											fileName: _jsxFileName$2,
											lineNumber: 266,
											columnNumber: 25
										}, this),
										/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("td", {
											className: "py-4 px-4",
											children: isChecked ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
												className: "flex items-center gap-2 text-xs font-semibold text-foreground",
												children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { className: "size-2 rounded-full bg-amber-500" }, void 0, false, {
													fileName: _jsxFileName$2,
													lineNumber: 276,
													columnNumber: 31
												}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { children: [
													"Checked - ",
													sub?.total_marks ?? 23,
													"/",
													assignment.data?.total_questions ? assignment.data.total_questions * 5 : 25
												] }, void 0, true, {
													fileName: _jsxFileName$2,
													lineNumber: 277,
													columnNumber: 31
												}, this)]
											}, void 0, true, {
												fileName: _jsxFileName$2,
												lineNumber: 275,
												columnNumber: 29
											}, this) : isSubmitted ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
												className: "flex items-center gap-2 text-xs font-semibold text-foreground",
												children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { className: "size-2 rounded-full bg-amber-500" }, void 0, false, {
													fileName: _jsxFileName$2,
													lineNumber: 286,
													columnNumber: 31
												}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { children: "Submitted - pending" }, void 0, false, {
													fileName: _jsxFileName$2,
													lineNumber: 287,
													columnNumber: 31
												}, this)]
											}, void 0, true, {
												fileName: _jsxFileName$2,
												lineNumber: 285,
												columnNumber: 29
											}, this) : /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
												className: "flex items-center gap-2 text-xs font-semibold text-muted-foreground",
												children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { className: "size-2 rounded-full bg-red-500" }, void 0, false, {
													fileName: _jsxFileName$2,
													lineNumber: 291,
													columnNumber: 31
												}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { children: "Not submitted" }, void 0, false, {
													fileName: _jsxFileName$2,
													lineNumber: 292,
													columnNumber: 31
												}, this)]
											}, void 0, true, {
												fileName: _jsxFileName$2,
												lineNumber: 290,
												columnNumber: 29
											}, this)
										}, void 0, false, {
											fileName: _jsxFileName$2,
											lineNumber: 273,
											columnNumber: 25
										}, this),
										/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("td", {
											className: "py-4 pr-6 pl-4 text-right",
											children: sub ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Link, {
												to: "/teacher/grade/$submissionId",
												params: { submissionId: sub.id },
												className: "inline-flex items-center gap-1 rounded-xl bg-[#0d5c52] px-4 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#0a4840]",
												children: isChecked ? "Review" : "Grade"
											}, void 0, false, {
												fileName: _jsxFileName$2,
												lineNumber: 300,
												columnNumber: 29
											}, this) : /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", {
												type: "button",
												disabled: openGrading.isPending,
												onClick: async () => {
													const subId = await openGrading.mutateAsync(student.id);
													if (subId) navigate({
														to: "/teacher/grade/$submissionId",
														params: { submissionId: subId }
													});
												},
												className: "inline-flex items-center gap-1 rounded-xl border border-border/80 bg-white px-3.5 py-1.5 text-xs font-semibold text-foreground shadow-xs transition hover:bg-neutral-50 dark:bg-neutral-800",
												children: "Open & Grade"
											}, void 0, false, {
												fileName: _jsxFileName$2,
												lineNumber: 308,
												columnNumber: 29
											}, this)
										}, void 0, false, {
											fileName: _jsxFileName$2,
											lineNumber: 298,
											columnNumber: 25
										}, this)
									]
								}, student.id, true, {
									fileName: _jsxFileName$2,
									lineNumber: 235,
									columnNumber: 23
								}, this);
							})
						}, void 0, false, {
							fileName: _jsxFileName$2,
							lineNumber: 208,
							columnNumber: 15
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName$2,
						lineNumber: 197,
						columnNumber: 13
					}, this)
				}, void 0, false, {
					fileName: _jsxFileName$2,
					lineNumber: 196,
					columnNumber: 11
				}, this)
			}, void 0, false, {
				fileName: _jsxFileName$2,
				lineNumber: 195,
				columnNumber: 9
			}, this)]
		}, void 0, true, {
			fileName: _jsxFileName$2,
			lineNumber: 148,
			columnNumber: 7
		}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(AlertDialog, {
			open: confirmOpen,
			onOpenChange: setConfirmOpen,
			children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(AlertDialogContent, {
				className: "rounded-3xl border border-white/60 bg-white/95 p-7 shadow-2xl backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900/95",
				children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(AlertDialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(AlertDialogTitle, {
					className: "font-display text-xl font-bold",
					children: "Close the submission window?"
				}, void 0, false, {
					fileName: _jsxFileName$2,
					lineNumber: 339,
					columnNumber: 13
				}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(AlertDialogDescription, {
					className: "text-sm text-muted-foreground",
					children: "Students will no longer be able to submit or edit this assignment. This cannot be undone."
				}, void 0, false, {
					fileName: _jsxFileName$2,
					lineNumber: 342,
					columnNumber: 13
				}, this)] }, void 0, true, {
					fileName: _jsxFileName$2,
					lineNumber: 338,
					columnNumber: 11
				}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(AlertDialogFooter, {
					className: "mt-4 gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(AlertDialogCancel, {
						className: "rounded-xl border border-border/80",
						children: "Cancel"
					}, void 0, false, {
						fileName: _jsxFileName$2,
						lineNumber: 348,
						columnNumber: 13
					}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(AlertDialogAction, {
						onClick: () => close.mutate(),
						disabled: close.isPending,
						className: "rounded-xl bg-red-600 text-white hover:bg-red-700",
						children: close.isPending ? "Closing…" : "Close window"
					}, void 0, false, {
						fileName: _jsxFileName$2,
						lineNumber: 351,
						columnNumber: 13
					}, this)]
				}, void 0, true, {
					fileName: _jsxFileName$2,
					lineNumber: 347,
					columnNumber: 11
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName$2,
				lineNumber: 337,
				columnNumber: 9
			}, this)
		}, void 0, false, {
			fileName: _jsxFileName$2,
			lineNumber: 336,
			columnNumber: 7
		}, this)]
	}, void 0, true, {
		fileName: _jsxFileName$2,
		lineNumber: 141,
		columnNumber: 5
	}, this);
}
var $$splitComponentImporter = () => import("./grade._submissionId-BOUAP9kc.mjs");
var Route$2 = createFileRoute("/_authenticated/teacher/grade/$submissionId")({
	head: () => ({ meta: [
		{ title: "Grade submission — AssignEase" },
		{
			name: "description",
			content: "Zoom into each scanned answer, award marks per question, and publish the total to the student."
		},
		{
			property: "og:title",
			content: "Grade submission — AssignEase"
		},
		{
			property: "og:description",
			content: "Award per-question marks on scanned answers."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
var HEADERS = [
	"Registered name",
	"Enrollment no.",
	"Email",
	"Assignment no.",
	"Assignment",
	"Submission status",
	"Marks",
	"Checked"
];
function cell(value) {
	const text = value === null || value === void 0 ? "" : String(value);
	return /[",\n]/.test(text) ? `"${text.replace(/"/g, "\"\"")}"` : text;
}
function buildRosterCsv(students, assignments, submissions) {
	const rows = [HEADERS.join(",")];
	for (const student of students) {
		if (assignments.length === 0) {
			rows.push([
				student.full_name,
				student.enrollment_no,
				student.email,
				"",
				"",
				"",
				"",
				""
			].map(cell).join(","));
			continue;
		}
		for (const assignment of assignments) {
			const submission = submissions.find((s) => s.assignment_id === assignment.id && s.student_id === student.id);
			const submitted = submission?.status === "submitted";
			const checked = submission?.checked_status === "checked";
			rows.push([
				student.full_name,
				student.enrollment_no,
				student.email,
				assignment.assignment_no,
				assignment.title,
				submitted ? "Submitted" : "Not submitted",
				checked ? submission?.total_marks ?? 0 : "",
				checked ? "Checked" : "Pending"
			].map(cell).join(","));
		}
	}
	return rows.join("\r\n");
}
function downloadCsv(filename, csv) {
	const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	link.remove();
	URL.revokeObjectURL(url);
}
var _jsxFileName$1 = "/app/applet/src/routes/_authenticated/teacher/students.index.tsx";
var Route$1 = createFileRoute("/_authenticated/teacher/students/")({
	head: () => ({ meta: [{ title: "Student Roster & Vault — AssignEase" }, {
		name: "description",
		content: "View all registered students, access individual student vaults and submission records."
	}] }),
	component: TeacherStudentsDashboard
});
function TeacherStudentsDashboard() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { data: profile, isLoading } = useProfile();
	const [searchTerm, setSearchTerm] = (0, import_react.useState)("");
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
		const channel = supabase.channel("teacher-students-vault-live").on("postgres_changes", {
			event: "*",
			schema: "public",
			table: "profiles"
		}, () => {
			queryClient.invalidateQueries({ queryKey: ["students"] });
		}).on("postgres_changes", {
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
	const totalStudents = students.data?.length ?? 0;
	const totalAssignments = assignments.data?.length ?? 0;
	const totalSubmissions = submissions.data?.length ?? 0;
	const totalChecked = submissions.data?.filter((s) => s.checked_status === "checked").length ?? 0;
	const filteredStudents = (0, import_react.useMemo)(() => {
		if (!students.data) return [];
		if (!searchTerm.trim()) return students.data;
		const term = searchTerm.toLowerCase().trim();
		return students.data.filter((s) => s.full_name?.toLowerCase().includes(term) || s.enrollment_no?.toLowerCase().includes(term) || s.email?.toLowerCase().includes(term));
	}, [students.data, searchTerm]);
	function getAvatarColor(name) {
		const colors = [
			"bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
			"bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
			"bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300",
			"bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300",
			"bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300",
			"bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300"
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
		breadcrumbs: [{
			label: "Teacher Dashboard",
			href: "/teacher"
		}, { label: "Students Roster" }],
		children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
			className: "space-y-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
					className: "flex flex-wrap items-center justify-between gap-4",
					children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("h1", {
						className: "font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl",
						children: "Student Roster & Vaults"
					}, void 0, false, {
						fileName: _jsxFileName$1,
						lineNumber: 124,
						columnNumber: 13
					}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", {
						className: "mt-1 text-sm text-muted-foreground",
						children: "Browse your registered students and click on any student vault to inspect their complete assignment history and answer scans."
					}, void 0, false, {
						fileName: _jsxFileName$1,
						lineNumber: 127,
						columnNumber: 13
					}, this)] }, void 0, true, {
						fileName: _jsxFileName$1,
						lineNumber: 123,
						columnNumber: 11
					}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
						className: "inline-flex rounded-2xl border border-border/80 bg-neutral-100/80 p-1 shadow-xs dark:bg-neutral-800/80",
						children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Link, {
							to: "/teacher",
							className: "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-muted-foreground transition hover:text-foreground",
							children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(FileText, { className: "size-4" }, void 0, false, {
								fileName: _jsxFileName$1,
								lineNumber: 139,
								columnNumber: 15
							}, this), "Assignments"]
						}, void 0, true, {
							fileName: _jsxFileName$1,
							lineNumber: 135,
							columnNumber: 13
						}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Link, {
							to: "/teacher/students",
							className: "inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-[#0d5c52] shadow-xs dark:bg-neutral-900 dark:text-emerald-400",
							children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Users, { className: "size-4" }, void 0, false, {
								fileName: _jsxFileName$1,
								lineNumber: 146,
								columnNumber: 15
							}, this), "Student List & Vault"]
						}, void 0, true, {
							fileName: _jsxFileName$1,
							lineNumber: 142,
							columnNumber: 13
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName$1,
						lineNumber: 134,
						columnNumber: 11
					}, this)]
				}, void 0, true, {
					fileName: _jsxFileName$1,
					lineNumber: 122,
					columnNumber: 9
				}, this),
				/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
					className: "grid grid-cols-1 gap-4 sm:grid-cols-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
							className: "flex items-center gap-4 rounded-3xl border border-border/80 bg-white p-5 shadow-xs dark:bg-neutral-900",
							children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
								className: "flex size-12 items-center justify-center rounded-2xl bg-indigo-100/70 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400",
								children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Users, { className: "size-6" }, void 0, false, {
									fileName: _jsxFileName$1,
									lineNumber: 156,
									columnNumber: 15
								}, this)
							}, void 0, false, {
								fileName: _jsxFileName$1,
								lineNumber: 155,
								columnNumber: 13
							}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
								className: "font-display text-2xl font-bold tracking-tight text-foreground",
								children: totalStudents
							}, void 0, false, {
								fileName: _jsxFileName$1,
								lineNumber: 159,
								columnNumber: 15
							}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
								className: "text-xs font-medium text-muted-foreground",
								children: "Registered Students"
							}, void 0, false, {
								fileName: _jsxFileName$1,
								lineNumber: 162,
								columnNumber: 15
							}, this)] }, void 0, true, {
								fileName: _jsxFileName$1,
								lineNumber: 158,
								columnNumber: 13
							}, this)]
						}, void 0, true, {
							fileName: _jsxFileName$1,
							lineNumber: 154,
							columnNumber: 11
						}, this),
						/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
							className: "flex items-center gap-4 rounded-3xl border border-border/80 bg-white p-5 shadow-xs dark:bg-neutral-900",
							children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
								className: "flex size-12 items-center justify-center rounded-2xl bg-emerald-100/70 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400",
								children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(CircleCheck, { className: "size-6" }, void 0, false, {
									fileName: _jsxFileName$1,
									lineNumber: 168,
									columnNumber: 15
								}, this)
							}, void 0, false, {
								fileName: _jsxFileName$1,
								lineNumber: 167,
								columnNumber: 13
							}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
								className: "font-display text-2xl font-bold tracking-tight text-foreground",
								children: totalSubmissions
							}, void 0, false, {
								fileName: _jsxFileName$1,
								lineNumber: 171,
								columnNumber: 15
							}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
								className: "text-xs font-medium text-muted-foreground",
								children: "Total Submissions Received"
							}, void 0, false, {
								fileName: _jsxFileName$1,
								lineNumber: 174,
								columnNumber: 15
							}, this)] }, void 0, true, {
								fileName: _jsxFileName$1,
								lineNumber: 170,
								columnNumber: 13
							}, this)]
						}, void 0, true, {
							fileName: _jsxFileName$1,
							lineNumber: 166,
							columnNumber: 11
						}, this),
						/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
							className: "flex items-center gap-4 rounded-3xl border border-border/80 bg-white p-5 shadow-xs dark:bg-neutral-900",
							children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
								className: "flex size-12 items-center justify-center rounded-2xl bg-amber-100/70 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400",
								children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(GraduationCap, { className: "size-6" }, void 0, false, {
									fileName: _jsxFileName$1,
									lineNumber: 182,
									columnNumber: 15
								}, this)
							}, void 0, false, {
								fileName: _jsxFileName$1,
								lineNumber: 181,
								columnNumber: 13
							}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
								className: "font-display text-2xl font-bold tracking-tight text-foreground",
								children: totalChecked
							}, void 0, false, {
								fileName: _jsxFileName$1,
								lineNumber: 185,
								columnNumber: 15
							}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
								className: "text-xs font-medium text-muted-foreground",
								children: "Checked & Graded"
							}, void 0, false, {
								fileName: _jsxFileName$1,
								lineNumber: 188,
								columnNumber: 15
							}, this)] }, void 0, true, {
								fileName: _jsxFileName$1,
								lineNumber: 184,
								columnNumber: 13
							}, this)]
						}, void 0, true, {
							fileName: _jsxFileName$1,
							lineNumber: 180,
							columnNumber: 11
						}, this)
					]
				}, void 0, true, {
					fileName: _jsxFileName$1,
					lineNumber: 153,
					columnNumber: 9
				}, this),
				/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
					className: "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
						className: "relative flex-1 max-w-md",
						children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Search, { className: "absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" }, void 0, false, {
							fileName: _jsxFileName$1,
							lineNumber: 196,
							columnNumber: 13
						}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("input", {
							type: "text",
							placeholder: "Search by student name, enrollment no, or email...",
							value: searchTerm,
							onChange: (e) => setSearchTerm(e.target.value),
							className: "h-10 w-full rounded-2xl border border-border/80 bg-white pl-10 pr-4 text-xs font-medium text-foreground shadow-xs transition placeholder:text-muted-foreground/60 focus:border-[#0d5c52] focus:outline-none focus:ring-2 focus:ring-[#0d5c52]/20 dark:bg-neutral-900"
						}, void 0, false, {
							fileName: _jsxFileName$1,
							lineNumber: 197,
							columnNumber: 13
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName$1,
						lineNumber: 195,
						columnNumber: 11
					}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", {
						type: "button",
						disabled: !students.data?.length,
						onClick: () => {
							const csv = buildRosterCsv(students.data ?? [], assignments.data ?? [], submissions.data ?? []);
							downloadCsv(`assignease-roster-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.csv`, csv);
							toast.success("Student roster CSV downloaded");
						},
						className: "inline-flex items-center justify-center gap-2 rounded-2xl border border-border/80 bg-white px-4 py-2.5 text-xs font-semibold text-foreground shadow-xs transition hover:bg-neutral-50 disabled:opacity-50 dark:bg-neutral-900 dark:hover:bg-neutral-800",
						children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Download, { className: "size-4 text-muted-foreground" }, void 0, false, {
							fileName: _jsxFileName$1,
							lineNumber: 220,
							columnNumber: 13
						}, this), "Export Class CSV"]
					}, void 0, true, {
						fileName: _jsxFileName$1,
						lineNumber: 206,
						columnNumber: 11
					}, this)]
				}, void 0, true, {
					fileName: _jsxFileName$1,
					lineNumber: 194,
					columnNumber: 9
				}, this),
				/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
					className: "overflow-hidden rounded-3xl border border-border/80 bg-white shadow-xs dark:bg-neutral-900",
					children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
						className: "overflow-x-auto",
						children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("table", {
							className: "w-full text-left text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("thead", {
								className: "border-b border-border/70 bg-[#FDFBF7] text-xs font-semibold text-muted-foreground dark:bg-neutral-800/60",
								children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("tr", { children: [
									/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("th", {
										className: "py-3.5 pl-6 pr-3 w-16",
										children: "Avatar"
									}, void 0, false, {
										fileName: _jsxFileName$1,
										lineNumber: 231,
										columnNumber: 19
									}, this),
									/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("th", {
										className: "py-3.5 px-4",
										children: "Student Name"
									}, void 0, false, {
										fileName: _jsxFileName$1,
										lineNumber: 232,
										columnNumber: 19
									}, this),
									/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("th", {
										className: "py-3.5 px-4",
										children: "Enrollment No."
									}, void 0, false, {
										fileName: _jsxFileName$1,
										lineNumber: 233,
										columnNumber: 19
									}, this),
									/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("th", {
										className: "py-3.5 px-4",
										children: "Registered Email"
									}, void 0, false, {
										fileName: _jsxFileName$1,
										lineNumber: 234,
										columnNumber: 19
									}, this),
									/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("th", {
										className: "py-3.5 px-4",
										children: "Submissions Progress"
									}, void 0, false, {
										fileName: _jsxFileName$1,
										lineNumber: 235,
										columnNumber: 19
									}, this),
									/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("th", {
										className: "py-3.5 pr-6 pl-4 text-right",
										children: "Student Vault"
									}, void 0, false, {
										fileName: _jsxFileName$1,
										lineNumber: 236,
										columnNumber: 19
									}, this)
								] }, void 0, true, {
									fileName: _jsxFileName$1,
									lineNumber: 230,
									columnNumber: 17
								}, this)
							}, void 0, false, {
								fileName: _jsxFileName$1,
								lineNumber: 229,
								columnNumber: 15
							}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("tbody", {
								className: "divide-y divide-border/50",
								children: students.isLoading ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("tr", { children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("td", {
									colSpan: 6,
									className: "py-12 text-center text-sm text-muted-foreground",
									children: "Loading students roster..."
								}, void 0, false, {
									fileName: _jsxFileName$1,
									lineNumber: 242,
									columnNumber: 21
								}, this) }, void 0, false, {
									fileName: _jsxFileName$1,
									lineNumber: 241,
									columnNumber: 19
								}, this) : filteredStudents.length === 0 ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("tr", { children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("td", {
									colSpan: 6,
									className: "py-12 text-center text-sm text-muted-foreground",
									children: searchTerm ? `No students found matching "${searchTerm}".` : "No students registered yet."
								}, void 0, false, {
									fileName: _jsxFileName$1,
									lineNumber: 248,
									columnNumber: 21
								}, this) }, void 0, false, {
									fileName: _jsxFileName$1,
									lineNumber: 247,
									columnNumber: 19
								}, this) : filteredStudents.map((student) => {
									const studentSubmissions = submissions.data?.filter((s) => s.student_id === student.id) ?? [];
									const submittedCount = studentSubmissions.filter((s) => s.status === "submitted").length;
									const checkedCount = studentSubmissions.filter((s) => s.checked_status === "checked").length;
									const initials = getInitials(student.full_name);
									const colorClass = getAvatarColor(student.full_name);
									return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("tr", {
										className: "transition hover:bg-neutral-50/80 dark:hover:bg-neutral-800/50",
										children: [
											/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("td", {
												className: "py-4 pl-6 pr-3",
												children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
													className: `flex size-9 items-center justify-center rounded-full text-xs font-bold shadow-xs ${colorClass}`,
													children: initials
												}, void 0, false, {
													fileName: _jsxFileName$1,
													lineNumber: 274,
													columnNumber: 27
												}, this)
											}, void 0, false, {
												fileName: _jsxFileName$1,
												lineNumber: 273,
												columnNumber: 25
											}, this),
											/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("td", {
												className: "py-4 px-4 font-semibold text-foreground",
												children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Link, {
													to: "/teacher/students/$studentId",
													params: { studentId: student.id },
													className: "transition hover:text-[#0d5c52] hover:underline",
													children: student.full_name || "Unnamed Student"
												}, void 0, false, {
													fileName: _jsxFileName$1,
													lineNumber: 283,
													columnNumber: 27
												}, this)
											}, void 0, false, {
												fileName: _jsxFileName$1,
												lineNumber: 282,
												columnNumber: 25
											}, this),
											/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("td", {
												className: "py-4 px-4 font-mono text-xs text-muted-foreground",
												children: student.enrollment_no ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
													className: "inline-flex rounded-lg bg-neutral-100 px-2 py-0.5 font-medium text-foreground dark:bg-neutral-800",
													children: student.enrollment_no
												}, void 0, false, {
													fileName: _jsxFileName$1,
													lineNumber: 295,
													columnNumber: 29
												}, this) : "—"
											}, void 0, false, {
												fileName: _jsxFileName$1,
												lineNumber: 293,
												columnNumber: 25
											}, this),
											/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("td", {
												className: "py-4 px-4 text-xs text-muted-foreground",
												children: student.email || "No email"
											}, void 0, false, {
												fileName: _jsxFileName$1,
												lineNumber: 304,
												columnNumber: 25
											}, this),
											/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("td", {
												className: "py-4 px-4",
												children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
													className: "space-y-1",
													children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
														className: "flex items-center gap-2 text-xs font-medium text-foreground",
														children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { children: [
															submittedCount,
															" / ",
															totalAssignments,
															" submitted"
														] }, void 0, true, {
															fileName: _jsxFileName$1,
															lineNumber: 312,
															columnNumber: 31
														}, this), checkedCount > 0 && /* @__PURE__ */ (void 0)("span", {
															className: "text-[11px] text-emerald-600 dark:text-emerald-400",
															children: [
																"(",
																checkedCount,
																" graded)"
															]
														}, void 0, true, {
															fileName: _jsxFileName$1,
															lineNumber: 316,
															columnNumber: 33
														}, this)]
													}, void 0, true, {
														fileName: _jsxFileName$1,
														lineNumber: 311,
														columnNumber: 29
													}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
														className: "h-1.5 w-32 rounded-full bg-neutral-100 overflow-hidden dark:bg-neutral-800",
														children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
															className: "h-full rounded-full bg-[#0d5c52]",
															style: { width: `${totalAssignments > 0 ? Math.min(100, submittedCount / totalAssignments * 100) : 0}%` }
														}, void 0, false, {
															fileName: _jsxFileName$1,
															lineNumber: 322,
															columnNumber: 31
														}, this)
													}, void 0, false, {
														fileName: _jsxFileName$1,
														lineNumber: 321,
														columnNumber: 29
													}, this)]
												}, void 0, true, {
													fileName: _jsxFileName$1,
													lineNumber: 310,
													columnNumber: 27
												}, this)
											}, void 0, false, {
												fileName: _jsxFileName$1,
												lineNumber: 309,
												columnNumber: 25
											}, this),
											/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("td", {
												className: "py-4 pr-6 pl-4 text-right",
												children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Link, {
													to: "/teacher/students/$studentId",
													params: { studentId: student.id },
													className: "inline-flex items-center gap-1.5 rounded-xl bg-[#0d5c52] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#0a4840]",
													children: [
														/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(FolderLock, { className: "size-3.5" }, void 0, false, {
															fileName: _jsxFileName$1,
															lineNumber: 343,
															columnNumber: 29
														}, this),
														"View Student Vault",
														/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(ArrowRight, { className: "size-3.5" }, void 0, false, {
															fileName: _jsxFileName$1,
															lineNumber: 345,
															columnNumber: 29
														}, this)
													]
												}, void 0, true, {
													fileName: _jsxFileName$1,
													lineNumber: 338,
													columnNumber: 27
												}, this)
											}, void 0, false, {
												fileName: _jsxFileName$1,
												lineNumber: 337,
												columnNumber: 25
											}, this)
										]
									}, student.id, true, {
										fileName: _jsxFileName$1,
										lineNumber: 268,
										columnNumber: 23
									}, this);
								})
							}, void 0, false, {
								fileName: _jsxFileName$1,
								lineNumber: 239,
								columnNumber: 15
							}, this)]
						}, void 0, true, {
							fileName: _jsxFileName$1,
							lineNumber: 228,
							columnNumber: 13
						}, this)
					}, void 0, false, {
						fileName: _jsxFileName$1,
						lineNumber: 227,
						columnNumber: 11
					}, this)
				}, void 0, false, {
					fileName: _jsxFileName$1,
					lineNumber: 226,
					columnNumber: 9
				}, this)
			]
		}, void 0, true, {
			fileName: _jsxFileName$1,
			lineNumber: 120,
			columnNumber: 7
		}, this)
	}, void 0, false, {
		fileName: _jsxFileName$1,
		lineNumber: 116,
		columnNumber: 5
	}, this);
}
var _jsxFileName = "/app/applet/src/routes/_authenticated/teacher/students.$studentId.tsx";
var Route = createFileRoute("/_authenticated/teacher/students/$studentId")({
	head: () => ({ meta: [{ title: "Student Vault — AssignEase" }, {
		name: "description",
		content: "Access all assignment submissions and scanned answer pages for this student."
	}] }),
	component: StudentVaultPage
});
function StudentVaultPage() {
	const { studentId } = Route.useParams();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { data: teacherProfile, isLoading: profileLoading } = useProfile();
	(0, import_react.useEffect)(() => {
		if (!profileLoading && teacherProfile && teacherProfile.role !== "teacher") navigate({ to: "/student" });
	}, [
		profileLoading,
		teacherProfile,
		navigate
	]);
	const studentQuery = useQuery({
		queryKey: ["student-profile", studentId],
		queryFn: async () => {
			const { data, error } = await supabase.from("profiles").select("*").eq("id", studentId).maybeSingle();
			if (error) throw error;
			return data;
		}
	});
	const assignmentsQuery = useQuery({
		queryKey: ["assignments"],
		queryFn: listAssignments
	});
	const studentSubmissionsQuery = useQuery({
		queryKey: [
			"submissions",
			"student",
			studentId
		],
		queryFn: async () => {
			const { data, error } = await supabase.from("submissions").select("*").eq("student_id", studentId);
			if (error) throw error;
			return data ?? [];
		}
	});
	const studentPagesQuery = useQuery({
		queryKey: ["student-pages", studentId],
		queryFn: async () => {
			const { data, error } = await supabase.from("submission_pages").select("*, submission:submissions!inner(student_id)").eq("submission.student_id", studentId);
			if (error) {
				const { data: simpleData } = await supabase.from("submission_pages").select("*");
				return simpleData ?? [];
			}
			return data ?? [];
		}
	});
	(0, import_react.useEffect)(() => {
		const channel = supabase.channel(`student-vault-live-${studentId}`).on("postgres_changes", {
			event: "*",
			schema: "public",
			table: "submissions",
			filter: `student_id=eq.${studentId}`
		}, () => {
			queryClient.invalidateQueries({ queryKey: [
				"submissions",
				"student",
				studentId
			] });
			queryClient.invalidateQueries({ queryKey: ["submissions"] });
		}).on("postgres_changes", {
			event: "*",
			schema: "public",
			table: "submission_pages"
		}, () => {
			queryClient.invalidateQueries({ queryKey: ["student-pages", studentId] });
			queryClient.invalidateQueries({ queryKey: ["pages"] });
		}).on("postgres_changes", {
			event: "*",
			schema: "public",
			table: "question_marks"
		}, () => {
			queryClient.invalidateQueries({ queryKey: [
				"submissions",
				"student",
				studentId
			] });
		}).subscribe();
		return () => {
			supabase.removeChannel(channel);
		};
	}, [studentId, queryClient]);
	const openSubmissionMutation = useMutation({
		mutationFn: async (assignmentId) => {
			return await getOrCreateSubmission(assignmentId, studentId);
		},
		onSuccess: (sub) => {
			navigate({
				to: "/teacher/grade/$submissionId",
				params: { submissionId: sub.id }
			});
		},
		onError: (err) => {
			toast.error(err.message || "Failed to open student submission canvas");
		}
	});
	const student = studentQuery.data;
	const assignments = assignmentsQuery.data ?? [];
	const submissions = studentSubmissionsQuery.data ?? [];
	const allPages = studentPagesQuery.data ?? [];
	const totalAssignments = assignments.length;
	const submittedCount = submissions.filter((s) => s.status === "submitted").length;
	const checkedCount = submissions.filter((s) => s.checked_status === "checked").length;
	const totalScored = submissions.reduce((acc, curr) => acc + (curr.total_marks ?? 0), 0);
	assignments.reduce((acc, curr) => acc + (curr.total_questions ? curr.total_questions * 5 : 25), 0);
	function getAvatarColor(name) {
		const colors = [
			"bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
			"bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
			"bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300",
			"bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300",
			"bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300",
			"bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300"
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
		profile: teacherProfile ?? null,
		breadcrumbs: [
			{
				label: "Teacher Dashboard",
				href: "/teacher"
			},
			{
				label: "Students Roster",
				href: "/teacher/students"
			},
			{ label: student ? `${student.full_name}'s Vault` : "Student Vault" }
		],
		children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
			className: "space-y-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Link, {
					to: "/teacher/students",
					className: "inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition hover:text-foreground",
					children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(ArrowLeft, { className: "size-3.5" }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 215,
						columnNumber: 13
					}, this), "Back to Student Roster"]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 211,
					columnNumber: 11
				}, this) }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 210,
					columnNumber: 9
				}, this),
				/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
					className: "rounded-3xl border border-border/80 bg-white p-6 shadow-xs dark:bg-neutral-900 sm:p-7",
					children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
						className: "flex flex-col gap-6 md:flex-row md:items-center md:justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
							className: "flex items-center gap-5",
							children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
								className: `flex size-16 shrink-0 items-center justify-center rounded-2xl text-xl font-bold shadow-xs sm:size-20 sm:text-2xl ${getAvatarColor(student?.full_name ?? "Student")}`,
								children: getInitials(student?.full_name ?? null)
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 225,
								columnNumber: 15
							}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
								className: "flex items-center gap-2.5",
								children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("h1", {
									className: "font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl",
									children: student?.full_name || "Student Vault"
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 234,
									columnNumber: 19
								}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
									className: "inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
									children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(FolderLock, { className: "size-3" }, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 238,
										columnNumber: 21
									}, this), "Vault Active"]
								}, void 0, true, {
									fileName: _jsxFileName,
									lineNumber: 237,
									columnNumber: 19
								}, this)]
							}, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 233,
								columnNumber: 17
							}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
								className: "mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground",
								children: [
									/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
										className: "font-mono font-medium text-foreground",
										children: ["Enrollment: ", student?.enrollment_no || "N/A"]
									}, void 0, true, {
										fileName: _jsxFileName,
										lineNumber: 244,
										columnNumber: 19
									}, this),
									/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { children: "•" }, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 247,
										columnNumber: 19
									}, this),
									/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
										className: "inline-flex items-center gap-1",
										children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Mail, { className: "size-3.5" }, void 0, false, {
											fileName: _jsxFileName,
											lineNumber: 249,
											columnNumber: 21
										}, this), student?.email || "No email"]
									}, void 0, true, {
										fileName: _jsxFileName,
										lineNumber: 248,
										columnNumber: 19
									}, this),
									student?.created_at && /* @__PURE__ */ (void 0)(import_jsx_dev_runtime.Fragment, { children: [/* @__PURE__ */ (void 0)("span", { children: "•" }, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 254,
										columnNumber: 23
									}, this), /* @__PURE__ */ (void 0)("span", {
										className: "inline-flex items-center gap-1",
										children: [
											/* @__PURE__ */ (void 0)(Calendar, { className: "size-3.5" }, void 0, false, {
												fileName: _jsxFileName,
												lineNumber: 256,
												columnNumber: 25
											}, this),
											"Joined ",
											new Date(student.created_at).toLocaleDateString()
										]
									}, void 0, true, {
										fileName: _jsxFileName,
										lineNumber: 255,
										columnNumber: 23
									}, this)] }, void 0, true, {
										fileName: _jsxFileName,
										lineNumber: 253,
										columnNumber: 21
									}, this)
								]
							}, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 243,
								columnNumber: 17
							}, this)] }, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 232,
								columnNumber: 15
							}, this)]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 224,
							columnNumber: 13
						}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
							className: "grid grid-cols-2 gap-3 sm:grid-cols-4 md:gap-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
									className: "rounded-2xl border border-border/70 bg-[#FDFBF7] p-3 text-center dark:bg-neutral-800/60",
									children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
										className: "font-display text-lg font-bold text-foreground",
										children: totalAssignments
									}, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 268,
										columnNumber: 17
									}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
										className: "text-[11px] font-medium text-muted-foreground",
										children: "Total Assigned"
									}, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 271,
										columnNumber: 17
									}, this)]
								}, void 0, true, {
									fileName: _jsxFileName,
									lineNumber: 267,
									columnNumber: 15
								}, this),
								/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
									className: "rounded-2xl border border-border/70 bg-[#FDFBF7] p-3 text-center dark:bg-neutral-800/60",
									children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
										className: "font-display text-lg font-bold text-emerald-600 dark:text-emerald-400",
										children: submittedCount
									}, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 275,
										columnNumber: 17
									}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
										className: "text-[11px] font-medium text-muted-foreground",
										children: "Submitted"
									}, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 278,
										columnNumber: 17
									}, this)]
								}, void 0, true, {
									fileName: _jsxFileName,
									lineNumber: 274,
									columnNumber: 15
								}, this),
								/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
									className: "rounded-2xl border border-border/70 bg-[#FDFBF7] p-3 text-center dark:bg-neutral-800/60",
									children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
										className: "font-display text-lg font-bold text-amber-600 dark:text-amber-400",
										children: checkedCount
									}, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 282,
										columnNumber: 17
									}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
										className: "text-[11px] font-medium text-muted-foreground",
										children: "Graded & Checked"
									}, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 285,
										columnNumber: 17
									}, this)]
								}, void 0, true, {
									fileName: _jsxFileName,
									lineNumber: 281,
									columnNumber: 15
								}, this),
								/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
									className: "rounded-2xl border border-border/70 bg-[#FDFBF7] p-3 text-center dark:bg-neutral-800/60",
									children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
										className: "font-display text-lg font-bold text-foreground",
										children: checkedCount > 0 ? `${totalScored} pts` : "—"
									}, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 291,
										columnNumber: 17
									}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
										className: "text-[11px] font-medium text-muted-foreground",
										children: "Points Scored"
									}, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 294,
										columnNumber: 17
									}, this)]
								}, void 0, true, {
									fileName: _jsxFileName,
									lineNumber: 290,
									columnNumber: 15
								}, this)
							]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 266,
							columnNumber: 13
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 222,
						columnNumber: 11
					}, this)
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 221,
					columnNumber: 9
				}, this),
				/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
					className: "space-y-4",
					children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
						className: "flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("h2", {
							className: "font-display text-xl font-bold tracking-tight text-foreground",
							children: "All Assignment Records & Answer Scans"
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 304,
							columnNumber: 15
						}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", {
							className: "text-xs text-muted-foreground",
							children: "Click \"View Answers & Grade\" to inspect every scanned answer page in the high-res grading workspace."
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 307,
							columnNumber: 15
						}, this)] }, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 303,
							columnNumber: 13
						}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
							className: "text-xs font-semibold text-muted-foreground",
							children: [assignments.length, " Total Assignments"]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 312,
							columnNumber: 13
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 302,
						columnNumber: 11
					}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
						className: "space-y-3",
						children: assignmentsQuery.isLoading ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
							className: "flex items-center justify-center rounded-3xl border border-border/80 bg-white p-12 shadow-xs dark:bg-neutral-900",
							children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
								className: "flex items-center gap-3 text-sm text-muted-foreground",
								children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(LoaderCircle, { className: "size-5 animate-spin text-[#0d5c52]" }, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 322,
									columnNumber: 19
								}, this), "Loading student assignment vault..."]
							}, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 321,
								columnNumber: 17
							}, this)
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 320,
							columnNumber: 15
						}, this) : assignments.length === 0 ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
							className: "rounded-3xl border border-border/80 bg-white p-12 text-center shadow-xs dark:bg-neutral-900",
							children: [
								/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(FileText, { className: "mx-auto size-8 text-muted-foreground/60" }, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 328,
									columnNumber: 17
								}, this),
								/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("h3", {
									className: "mt-3 text-sm font-semibold text-foreground",
									children: "No assignments created"
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 329,
									columnNumber: 17
								}, this),
								/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", {
									className: "mt-1 text-xs text-muted-foreground",
									children: "Create assignments from the teacher dashboard to track this student's submissions."
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 332,
									columnNumber: 17
								}, this)
							]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 327,
							columnNumber: 15
						}, this) : assignments.map((assignment) => {
							const submission = submissions.find((s) => s.assignment_id === assignment.id);
							const isSubmitted = submission?.status === "submitted";
							const isChecked = submission?.checked_status === "checked" || submission?.total_marks !== null && submission?.total_marks !== void 0;
							const pageCount = submission ? allPages.filter((p) => p.submission_id === submission.id).length : 0;
							const maxAssignmentMarks = assignment.total_questions ? assignment.total_questions * 5 : 25;
							return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
								className: "flex flex-col gap-4 rounded-3xl border border-border/80 bg-white p-5 shadow-xs transition hover:border-[#0d5c52]/40 dark:bg-neutral-900 sm:flex-row sm:items-center sm:justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
									className: "flex items-start gap-4",
									children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
										className: "flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#0d5c52]/10 font-display text-sm font-bold text-[#0d5c52] dark:bg-emerald-950/60 dark:text-emerald-400",
										children: ["#", assignment.assignment_no]
									}, void 0, true, {
										fileName: _jsxFileName,
										lineNumber: 360,
										columnNumber: 23
									}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
										className: "flex flex-wrap items-center gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("h3", {
											className: "font-display text-base font-bold text-foreground",
											children: assignment.title
										}, void 0, false, {
											fileName: _jsxFileName,
											lineNumber: 365,
											columnNumber: 27
										}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
											className: `inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${assignment.is_open ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300" : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"}`,
											children: assignment.is_open ? "Window Open" : "Closed"
										}, void 0, false, {
											fileName: _jsxFileName,
											lineNumber: 368,
											columnNumber: 27
										}, this)]
									}, void 0, true, {
										fileName: _jsxFileName,
										lineNumber: 364,
										columnNumber: 25
									}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
										className: "mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground",
										children: [
											/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { children: [assignment.total_questions, " Questions"] }, void 0, true, {
												fileName: _jsxFileName,
												lineNumber: 380,
												columnNumber: 27
											}, this),
											/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { children: "•" }, void 0, false, {
												fileName: _jsxFileName,
												lineNumber: 381,
												columnNumber: 27
											}, this),
											/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
												className: "inline-flex items-center gap-1 font-medium text-foreground",
												children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Layers, { className: "size-3.5 text-muted-foreground" }, void 0, false, {
													fileName: _jsxFileName,
													lineNumber: 383,
													columnNumber: 29
												}, this), pageCount > 0 ? `${pageCount} answer scan${pageCount === 1 ? "" : "s"} uploaded` : "0 scans uploaded"]
											}, void 0, true, {
												fileName: _jsxFileName,
												lineNumber: 382,
												columnNumber: 27
											}, this),
											submission?.submitted_at && /* @__PURE__ */ (void 0)(import_jsx_dev_runtime.Fragment, { children: [/* @__PURE__ */ (void 0)("span", { children: "•" }, void 0, false, {
												fileName: _jsxFileName,
												lineNumber: 390,
												columnNumber: 31
											}, this), /* @__PURE__ */ (void 0)("span", { children: [
												"Submitted:",
												" ",
												new Date(submission.submitted_at).toLocaleDateString("en-GB", {
													day: "2-digit",
													month: "short",
													hour: "2-digit",
													minute: "2-digit"
												})
											] }, void 0, true, {
												fileName: _jsxFileName,
												lineNumber: 391,
												columnNumber: 31
											}, this)] }, void 0, true, {
												fileName: _jsxFileName,
												lineNumber: 389,
												columnNumber: 29
											}, this)
										]
									}, void 0, true, {
										fileName: _jsxFileName,
										lineNumber: 379,
										columnNumber: 25
									}, this)] }, void 0, true, {
										fileName: _jsxFileName,
										lineNumber: 363,
										columnNumber: 23
									}, this)]
								}, void 0, true, {
									fileName: _jsxFileName,
									lineNumber: 359,
									columnNumber: 21
								}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
									className: "flex items-center gap-3",
									children: [isChecked ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
										className: "flex items-center gap-2 rounded-2xl bg-amber-50 px-4 py-2 text-xs font-bold text-amber-900 dark:bg-amber-950/50 dark:text-amber-300",
										children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(CircleCheck, { className: "size-4 text-amber-600 dark:text-amber-400" }, void 0, false, {
											fileName: _jsxFileName,
											lineNumber: 410,
											columnNumber: 27
										}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { children: [
											"Checked • ",
											submission?.total_marks ?? 0,
											" / ",
											maxAssignmentMarks,
											" Marks"
										] }, void 0, true, {
											fileName: _jsxFileName,
											lineNumber: 411,
											columnNumber: 27
										}, this)]
									}, void 0, true, {
										fileName: _jsxFileName,
										lineNumber: 409,
										columnNumber: 25
									}, this) : isSubmitted ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
										className: "flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300",
										children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { className: "size-2 rounded-full bg-emerald-500 animate-pulse" }, void 0, false, {
											fileName: _jsxFileName,
											lineNumber: 417,
											columnNumber: 27
										}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { children: "Submitted • Pending Grading" }, void 0, false, {
											fileName: _jsxFileName,
											lineNumber: 418,
											columnNumber: 27
										}, this)]
									}, void 0, true, {
										fileName: _jsxFileName,
										lineNumber: 416,
										columnNumber: 25
									}, this) : /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
										className: "flex items-center gap-2 rounded-2xl bg-neutral-100 px-4 py-2 text-xs font-medium text-muted-foreground dark:bg-neutral-800",
										children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { className: "size-2 rounded-full bg-red-400" }, void 0, false, {
											fileName: _jsxFileName,
											lineNumber: 422,
											columnNumber: 27
										}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { children: "Not submitted yet" }, void 0, false, {
											fileName: _jsxFileName,
											lineNumber: 423,
											columnNumber: 27
										}, this)]
									}, void 0, true, {
										fileName: _jsxFileName,
										lineNumber: 421,
										columnNumber: 25
									}, this), submission ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Link, {
										to: "/teacher/grade/$submissionId",
										params: { submissionId: submission.id },
										className: "inline-flex items-center gap-2 rounded-2xl bg-[#0d5c52] px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#0a4840]",
										children: [
											/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Eye, { className: "size-3.5" }, void 0, false, {
												fileName: _jsxFileName,
												lineNumber: 434,
												columnNumber: 27
											}, this),
											isChecked ? "Review Answers & Marks" : "View Answers & Grade",
											/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(ChevronRight, { className: "size-3.5" }, void 0, false, {
												fileName: _jsxFileName,
												lineNumber: 436,
												columnNumber: 27
											}, this)
										]
									}, void 0, true, {
										fileName: _jsxFileName,
										lineNumber: 429,
										columnNumber: 25
									}, this) : /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", {
										type: "button",
										disabled: openSubmissionMutation.isPending,
										onClick: () => openSubmissionMutation.mutate(assignment.id),
										className: "inline-flex items-center gap-2 rounded-2xl border border-border/80 bg-white px-4 py-2.5 text-xs font-semibold text-foreground shadow-xs transition hover:bg-neutral-50 dark:bg-neutral-800 dark:hover:bg-neutral-700",
										children: [openSubmissionMutation.isPending ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(LoaderCircle, { className: "size-3.5 animate-spin" }, void 0, false, {
											fileName: _jsxFileName,
											lineNumber: 446,
											columnNumber: 29
										}, this) : /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Eye, { className: "size-3.5 text-muted-foreground" }, void 0, false, {
											fileName: _jsxFileName,
											lineNumber: 448,
											columnNumber: 29
										}, this), "Open Submission Canvas"]
									}, void 0, true, {
										fileName: _jsxFileName,
										lineNumber: 439,
										columnNumber: 25
									}, this)]
								}, void 0, true, {
									fileName: _jsxFileName,
									lineNumber: 407,
									columnNumber: 21
								}, this)]
							}, assignment.id, true, {
								fileName: _jsxFileName,
								lineNumber: 354,
								columnNumber: 19
							}, this);
						})
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 318,
						columnNumber: 11
					}, this)]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 301,
					columnNumber: 9
				}, this)
			]
		}, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 208,
			columnNumber: 7
		}, this)
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 200,
		columnNumber: 5
	}, this);
}
var IndexRoute = Route$11.update({
	id: "/",
	path: "/",
	getParentRoute: () => Route$12
});
var AuthenticatedRouteRoute = Route$10.update({
	id: "/_authenticated",
	getParentRoute: () => Route$12
});
var CompleteProfileRoute = Route$9.update({
	id: "/complete-profile",
	path: "/complete-profile",
	getParentRoute: () => Route$12
});
var RegisterRoute = Route$8.update({
	id: "/register",
	path: "/register",
	getParentRoute: () => Route$12
});
var ResetPasswordRoute = Route$7.update({
	id: "/reset-password",
	path: "/reset-password",
	getParentRoute: () => Route$12
});
var AuthenticatedStudentIndexRoute = Route$6.update({
	id: "/student/",
	path: "/student/",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedTeacherIndexRoute = Route$5.update({
	id: "/teacher/",
	path: "/teacher/",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedStudentAssignmentsAssignmentIdRoute = Route$4.update({
	id: "/student/assignments/$assignmentId",
	path: "/student/assignments/$assignmentId",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedTeacherAssignmentsAssignmentIdRoute = Route$3.update({
	id: "/teacher/assignments/$assignmentId",
	path: "/teacher/assignments/$assignmentId",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedTeacherGradeSubmissionIdRoute = Route$2.update({
	id: "/teacher/grade/$submissionId",
	path: "/teacher/grade/$submissionId",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedTeacherStudentsIndexRoute = Route$1.update({
	id: "/teacher/students/",
	path: "/teacher/students/",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedRouteRouteChildren = {
	AuthenticatedStudentIndexRoute,
	AuthenticatedTeacherIndexRoute,
	AuthenticatedStudentAssignmentsAssignmentIdRoute,
	AuthenticatedTeacherAssignmentsAssignmentIdRoute,
	AuthenticatedTeacherGradeSubmissionIdRoute,
	AuthenticatedTeacherStudentsStudentIdRoute: Route.update({
		id: "/teacher/students/$studentId",
		path: "/teacher/students/$studentId",
		getParentRoute: () => AuthenticatedRouteRoute
	}),
	AuthenticatedTeacherStudentsIndexRoute
};
var rootRouteChildren = {
	IndexRoute,
	AuthenticatedRouteRoute: AuthenticatedRouteRoute._addFileChildren(AuthenticatedRouteRouteChildren),
	CompleteProfileRoute,
	RegisterRoute,
	ResetPasswordRoute
};
var routeTree = Route$12._addFileChildren(rootRouteChildren)._addFileTypes();
var router_exports = /* @__PURE__ */ __exportAll({ getRouter: () => getRouter });
var getRouter = () => {
	const queryClient = new QueryClient();
	return createRouter({
		routeTree,
		context: { queryClient },
		scrollRestoration: true,
		defaultPreloadStaleTime: 0
	});
};
//#endregion
export { listPages as C, listAssignments as S, listSubmissions as T, deletePage as _, AssignEaseLogo as a, getCurrentProfile as b, DialogFooter as c, Button as d, cn as f, createMyProfile as g, useSignedUrl as h, AppShell as i, DialogHeader as l, useProfile as m, Route$2 as n, Dialog as o, Route$8 as p, Route$4 as r, DialogContent as s, router_exports as t, DialogTitle as u, ensureProfile as v, listStudents as w, getOrCreateSubmission as x, getAssignment as y };
