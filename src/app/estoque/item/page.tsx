import { redirect } from "next/navigation";

/* Rota antiga do protótipo (dados fixos). O detalhe real é /estoque/[id]. */
export default function EstoqueItemLegacyPage() {
  redirect("/estoque");
}
