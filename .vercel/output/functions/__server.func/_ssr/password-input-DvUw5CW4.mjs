import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { t as require_jsx_dev_runtime } from "../_libs/react.mjs";
import { A as Eye, j as EyeOff } from "../_libs/lucide-react.mjs";
import { f as cn } from "./router-DbtMI3nh.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/password-input-DvUw5CW4.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_dev_runtime = require_jsx_dev_runtime();
var _jsxFileName = "/app/applet/src/components/password-input.tsx";
function PasswordInput({ className, pillVariant = true, ...props }) {
	const [show, setShow] = (0, import_react.useState)(false);
	if (pillVariant) return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
		className: "relative w-full",
		children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("input", {
			type: show ? "text" : "password",
			className: cn("h-12 w-full rounded-full bg-[#13463F] px-6 pr-12 text-sm font-medium text-white placeholder:text-emerald-100/60 shadow-xs outline-hidden transition-all focus:ring-2 focus:ring-emerald-400/60 focus:bg-[#0f3d37] dark:bg-[#113e38] dark:placeholder:text-emerald-200/50", className),
			...props
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 16,
			columnNumber: 9
		}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", {
			type: "button",
			onClick: () => setShow((s) => !s),
			className: "absolute right-4 top-1/2 -translate-y-1/2 text-emerald-200/70 transition-colors hover:text-white focus:outline-hidden",
			"aria-label": show ? "Hide password" : "Show password",
			tabIndex: -1,
			children: show ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(EyeOff, { className: "size-4" }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 31,
				columnNumber: 19
			}, this) : /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Eye, { className: "size-4" }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 31,
				columnNumber: 51
			}, this)
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 24,
			columnNumber: 9
		}, this)]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 15,
		columnNumber: 7
	}, this);
	return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
		className: "relative w-full",
		children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("input", {
			type: show ? "text" : "password",
			className: cn("flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pr-10", className),
			...props
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 39,
			columnNumber: 7
		}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", {
			type: "button",
			onClick: () => setShow((s) => !s),
			className: "absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground focus:outline-hidden",
			"aria-label": show ? "Hide password" : "Show password",
			tabIndex: -1,
			children: show ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(EyeOff, { className: "size-4" }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 54,
				columnNumber: 17
			}, this) : /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Eye, { className: "size-4" }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 54,
				columnNumber: 49
			}, this)
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 47,
			columnNumber: 7
		}, this)]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 38,
		columnNumber: 5
	}, this);
}
//#endregion
export { PasswordInput as t };
