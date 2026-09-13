import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const eslintConfig = [...nextCoreWebVitals, ...nextTypescript, {
  rules: {
    // TypeScript rules
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": "off",
    "@typescript-eslint/no-non-null-assertion": "off",
    "@typescript-eslint/ban-ts-comment": "off",
    "@typescript-eslint/prefer-as-const": "off",
    "@typescript-eslint/no-unused-disable-directive": "off",
    
    // React rules
    "react-hooks/exhaustive-deps": "off",
    "react-hooks/purity": "off",
    "react/no-unescaped-entities": "off",
    "react/display-name": "off",
    "react/prop-types": "off",
    "react-compiler/react-compiler": "off",
    
    // Next.js rules
    "@next/next/no-img-element": "off",
    "@next/next/no-html-link-for-pages": "off",
    
    // General JavaScript rules
    "prefer-const": "off",
    "no-unused-vars": "off",
    "no-console": "warn",
    "no-debugger": "off",
    "no-empty": "off",
    "no-irregular-whitespace": "off",
    "no-case-declarations": "off",
    "no-fallthrough": "off",
    "no-mixed-spaces-and-tabs": "off",
    "no-redeclare": "off",
    "no-undef": "off",
    "no-unreachable": "off",
    "no-useless-escape": "off",
    "max-lines": "off",
    "complexity": "off",
  },
}, {
  files: ["src/features/**/*.{ts,tsx}"],
  rules: {
    // Appliqué progressivement sur le code refactoré — pas sur l'héritage migré.
    "max-lines-per-function": "off",
    "no-console": "error",
  },
}, {
  files: ["src/shared/logger/**/*.{ts,tsx}"],
  rules: {
    "no-console": "off",
  },
}, {
  ignores: [
    "node_modules/**",
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "examples/**",
    "skills",
    "scripts/**",
    "public/ocr/**",
    "public/pdf.worker.min.mjs",
    "public/sw.js",
    "public/sw.js.map",
    "public/swe-worker-*",
    "graphify-out/**",
    // Backend NestJS package : linté séparément par sa propre config oxlint
    // (api/oxlint.json, `npm run lint` depuis api/). "eslint ." depuis la
    // racine y appliquait par erreur les règles strictes Next.js/frontend
    // (no-explicit-any notamment, inadaptée aux DTO Prisma), et surtout
    // scannait api/dist (sortie de build générée, gitignorée, jamais censée
    // être lintée ni éditée).
    "api/**",
  ]
}];

export default eslintConfig;
