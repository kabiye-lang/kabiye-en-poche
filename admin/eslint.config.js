import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
// import unusedImports from "eslint-plugin-unused-imports";

export default tseslint.config(
  {
    ignores: [
      "dist",
      "src/components/ui/*",
      "src/hooks/use-toast.ts",
      "src/lib/utils.ts",
      "database.types.ts",
      "./src/vite-env.d.ts",
    ],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      // "unused-imports": unusedImports,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "no-unused-vars": [
        "error",
        {
          args: "all",
          argsIgnorePattern: "^_",
          caughtErrors: "all",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
      "@typescript-eslint/no-unused-vars": [
        "off",
        {
          args: "all",
          argsIgnorePattern: "^_",
          caughtErrors: "all",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
      // "unused-imports/no-unused-imports": "error",
      // "unused-imports/no-unused-vars": [
      //       "error",
      //       {
      //         args: 'all',
      //         argsIgnorePattern: '^_',
      //         caughtErrors: 'all',
      //         caughtErrorsIgnorePattern: '^_',
      //         destructuredArrayIgnorePattern: '^_',
      //         varsIgnorePattern: '^_',
      //         ignoreRestSiblings: true,
      //       },
      //   ],
      "prettier/prettier": [
        "error",
        {
          plugins: [
            "@ianvs/prettier-plugin-sort-imports",
            "prettier-plugin-tailwindcss",
          ],
          trailingComma: "es5",
          tabWidth: 2,
          printWidth: 120,
          semi: false,
          singleQuote: true,
          pluginSearchDirs: false,
          importOrder: [
            "<TYPES>",
            "<TYPES>^[.]",
            "",
            "^react",
            "",
            "<BUILT_IN_MODULES>",
            "",
            "<THIRD_PARTY_MODULES>",
            "",
            "^@/.*$",
            "",
            "^[.]",
          ],
        },
      ],
    },
  },
  eslintPluginPrettierRecommended,
);
