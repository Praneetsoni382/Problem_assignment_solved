import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { _ as useNavigate, g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as supabase } from "./client-BZqcN8FK.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as require_jsx_dev_runtime } from "../_libs/react.mjs";
import { S as LoaderCircle } from "../_libs/lucide-react.mjs";
import { v as ensureProfile } from "./router-DbtMI3nh.mjs";
import { n as AuthHero, r as AuthShell, t as AuthCard } from "./auth-shell-CTNDVbdg.mjs";
import { t as PasswordInput } from "./password-input-DvUw5CW4.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-fl2OVeTI.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_dev_runtime = require_jsx_dev_runtime();
var _jsxFileName = "/app/applet/src/routes/index.tsx?tsr-split=component";
function LoginPage() {
	const navigate = useNavigate();
	const [email, setEmail] = (0, import_react.useState)("");
	const [password, setPassword] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	const [showForgotModal, setShowForgotModal] = (0, import_react.useState)(false);
	const [resetBusy, setResetBusy] = (0, import_react.useState)(false);
	async function signIn(e) {
		e.preventDefault();
		setBusy(true);
		setError(null);
		const cleanEmail = email.trim().toLowerCase();
		const { error: signInError } = await supabase.auth.signInWithPassword({
			email: cleanEmail,
			password
		});
		if (signInError) {
			setBusy(false);
			const msg = signInError.message.toLowerCase();
			setError(msg.includes("not confirmed") ? "Please verify your email first — check your inbox for the verification link." : msg.includes("invalid login") ? "Incorrect email or password." : signInError.message);
			return;
		}
		try {
			const profile = await ensureProfile();
			setBusy(false);
			if (!profile) {
				setError("We couldn't load your account. Please try again.");
				return;
			}
			if (profile === "needs-details") {
				navigate({ to: "/complete-profile" });
				return;
			}
			toast.success(`Welcome back, ${profile.full_name}`);
			navigate({ to: profile.role === "teacher" ? "/teacher" : "/student" });
		} catch (err) {
			setBusy(false);
			setError(err instanceof Error ? err.message : "Something went wrong.");
		}
	}
	async function handleForgotPassword(e) {
		if (e) e.preventDefault();
		const clean = email.trim().toLowerCase();
		if (!clean) {
			setError("Please enter your email address first.");
			toast.error("Please enter your email address first.");
			return;
		}
		setResetBusy(true);
		const { error: resetError } = await supabase.auth.resetPasswordForEmail(clean, { redirectTo: `${window.location.origin}/reset-password` });
		setResetBusy(false);
		if (resetError) {
			setError(resetError.message);
			toast.error(resetError.message);
			return;
		}
		toast.success("Password reset link sent to your email!");
		setShowForgotModal(false);
	}
	return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(AuthShell, { children: [
		/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(AuthHero, {}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 81,
			columnNumber: 7
		}, this),
		/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(AuthCard, { children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("form", {
			onSubmit: signIn,
			className: "w-full space-y-3.5",
			children: [
				/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
					className: "w-full",
					children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("input", {
						id: "login-email",
						type: "email",
						required: true,
						autoComplete: "email",
						value: email,
						onChange: (e) => setEmail(e.target.value),
						placeholder: "Email address",
						className: "h-12 w-full rounded-full bg-[#13463F] px-6 text-sm font-medium text-white placeholder:text-emerald-100/60 shadow-xs outline-hidden transition-all focus:bg-[#0f3d37] focus:ring-2 focus:ring-emerald-400/60 dark:bg-[#113e38] dark:placeholder:text-emerald-200/50"
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 87,
						columnNumber: 13
					}, this)
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 86,
					columnNumber: 11
				}, this),
				/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
					className: "w-full",
					children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(PasswordInput, {
						id: "login-password",
						required: true,
						autoComplete: "current-password",
						value: password,
						onChange: (e) => setPassword(e.target.value),
						placeholder: "Password"
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 92,
						columnNumber: 13
					}, this)
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 91,
					columnNumber: 11
				}, this),
				error && /* @__PURE__ */ (void 0)("div", {
					className: "rounded-2xl border border-red-200/50 bg-red-50/90 px-4 py-2.5 text-center text-xs font-medium text-red-700 shadow-xs dark:border-red-900/40 dark:bg-red-950/60 dark:text-red-300",
					children: error
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 96,
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
								lineNumber: 104,
								columnNumber: 19
							}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { children: "Signing In…" }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 105,
								columnNumber: 19
							}, this)]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 103,
							columnNumber: 23
						}, this) : "Sign In"
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 102,
						columnNumber: 13
					}, this)
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 101,
					columnNumber: 11
				}, this),
				/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
					className: "flex items-center justify-between px-2 pt-2 text-xs font-medium sm:text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", {
						type: "button",
						onClick: () => {
							if (!email.trim()) setShowForgotModal(true);
							else handleForgotPassword();
						},
						className: "text-[#13463F] transition-colors hover:text-[#0a2c27] hover:underline dark:text-emerald-300 dark:hover:text-emerald-100",
						children: "Forgot Password?"
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 112,
						columnNumber: 13
					}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Link, {
						to: "/register",
						search: {
							role: "student",
							email
						},
						className: "text-[#13463F] transition-colors hover:text-[#0a2c27] hover:underline dark:text-emerald-300 dark:hover:text-emerald-100",
						children: "Create Account"
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 122,
						columnNumber: 13
					}, this)]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 111,
					columnNumber: 11
				}, this)
			]
		}, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 84,
			columnNumber: 9
		}, this) }, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 83,
			columnNumber: 7
		}, this),
		showForgotModal && /* @__PURE__ */ (void 0)("div", {
			className: "fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs",
			children: /* @__PURE__ */ (void 0)("div", {
				className: "w-full max-w-sm rounded-3xl border border-emerald-900/10 bg-[#FAF7F2] p-6 shadow-2xl dark:bg-[#0c1614]",
				children: [
					/* @__PURE__ */ (void 0)("h2", {
						className: "font-display text-lg font-bold text-[#14423b] dark:text-emerald-100",
						children: "Reset Your Password"
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 135,
						columnNumber: 13
					}, this),
					/* @__PURE__ */ (void 0)("p", {
						className: "mt-1 text-xs text-muted-foreground",
						children: "Enter your registered email address and we will send you a secure password reset link."
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 138,
						columnNumber: 13
					}, this),
					/* @__PURE__ */ (void 0)("form", {
						onSubmit: handleForgotPassword,
						className: "mt-4 space-y-3",
						children: [/* @__PURE__ */ (void 0)("input", {
							type: "email",
							required: true,
							value: email,
							onChange: (e) => setEmail(e.target.value),
							placeholder: "Enter your email",
							className: "h-11 w-full rounded-full bg-[#13463F] px-5 text-sm text-white placeholder:text-emerald-100/60 outline-hidden focus:ring-2 focus:ring-emerald-400"
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 143,
							columnNumber: 15
						}, this), /* @__PURE__ */ (void 0)("div", {
							className: "flex items-center justify-end gap-2 pt-2",
							children: [/* @__PURE__ */ (void 0)("button", {
								type: "button",
								onClick: () => setShowForgotModal(false),
								className: "rounded-full px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground",
								children: "Cancel"
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 146,
								columnNumber: 17
							}, this), /* @__PURE__ */ (void 0)("button", {
								type: "submit",
								disabled: resetBusy,
								className: "rounded-full bg-[#0F685C] px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#0c564c] disabled:opacity-60",
								children: resetBusy ? "Sending…" : "Send Reset Link"
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 149,
								columnNumber: 17
							}, this)]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 145,
							columnNumber: 15
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 142,
						columnNumber: 13
					}, this)
				]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 134,
				columnNumber: 11
			}, this)
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 133,
			columnNumber: 27
		}, this)
	] }, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 79,
		columnNumber: 10
	}, this);
}
//#endregion
export { LoginPage as component };
