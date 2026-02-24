export const ASSESSMENT_MODES = ["diagnostic", "practice", "mastery", "exam"] as const;
export type AssessmentMode = (typeof ASSESSMENT_MODES)[number];

export const ASSESSMENT_MODE_LABELS: Record<AssessmentMode, string> = {
  diagnostic: "Diagnostic (pre-course level check)",
  practice: "Practice (unlimited attempts, hints allowed)",
  mastery: "Mastery (must achieve threshold per skill)",
  exam: "Exam (locked, timed, secure)",
};

/** Quiz question types: auto-graded (mcq, single_choice, boolean, fill_in_blank, match) and manual (essay, file_upload). */
export const QUIZ_QUESTION_TYPES = ["mcq", "single_choice", "boolean", "fill_in_blank", "match", "essay", "file_upload"] as const;
export type QuizQuestionType = (typeof QUIZ_QUESTION_TYPES)[number];

export const QUIZ_QUESTION_TYPE_LABELS: Record<QuizQuestionType, string> = {
  mcq: "Multiple choice (auto-graded, select one or more)",
  single_choice: "Single choice (auto-graded, select one)",
  boolean: "True / False (auto-graded)",
  fill_in_blank: "Fill in the blank (auto-graded)",
  match: "Match the answer (match statements to options, e.g. scripture refs)",
  essay: "Essay (manual grading, instructor review)",
  file_upload: "File upload (manual grading, instructor review)",
};
