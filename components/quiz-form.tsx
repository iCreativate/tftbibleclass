 "use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type QuizQuestionType = "mcq" | "boolean" | "short";

export type QuizQuestion = {
  id: string;
  type: QuizQuestionType;
  prompt: string;
  options?: string[];
  correctAnswer?: string | boolean;
  scriptureReference?: string;
  explanation?: string;
  points: number;
};

export type QuizFormProps = {
  questions: QuizQuestion[];
  onSubmit?: (score: number) => void;
};

export function QuizForm(props: QuizFormProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  function handleChange(questionId: string, value: string) {
    setAnswers((current: Record<string, string>) => ({
      ...current,
      [questionId]: value
    }));
  }

  function handleSubmit() {
    let total = 0;
    for (const question of props.questions) {
      const answer = answers[question.id];
      if (answer == null || question.correctAnswer == null) continue;
      if (
        question.type === "boolean" &&
        String(question.correctAnswer) === answer
      ) {
        total += question.points;
      }
      if (
        question.type !== "boolean" &&
        String(question.correctAnswer).trim().toLowerCase() ===
          answer.trim().toLowerCase()
      ) {
        total += question.points;
      }
    }
    setScore(total);
    setSubmitted(true);
    if (props.onSubmit) {
      props.onSubmit(total);
    }
  }

  return (
    <div className="space-y-6 rounded-2xl border border-slate-200/70 bg-white/90 p-6 text-slate-700 shadow-[0_16px_32px_rgba(15,23,42,0.06)] backdrop-blur-lg">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="font-heading text-sm font-semibold text-slate-900">
            Lesson reflection quiz
          </p>
          <p className="text-xs text-slate-500">
            Gently check your understanding and linger over what the Spirit is
            highlighting.
          </p>
        </div>
        {submitted && score != null && (
          <div className="rounded-full bg-secondary/10 px-3 py-1 text-xs font-semibold text-secondary">
            Score: {score}
          </div>
        )}
      </div>
      <div className="space-y-5">
        {props.questions.map((question, index) => (
          <div
            key={question.id}
            className="space-y-2 rounded-xl border border-slate-200/70 bg-white/90 p-4"
          >
            <p className="text-sm font-medium text-slate-900">
              <span className="mr-1 text-xs font-semibold text-primary">
                {index + 1}.
              </span>
              {question.prompt}
            </p>
            {question.scriptureReference && (
              <p className="text-xs text-accent">
                {question.scriptureReference}
              </p>
            )}
            <div className="mt-2 space-y-2 text-sm">
              {question.type === "mcq" &&
                question.options?.map(option => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleChange(question.id, option)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition",
                      answers[question.id] === option
                        ? "border-primary/70 bg-primary/10 text-primary"
                        : "border-slate-200/70 bg-white/90 text-slate-700 hover:border-primary/40 hover:bg-slate-50"
                    )}
                  >
                    <span>{option}</span>
                  </button>
                ))}
              {question.type === "boolean" && (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={
                      answers[question.id] === "true" ? "default" : "outline"
                    }
                    className="flex-1"
                    onClick={() => handleChange(question.id, "true")}
                  >
                    True
                  </Button>
                  <Button
                    type="button"
                    variant={
                      answers[question.id] === "false" ? "default" : "outline"
                    }
                    className="flex-1"
                    onClick={() => handleChange(question.id, "false")}
                  >
                    False
                  </Button>
                </div>
              )}
              {question.type === "short" && (
                <Input
                  placeholder="Write your answer..."
                  value={answers[question.id] ?? ""}
                  onChange={event =>
                    handleChange(question.id, event.target.value)
                  }
                />
              )}
            </div>
            {submitted && question.explanation && (
              <div className="mt-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-800">
                <span className="font-semibold text-primary">
                  Explanation:
                </span>{" "}
                {question.explanation}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-end">
        <Button type="button" onClick={handleSubmit}>
          Submit quiz
        </Button>
      </div>
    </div>
  );
}
