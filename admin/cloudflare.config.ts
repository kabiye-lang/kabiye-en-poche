import { defineConfig } from "cf/config";

/**
 * Secret-like files were detected but not read or migrated: .env.example, .env.local. Only `secrets.required` entries are migrated.
 * @see https://developers.cloudflare.com/workers/configuration/secrets/
 */

/**
 * Wrangler environments are selected through ctx.mode and the cf --mode flag.
 * @see https://developers.cloudflare.com/workers/wrangler/environments/
 */

export default defineConfig((ctx) => {
	switch (ctx.mode) {
		case "staging": {
			return {
				worker: {
					name: "kabiye-en-poche-admin-staging",
					compatibilityDate: "2025-09-27",
					compatibilityFlags: [
						"nodejs_compat",
					],
					observability: {
						enabled: true,
					},
					assets: {
						notFoundHandling: "single-page-application",
					},
				},
			};
		}
		case "production": {
			return {
				worker: {
					name: "kabiye-en-poche-admin",
					compatibilityDate: "2025-09-27",
					compatibilityFlags: [
						"nodejs_compat",
					],
					observability: {
						enabled: true,
					},
					assets: {
						notFoundHandling: "single-page-application",
					},
				},
			};
		}
		default: {
			return {
				worker: {
					name: "kabiye-en-poche-admin",
					compatibilityDate: "2025-09-27",
					compatibilityFlags: [
						"nodejs_compat",
					],
					observability: {
						enabled: true,
					},
					assets: {
						notFoundHandling: "single-page-application",
					},
				},
			};
		}
	}
});
