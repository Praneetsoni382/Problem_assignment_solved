import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as supabase } from "./client-BZqcN8FK.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as require_jsx_dev_runtime } from "../_libs/react.mjs";
import { S as LoaderCircle, b as MailCheck } from "../_libs/lucide-react.mjs";
import { p as Route$8 } from "./router-DbtMI3nh.mjs";
import { n as AuthHero, r as AuthShell, t as AuthCard } from "./auth-shell-CTNDVbdg.mjs";
import { t as AuthRoleTabs } from "./auth-role-tabs-p2Hv9SLt.mjs";
import { t as PasswordInput } from "./password-input-DvUw5CW4.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/register-BULzZvJ0.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_dev_runtime = require_jsx_dev_runtime();
var _jsxFileName = "/app/applet/src/routes/register.tsx?tsr-split=component";
function RegisterPage() {
	const search = Route$8.useSearch();
	const [role, setRole] = (0, import_react.useState)(search.role);
	const [fullName, setFullName] = (0, import_react.useState)("");
	const [enrollmentNo, setEnrollmentNo] = (0, import_react.useState)("");
	const [email, setEmail] = (0, import_react.useState)(search.email);
	const [password, setPassword] = (0, import_react.useState)("");
	const [confirm, setConfirm] = (0, import_react.useState)("");
	const [sent, setSent] = (0, import_react.useState)(false);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	async function register(e) {
		e.preventDefault();
		setError(null);
		if (fullName.trim().length < 2) return setError("Please enter your full name.");
		if (role === "student" && enrollmentNo.trim().length < 1) return setError("Please enter your enrollment number.");
		if (password.length < 8) return setError("Password must be at least 8 characters.");
		if (password !== confirm) return setError("Passwords don't match.");
		setBusy(true);
		const cleanEmail = email.trim().toLowerCase();
		const { data, error: signUpError } = await supabase.auth.signUp({
			email: cleanEmail,
			password,
			options: {
				emailRedirectTo: window.location.origin,
				data: {
					role,
					full_name: fullName.trim(),
					enrollment_no: role === "student" ? enrollmentNo.trim() : null
				}
			}
		});
		setBusy(false);
		if (signUpError) {
			setError(signUpError.message.toLowerCase().includes("already registered") ? "That email is already registered. Try signing in instead." : signUpError.message);
			return;
		}
		if (data.session) {
			toast.success("Account created successfully!");
			window.location.assign("/");
			return;
		}
		setSent(true);
		toast.success("Verification link sent to your email!");
	}
	if (sent) return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(AuthShell, { children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(AuthHero, {}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 60,
		columnNumber: 9
	}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(AuthCard, {
		className: "text-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
				className: "mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950",
				children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(MailCheck, { className: "size-8 text-[#0d5c52] dark:text-emerald-400" }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 63,
					columnNumber: 13
				}, this)
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 62,
				columnNumber: 11
			}, this),
			/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("h1", {
				className: "font-display text-xl font-bold text-[#14423b] dark:text-emerald-100",
				children: "Check Your Email"
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 65,
				columnNumber: 11
			}, this),
			/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", {
				className: "mt-2 text-xs text-muted-foreground",
				children: [
					"We sent a verification link to",
					" ",
					/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
						className: "font-medium text-foreground",
						children: email
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 70,
						columnNumber: 13
					}, this),
					". Click it to confirm your account, then sign in with your password."
				]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 68,
				columnNumber: 11
			}, this),
			/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
				className: "mt-6",
				children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Link, {
					to: "/",
					className: "inline-flex h-12 w-full items-center justify-center rounded-full bg-[#0F685C] px-6 text-sm font-semibold text-white shadow-md shadow-[#0d5c52]/20 hover:bg-[#0c564c]",
					children: "Back to Sign In"
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 74,
					columnNumber: 13
				}, this)
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 73,
				columnNumber: 11
			}, this)
		]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 61,
		columnNumber: 9
	}, this)] }, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 59,
		columnNumber: 12
	}, this);
	return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(AuthShell, { children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(AuthHero, {}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 83,
		columnNumber: 7
	}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(AuthCard, { children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("form", {
		onSubmit: register,
		className: "w-full space-y-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
				className: "mb-1",
				children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(AuthRoleTabs, {
					value: role,
					onChange: setRole
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 89,
					columnNumber: 13
				}, this)
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 88,
				columnNumber: 11
			}, this),
			/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
				className: "w-full",
				children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("input", {
					id: "register-fullname",
					required: true,
					maxLength: 100,
					value: fullName,
					onChange: (e) => setFullName(e.target.value),
					placeholder: "Full Name",
					className: "h-12 w-full rounded-full bg-[#13463F] px-6 text-sm font-medium text-white placeholder:text-emerald-100/60 shadow-xs outline-hidden transition-all focus:bg-[#0f3d37] focus:ring-2 focus:ring-emerald-400/60 dark:bg-[#113e38] dark:placeholder:text-emerald-200/50"
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 94,
					columnNumber: 13
				}, this)
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 93,
				columnNumber: 11
			}, this),
			role === "student" && /* @__PURE__ */ (void 0)("div", {
				className: "w-full",
				children: /* @__PURE__ */ (void 0)("input", {
					id: "register-enrollment",
					required: true,
					maxLength: 40,
					value: enrollmentNo,
					onChange: (e) => setEnrollmentNo(e.target.value),
					placeholder: "Enrollment Number (e.g. 014202)",
					className: "h-12 w-full rounded-full bg-[#13463F] px-6 text-sm font-medium text-white placeholder:text-emerald-100/60 shadow-xs outline-hidden transition-all focus:bg-[#0f3d37] focus:ring-2 focus:ring-emerald-400/60 dark:bg-[#113e38] dark:placeholder:text-emerald-200/50"
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 99,
					columnNumber: 15
				}, this)
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 98,
				columnNumber: 34
			}, this),
			/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
				className: "w-full",
				children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("input", {
					id: "register-email",
					type: "email",
					required: true,
					autoComplete: "email",
					value: email,
					onChange: (e) => setEmail(e.target.value),
					placeholder: "Email address",
					className: "h-12 w-full rounded-full bg-[#13463F] px-6 text-sm font-medium text-white placeholder:text-emerald-100/60 shadow-xs outline-hidden transition-all focus:bg-[#0f3d37] focus:ring-2 focus:ring-emerald-400/60 dark:bg-[#113e38] dark:placeholder:text-emerald-200/50"
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 104,
					columnNumber: 13
				}, this)
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 103,
				columnNumber: 11
			}, this),
			/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
				className: "w-full",
				children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(PasswordInput, {
					id: "register-password",
					required: true,
					autoComplete: "new-password",
					value: password,
					onChange: (e) => setPassword(e.target.value),
					placeholder: "Create Password (min 8 chars)"
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 109,
					columnNumber: 13
				}, this)
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 108,
				columnNumber: 11
			}, this),
			/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
				className: "w-full",
				children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(PasswordInput, {
					id: "register-confirm",
					required: true,
					autoComplete: "new-password",
					value: confirm,
					onChange: (e) => setConfirm(e.target.value),
					placeholder: "Confirm Password"
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 114,
					columnNumber: 13
				}, this)
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 113,
				columnNumber: 11
			}, this),
			error && /* @__PURE__ */ (void 0)("div", {
				className: "rounded-2xl border border-red-200/50 bg-red-50/90 px-4 py-2 text-center text-xs font-medium text-red-700 shadow-xs dark:border-red-900/40 dark:bg-red-950/60 dark:text-red-300",
				children: error
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 118,
				columnNumber: 21
			}, this),
			/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
				className: "pt-1.5",
				children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", {
					type: "submit",
					disabled: busy,
					className: "flex h-12 w-full items-center justify-center rounded-full bg-[#0F685C] px-6 text-base font-semibold text-white shadow-md shadow-[#0d5c52]/20 transition-all hover:bg-[#0c564c] active:scale-[0.99] disabled:opacity-70 dark:bg-[#107568] dark:hover:bg-[#0d5c52]",
					children: busy ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(LoaderCircle, { className: "size-4 animate-spin text-white" }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 126,
							columnNumber: 19
						}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { children: "Creating Account…" }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 127,
							columnNumber: 19
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 125,
						columnNumber: 23
					}, this) : "Create Account"
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 124,
					columnNumber: 13
				}, this)
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 123,
				columnNumber: 11
			}, this),
			/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
				className: "flex items-center justify-center px-2 pt-2 text-xs font-medium sm:text-sm",
				children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
					className: "text-muted-foreground",
					children: "Already have an account?\xA0"
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 134,
					columnNumber: 13
				}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Link, {
					to: "/",
					className: "font-semibold text-[#13463F] transition-colors hover:text-[#0a2c27] hover:underline dark:text-emerald-300 dark:hover:text-emerald-100",
					children: "Sign In"
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 135,
					columnNumber: 13
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 133,
				columnNumber: 11
			}, this)
		]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 86,
		columnNumber: 9
	}, this) }, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 85,
		columnNumber: 7
	}, this)] }, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 81,
		columnNumber: 10
	}, this);
}
//#endregion
export { RegisterPage as component };
