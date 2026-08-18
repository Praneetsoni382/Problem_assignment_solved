//#region node_modules/.nitro/vite/services/ssr/assets/_tanstack-start-manifest_v-BollF5uY.js
var tsrStartManifest = () => ({ routes: {
	__root__: {
		filePath: "/app/applet/src/routes/__root.tsx",
		children: [
			"/",
			"/_authenticated",
			"/complete-profile",
			"/register",
			"/reset-password"
		],
		preloads: [
			"/assets/index-D2z1_zL_.js",
			"/assets/jsx-dev-runtime-C6yybAuI.js",
			"/assets/assignease-logo--8POUo2u.js",
			"/assets/useStore-C3sqTGPg.js",
			"/assets/qss-Bqk2G4CH.js",
			"/assets/root-DLTE-HSj.js",
			"/assets/redirect-Dhm19zUi.js",
			"/assets/link-CHYwuS74.js",
			"/assets/matchContext-DGTI-2Ov.js"
		],
		scripts: [{ attrs: {
			type: "module",
			async: !0,
			src: "/assets/index-D2z1_zL_.js"
		} }]
	},
	"/": {
		filePath: "/app/applet/src/routes/index.tsx",
		children: void 0,
		preloads: [
			"/assets/routes-qBLXw-G5.js",
			"/assets/password-input-CtJcptq6.js",
			"/assets/auth-shell-BuxFQgZC.js"
		]
	},
	"/_authenticated": {
		filePath: "/app/applet/src/routes/_authenticated/route.tsx",
		children: [
			"/_authenticated/student/",
			"/_authenticated/teacher/",
			"/_authenticated/student/assignments/$assignmentId",
			"/_authenticated/teacher/assignments/$assignmentId",
			"/_authenticated/teacher/grade/$submissionId",
			"/_authenticated/teacher/students/$studentId",
			"/_authenticated/teacher/students/"
		],
		preloads: ["/assets/route-CuWTN0dx.js"]
	},
	"/complete-profile": {
		filePath: "/app/applet/src/routes/complete-profile.tsx",
		children: void 0,
		preloads: [
			"/assets/complete-profile-B3M90Jhb.js",
			"/assets/auth-shell-BuxFQgZC.js",
			"/assets/auth-role-tabs-DHByEFEk.js"
		]
	},
	"/register": {
		filePath: "/app/applet/src/routes/register.tsx",
		children: void 0,
		preloads: [
			"/assets/register-Bf9FBoRe.js",
			"/assets/password-input-CtJcptq6.js",
			"/assets/auth-shell-BuxFQgZC.js",
			"/assets/auth-role-tabs-DHByEFEk.js"
		]
	},
	"/reset-password": {
		filePath: "/app/applet/src/routes/reset-password.tsx",
		children: void 0,
		preloads: [
			"/assets/reset-password-DFSfNgXh.js",
			"/assets/password-input-CtJcptq6.js",
			"/assets/auth-shell-BuxFQgZC.js"
		]
	},
	"/_authenticated/teacher/": {
		filePath: "/app/applet/src/routes/_authenticated/teacher/index.tsx",
		children: void 0,
		preloads: ["/assets/teacher-BbigsG_L.js", "/assets/plus-JOfRXEZX.js"]
	},
	"/_authenticated/student/assignments/$assignmentId": {
		filePath: "/app/applet/src/routes/_authenticated/student/assignments.$assignmentId.tsx",
		children: void 0,
		preloads: ["/assets/assignments._assignmentId-BE_VFR6b.js", "/assets/plus-JOfRXEZX.js"]
	},
	"/_authenticated/teacher/grade/$submissionId": {
		filePath: "/app/applet/src/routes/_authenticated/teacher/grade.$submissionId.tsx",
		children: void 0,
		preloads: [
			"/assets/grade._submissionId-DdIeIbSk.js",
			"/assets/createServerFn-CCXysPwS.js",
			"/assets/sparkles-C-0HroJ3.js"
		]
	}
} });
//#endregion
export { tsrStartManifest };
