import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { _ as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as supabase } from "./client-BZqcN8FK.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as require_jsx_dev_runtime } from "../_libs/react.mjs";
import { S as LoaderCircle, a as UserRoundPen } from "../_libs/lucide-react.mjs";
import { b as getCurrentProfile, g as createMyProfile } from "./router-DbtMI3nh.mjs";
import { n as AuthHero, r as AuthShell, t as AuthCard } from "./auth-shell-CTNDVbdg.mjs";
import { t as AuthRoleTabs } from "./auth-role-tabs-p2Hv9SLt.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/complete-profile-BdfzNIzM.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_dev_runtime = require_jsx_dev_runtime();
var _jsxFileName = "/app/applet/src/routes/complete-profile.tsx?tsr-split=component";
function CompleteProfilePage() {
	const navigate = useNavigate();
	const [role, setRole] = (0, import_react.useState)("student");
	const [fullName, setFullName] = (0, import_react.useState)("");
	const [enrollmentNo, setEnrollmentNo] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		let active = true;
		(async () => {
			const { data } = await supabase.auth.getUser();
			if (!active) return;
			if (!data.user) {
				navigate({
					to: "/",
					replace: true
				});
				return;
			}
			const profile = await getCurrentProfile();
			if (!active || !profile) return;
			navigate({
				to: profile.role === "teacher" ? "/teacher" : "/student",
				replace: true
			});
		})();
		return () => {
			active = false;
		};
	}, [navigate]);
	async function save(e) {
		e.preventDefault();
		setError(null);
		if (fullName.trim().length < 2) return setError("Please enter your full name.");
		if (role === "student" && !enrollmentNo.trim()) return setError("Please enter your enrollment number.");
		setBusy(true);
		try {
			const profile = await createMyProfile({
				role,
				fullName,
				enrollmentNo: role === "student" ? enrollmentNo : null
			});
			toast.success(`Welcome, ${profile.full_name}`);
			navigate({
				to: profile.role === "teacher" ? "/teacher" : "/student",
				replace: true
			});
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not save your details.");
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(AuthShell, { children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(AuthHero, {}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 65,
		columnNumber: 7
	}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(AuthCard, { children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
		className: "mb-4 text-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
				className: "mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950",
				children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(UserRoundPen, { className: "size-6 text-[#0d5c52] dark:text-emerald-400" }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 69,
					columnNumber: 13
				}, this)
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 68,
				columnNumber: 11
			}, this),
			/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("h1", {
				className: "font-display text-xl font-bold text-[#14423b] dark:text-emerald-100",
				children: "Complete Your Profile"
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 71,
				columnNumber: 11
			}, this),
			/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", {
				className: "mt-1 text-xs text-muted-foreground",
				children: "Provide your details so your teacher and peers see your name."
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 74,
				columnNumber: 11
			}, this)
		]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 67,
		columnNumber: 9
	}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("form", {
		onSubmit: save,
		className: "space-y-3.5",
		children: [
			/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
				className: "mb-1",
				children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(AuthRoleTabs, {
					value: role,
					onChange: setRole
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 81,
					columnNumber: 13
				}, this)
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 80,
				columnNumber: 11
			}, this),
			/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
				className: "w-full",
				children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("input", {
					id: "profile-fullname",
					required: true,
					maxLength: 100,
					value: fullName,
					onChange: (e) => setFullName(e.target.value),
					placeholder: "Your Full Name",
					className: "h-12 w-full rounded-full bg-[#13463F] px-6 text-sm font-medium text-white placeholder:text-emerald-100/60 shadow-xs outline-hidden transition-all focus:bg-[#0f3d37] focus:ring-2 focus:ring-emerald-400/60 dark:bg-[#113e38] dark:placeholder:text-emerald-200/50"
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 85,
					columnNumber: 13
				}, this)
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 84,
				columnNumber: 11
			}, this),
			role === "student" && /* @__PURE__ */ (void 0)("div", {
				className: "w-full",
				children: /* @__PURE__ */ (void 0)("input", {
					id: "profile-enrollment",
					required: true,
					maxLength: 40,
					value: enrollmentNo,
					onChange: (e) => setEnrollmentNo(e.target.value),
					placeholder: "Enrollment Number (e.g. 014202)",
					className: "h-12 w-full rounded-full bg-[#13463F] px-6 text-sm font-medium text-white placeholder:text-emerald-100/60 shadow-xs outline-hidden transition-all focus:bg-[#0f3d37] focus:ring-2 focus:ring-emerald-400/60 dark:bg-[#113e38] dark:placeholder:text-emerald-200/50"
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 89,
					columnNumber: 15
				}, this)
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 88,
				columnNumber: 34
			}, this),
			error && /* @__PURE__ */ (void 0)("div", {
				className: "rounded-2xl border border-red-200/50 bg-red-50/90 px-4 py-2 text-center text-xs font-medium text-red-700 shadow-xs dark:border-red-900/40 dark:bg-red-950/60 dark:text-red-300",
				children: error
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 92,
				columnNumber: 21
			}, this),
			/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
				className: "pt-1",
				children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", {
					type: "submit",
					disabled: busy,
					className: "flex h-12 w-full items-center justify-center rounded-full bg-[#0F685C] px-6 text-base font-semibold text-white shadow-md shadow-[#0d5c52]/20 transition-all hover:bg-[#0c564c] active:scale-[0.99] disabled:opacity-70 dark:bg-[#107568] dark:hover:bg-[#0d5c52]",
					children: busy ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(LoaderCircle, { className: "size-4 animate-spin text-white" }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 99,
							columnNumber: 19
						}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { children: "Saving…" }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 100,
							columnNumber: 19
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 98,
						columnNumber: 23
					}, this) : "Save & Continue"
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 97,
					columnNumber: 13
				}, this)
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 96,
				columnNumber: 11
			}, this)
		]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 79,
		columnNumber: 9
	}, this)] }, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 66,
		columnNumber: 7
	}, this)] }, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 64,
		columnNumber: 10
	}, this);
}
//#endregion
export { CompleteProfilePage as component };
