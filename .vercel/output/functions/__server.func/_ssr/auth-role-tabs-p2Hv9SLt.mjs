import { t as require_jsx_dev_runtime } from "../_libs/react.mjs";
import { f as cn } from "./router-DbtMI3nh.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/auth-role-tabs-p2Hv9SLt.js
var import_jsx_dev_runtime = require_jsx_dev_runtime();
var _jsxFileName = "/app/applet/src/components/auth-role-tabs.tsx";
function AuthRoleTabs({ value, onChange, className }) {
	return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
		className: cn("flex w-full rounded-full border border-emerald-900/10 bg-emerald-950/10 p-1 backdrop-blur-xs dark:border-emerald-500/20 dark:bg-emerald-950/40", className),
		children: ["student", "teacher"].map((role) => {
			const isActive = value === role;
			return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", {
				type: "button",
				onClick: () => onChange(role),
				className: cn("flex-1 rounded-full py-2 text-xs font-semibold tracking-wide transition-all", isActive ? "bg-[#0d5c52] text-white shadow-sm dark:bg-[#116b5f]" : "text-[#14423b]/80 hover:text-[#14423b] dark:text-emerald-300/80 dark:hover:text-emerald-100"),
				"aria-pressed": isActive,
				children: role === "student" ? "I'm a Student" : "I'm a Teacher"
			}, role, false, {
				fileName: _jsxFileName,
				lineNumber: 22,
				columnNumber: 11
			}, this);
		})
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 13,
		columnNumber: 5
	}, this);
}
//#endregion
export { AuthRoleTabs as t };
