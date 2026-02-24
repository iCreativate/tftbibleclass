import Link from "next/link";
import { getQuestionBanks } from "./actions";
import { QuestionBanksListClient } from "./question-banks-list-client";

export default async function QuestionBanksPage() {
  const banks = await getQuestionBanks();

  return (
    <div className="space-y-6">
      <QuestionBanksListClient initialBanks={banks} />
    </div>
  );
}
