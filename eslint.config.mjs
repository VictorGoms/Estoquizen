import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/* Padrão do Next 16 (o `next lint` saiu): regras do Next, de acessibilidade e do React/hooks */
export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      /* O app lê Date.now(), localStorage e window depois de montar, de propósito, para não
         quebrar a hidratação (ver "Regras críticas de React" no CLAUDE.md). Fica como aviso. */
      "react-hooks/set-state-in-effect": "warn",
      /* `const { [id]: _, ...resto } = obj` descarta uma chave de propósito */
      "@typescript-eslint/no-unused-vars": ["warn", { ignoreRestSiblings: true, varsIgnorePattern: "^_", argsIgnorePattern: "^_" }],
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "certs/**", "next-env.d.ts"]),
]);
