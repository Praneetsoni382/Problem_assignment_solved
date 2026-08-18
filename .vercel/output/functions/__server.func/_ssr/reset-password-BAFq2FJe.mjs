import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { _ as useNavigate, g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as supabase } from "./client-BZqcN8FK.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as require_jsx_dev_runtime } from "../_libs/react.mjs";
import { S as LoaderCircle, w as KeyRound } from "../_libs/lucide-react.mjs";
import { n as AuthHero, r as AuthShell, t as AuthCard } from "./auth-shell-CTNDVbdg.mjs";
import { t as PasswordInput } from "./password-input-DvUw5CW4.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/reset-password-BAFq2FJe.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_dev_runtime = require_jsx_dev_runtime();
var _jsxFileName = "/app/applet/src/routes/reset-password.tsx?tsr-split=component";
function ResetPasswordPage() {
	const navigate = useNavigate();
	const [password, setPassword] = (0, import_react.useState)("");
	const [confirm, setConfirm] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	async function submit(e) {
		e.preventDefault();
		setError(null);
		if (password.length < 8) return setError("Password must be at least 8 characters.");
		if (password !== confirm) return setError("Passwords don't match.");
		setBusy(true);
		const { error: updateError } = await supabase.auth.updateUser({ password });
		setBusy(false);
		if (updateError) {
			setError(updateError.message);
			return;
		}
		toast.success("Password updated successfully!");
		navigate({ to: "/" });
	}
	return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(AuthShell, { children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(AuthHero, {}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 36,
		columnNumber: 7
	}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(AuthCard, { children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
		className: "mb-4 text-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
				className: "mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950",
				children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(KeyRound, { className: "size-6 text-[#0d5c52] dark:text-emerald-400" }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 40,
					columnNumber: 13
				}, this)
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 39,
				columnNumber: 11
			}, this),
			/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("h1", {
				className: "font-display text-xl font-bold text-[#14423b] dark:text-emerald-100",
				children: "Set New Password"
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 42,
				columnNumber: 11
			}, this),
			/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", {
				className: "mt-1 text-xs text-muted-foreground",
				children: "Enter and confirm your new secure password."
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 45,
				columnNumber: 11
			}, this)
		]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 38,
		columnNumber: 9
	}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("form", {
		onSubmit: submit,
		className: "space-y-3.5",
		children: [
			/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
				className: "w-full",
				children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(PasswordInput, {
					id: "reset-password",
					required: true,
					autoComplete: "new-password",
					value: password,
					onChange: (e) => setPassword(e.target.value),
					placeholder: "New Password (min 8 chars)"
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 52,
					columnNumber: 13
				}, this)
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 51,
				columnNumber: 11
			}, this),
			/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
				className: "w-full",
				children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(PasswordInput, {
					id: "reset-confirm",
					required: true,
					autoComplete: "new-password",
					value: confirm,
					onChange: (e) => setConfirm(e.target.value),
					placeholder: "Confirm New Password"
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 56,
					columnNumber: 13
				}, this)
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 55,
				columnNumber: 11
			}, this),
			error && /* @__PURE__ */ (void 0)("div", {
				className: "rounded-2xl border border-red-200/50 bg-red-50/90 px-4 py-2 text-center text-xs font-medium text-red-700 shadow-xs dark:border-red-900/40 dark:bg-red-950/60 dark:text-red-300",
				children: error
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 59,
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
							lineNumber: 66,
							columnNumber: 19
						}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { children: "Updating…" }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 67,
							columnNumber: 19
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 65,
						columnNumber: 23
					}, this) : "Update Password"
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 64,
					columnNumber: 13
				}, this)
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 63,
				columnNumber: 11
			}, this),
			/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
				className: "text-center pt-2",
				children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Link, {
					to: "/",
					className: "text-xs font-semibold text-[#13463F] hover:underline dark:text-emerald-300",
					children: "Back to Sign In"
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 73,
					columnNumber: 13
				}, this)
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 72,
				columnNumber: 11
			}, this)
		]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 50,
		columnNumber: 9
	}, this)] }, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 37,
		columnNumber: 7
	}, this)] }, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 35,
		columnNumber: 10
	}, this);
}
//#endregion
export { ResetPasswordPage as component };
