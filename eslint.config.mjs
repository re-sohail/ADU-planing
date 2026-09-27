import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import hydrationProof from "eslint-plugin-hydration-proof";

export default defineConfig([
  ...nextVitals,
  hydrationProof.configs.next,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", ".hydration-proof/**"]),
]);
