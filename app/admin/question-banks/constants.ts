export const QUESTION_TYPES = ["mcq", "boolean", "short", "essay", "fill_in_blank"] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];
