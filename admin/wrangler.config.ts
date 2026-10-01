import { defineWranglerConfig } from "wrangler/experimental-config";

export default defineWranglerConfig((ctx) => {
	switch (ctx.mode) {
		case "staging": {
			return {
				types: {
					generate: false,
				},
				assetsDirectory: "./dist",
			};
		}
		case "production": {
			return {
				types: {
					generate: false,
				},
				assetsDirectory: "./dist",
			};
		}
		default: {
			return {
				types: {
					generate: false,
				},
				assetsDirectory: "./dist",
			};
		}
	}
});
