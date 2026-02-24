import { notFound } from "next/navigation";
import Link from "next/link";
import { getQuestionBankWithQuestions } from "../actions";
import { QuestionBankDetailClient } from "./question-bank-detail-client";

type Props = { params: { id: string } };

export default async function QuestionBankDetailPage({ params }: Props) {
  const { bank, questions } = await getQuestionBankWithQuestions(params.id);
  if (!bank) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/question-banks" className="text-sm font-medium text-slate-500 hover:text-slate-700">
          ← Question banks
        </Link>
        <h1 className="mt-1 font-heading text-2xl font-semibold text-slate-900">{bank.title}</h1>
        <p className="mt-1 text-sm text-slate-500">
          Add questions here. You can reuse them when building quizzes (add from bank).
        </p>
      </div>
      <QuestionBankDetailClient bankId={bank.id} bankTitle={bank.title} initialQuestions={questions} />
    </div>
  );
}
