import { r as createServerFn } from "./server-JZmi1U-o2.mjs";
import { t as createServerRpc } from "./createServerRpc-Wrl_BdV2.mjs";
import { t as createClient } from "../_libs/supabase__supabase-js.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/submission-action-Gf8Em7YO.js
function isNewSupabaseApiKey(value) {
	return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}
function createSupabaseFetch(supabaseKey) {
	return (input, init) => {
		const headers = new Headers(typeof Request !== "undefined" && input instanceof Request ? input.headers : void 0);
		if (init?.headers) new Headers(init.headers).forEach((value, key) => headers.set(key, value));
		if (isNewSupabaseApiKey(supabaseKey) && headers.get("Authorization") === `Bearer ${supabaseKey}`) headers.delete("Authorization");
		headers.set("apikey", supabaseKey);
		return fetch(input, {
			...init,
			headers
		});
	};
}
function createSupabaseAdminClient() {
	const SUPABASE_URL = process.env["SUPABASE_URL"] || process.env["VITE_SUPABASE_URL"] || typeof import.meta !== "undefined" && {
		"BASE_URL": "/",
		"DEV": true,
		"MODE": "production",
		"PROD": false,
		"SSR": true,
		"TSS_DEV_SERVER": "false",
		"TSS_DEV_SSR_STYLES_BASEPATH": "/",
		"TSS_DEV_SSR_STYLES_ENABLED": "true",
		"TSS_DISABLE_CSRF_MIDDLEWARE_WARNING": "false",
		"TSS_INLINE_CSS_ENABLED": "false",
		"TSS_ROUTER_BASEPATH": "",
		"TSS_SERVER_FN_BASE": "/_serverFn/",
		"VITE_SUPABASE_PROJECT_ID": "ffiornhojihsfzvhpbht",
		"VITE_SUPABASE_PUBLISHABLE_KEY": "sb_publishable_GKShseGRjLAhohEcpquf9Q_QUAe3xxz",
		"VITE_SUPABASE_URL": "https://ffiornhojihsfzvhpbht.supabase.co"
	}["VITE_SUPABASE_URL"];
	const SUPABASE_SERVICE_ROLE_KEY = process.env["SUPABASE_SERVICE_ROLE_KEY"] || process.env["SUPABASE_PUBLISHABLE_KEY"] || process.env["VITE_SUPABASE_PUBLISHABLE_KEY"] || process.env["SUPABASE_ANON_KEY"] || typeof import.meta !== "undefined" && {
		"BASE_URL": "/",
		"DEV": true,
		"MODE": "production",
		"PROD": false,
		"SSR": true,
		"TSS_DEV_SERVER": "false",
		"TSS_DEV_SSR_STYLES_BASEPATH": "/",
		"TSS_DEV_SSR_STYLES_ENABLED": "true",
		"TSS_DISABLE_CSRF_MIDDLEWARE_WARNING": "false",
		"TSS_INLINE_CSS_ENABLED": "false",
		"TSS_ROUTER_BASEPATH": "",
		"TSS_SERVER_FN_BASE": "/_serverFn/",
		"VITE_SUPABASE_PROJECT_ID": "ffiornhojihsfzvhpbht",
		"VITE_SUPABASE_PUBLISHABLE_KEY": "sb_publishable_GKShseGRjLAhohEcpquf9Q_QUAe3xxz",
		"VITE_SUPABASE_URL": "https://ffiornhojihsfzvhpbht.supabase.co"
	}["VITE_SUPABASE_PUBLISHABLE_KEY"];
	if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
		const message = `Missing Supabase environment variable(s): ${[...!SUPABASE_URL ? ["SUPABASE_URL"] : [], ...!SUPABASE_SERVICE_ROLE_KEY ? ["SUPABASE_PUBLISHABLE_KEY"] : []].join(", ")}. Connect Supabase in Lovable Cloud.`;
		console.error(`[Supabase] ${message}`);
		throw new Error(message);
	}
	return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
		global: { fetch: createSupabaseFetch(SUPABASE_SERVICE_ROLE_KEY) },
		auth: {
			storage: void 0,
			persistSession: false,
			autoRefreshToken: false
		}
	});
}
var _supabaseAdmin;
var supabaseAdmin = new Proxy({}, { get(_, prop, receiver) {
	if (!_supabaseAdmin) _supabaseAdmin = createSupabaseAdminClient();
	return Reflect.get(_supabaseAdmin, prop, receiver);
} });
async function getOrCreateSubmissionAdmin(assignmentId, studentId) {
	const { data: existing, error: readError } = await supabaseAdmin.from("submissions").select("*").eq("assignment_id", assignmentId).eq("student_id", studentId).maybeSingle();
	if (readError) {
		console.error("Error reading existing submission:", readError);
		throw new Error(`Database error: ${readError.message}`);
	}
	if (existing) return existing;
	const { data: created, error: insertError } = await supabaseAdmin.from("submissions").insert({
		assignment_id: assignmentId,
		student_id: studentId,
		status: "in_progress",
		checked_status: "unchecked"
	}).select("*").single();
	if (insertError) {
		console.error("Error creating submission with admin client:", insertError);
		throw new Error(`Failed to create submission: ${insertError.message}`);
	}
	return created;
}
var getOrCreateSubmissionServerAction_createServerFn_handler = createServerRpc({
	id: "db27bd4a9b7ccc88fd440d5c89db6dadce3f9523ddd6e749d064ca6a17c0dcea",
	name: "getOrCreateSubmissionServerAction",
	filename: "src/lib/submission-action.ts"
}, (opts) => getOrCreateSubmissionServerAction.__executeServer(opts));
var getOrCreateSubmissionServerAction = createServerFn({ method: "POST" }).validator((data) => data).handler(getOrCreateSubmissionServerAction_createServerFn_handler, async ({ data: { assignmentId, studentId } }) => {
	return await getOrCreateSubmissionAdmin(assignmentId, studentId);
});
//#endregion
export { getOrCreateSubmissionServerAction_createServerFn_handler };
