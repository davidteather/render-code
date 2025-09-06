import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import react from "eslint-plugin-react";

export default [
  js.configs.recommended,
  react.configs.flat.recommended,
  {
    files: ["src/**/*.{ts,tsx}", "src/**/*.ts", "src/**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        window: "readonly",
        document: "readonly",
        HTMLDivElement: "readonly",
        fetch: "readonly",
        console: "readonly",
        process: "readonly",
      },
    },
    settings: {
      react: { version: "detect" },
    },
    rules: {
      "react/prop-types": "off",
      "no-unused-vars": "off", // use TS rule
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "react/react-in-jsx-scope": "off",
    },
    plugins: { "@typescript-eslint": tsPlugin },
  },
  {
    files: ["src/**/*.test.ts", "src/**/*.test.tsx", "src/**/__tests__/**/*"],
    languageOptions: {
      globals: {
        require: "readonly",
        module: "readonly",
        describe: "readonly",
        it: "readonly",
        expect: "readonly",
        vi: "readonly",
        document: "readonly",
        HTMLDivElement: "readonly",
      },
    },
    rules: {
      "no-undef": "off",
    },
  },
];
