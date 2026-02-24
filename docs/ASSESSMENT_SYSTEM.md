# Next-Gen Assessment System

This document maps the **Next-Gen Assessment System Blueprint** to the TFT Bible Class LMS and outlines phased implementation.

---

## 1. Core Philosophy

| Traditional LMS | This system (target) |
|------------------|----------------------|
| Static questions | **Adaptive** (Phase 2) |
| Linear flow | **Skill-based** (Phase 1) |
| Score-based only | **Mastery-based** (Phase 1) |
| Not skill-aware | **Skill tagging + mastery** (Phase 1) |
| — | **Data-driven analytics** (Phase 1–2) |
| — | **Gamified** (Phase 3) |
| — | **AI-assisted** (Phase 3) |
| — | **Enterprise-reportable** (Phase 3) |

---

## 2. System Architecture (Layers)

1. **Question Intelligence Layer** — metadata on each question (difficulty, Bloom, skills, time, topic).
2. **Adaptive Logic Engine** — rules for next-question selection (Phase 2).
3. **Scoring & Mastery Engine** — weighted skill scores, mastery %, thresholds.
4. **Analytics & Insights Engine** — dashboards for students, instructors, admins.
5. **Academic Integrity Layer** — optional proctoring, lock mode (Phase 3).
6. **Certification & Skill Mapping** — certificates with skill mastery % (Phase 3).

---

## 3. Question Intelligence (Phase 1 – Implemented in Schema)

### Question metadata (on `quiz_questions`)

| Field | Purpose |
|-------|--------|
| `difficulty` | 1–5 scale for adaptive logic |
| `bloom_level` | remember, understand, apply, analyze, evaluate, create |
| `estimated_time_seconds` | For analytics and pacing |
| `topic_category` | Topic for filtering/reporting |
| `cognitive_category` | Cognitive category |
| `points` | Weight for scoring (existing) |

### Skill tags

- **`skill_tags`** — Skills (e.g. “Scripture recall”, “Application”). Can be global (`course_id` null) or course-scoped.
- **`quiz_question_skills`** — Many-to-many: each question can be tagged with one or more skills.

### Question types (existing + future)

- Current: `mcq`, `boolean`, `short`, `essay` (and `fill_in_blank` in some schemas).
- Blueprint also allows: multi-select (partial scoring), drag-and-drop, matching, case study, etc. — add as new `type` values and UI when needed.

---

## 4. Adaptive Assessment Engine (Phase 2)

- **`adaptive_logic_rules`** — Stores rules per quiz (e.g. “if correct at difficulty 2 → serve difficulty 3”).
- Flow: use previous answer accuracy, time, optional confidence, and skill mastery to choose next question.
- **Modes** (on `quizzes.assessment_mode`):
  - **diagnostic** — Pre-course level check.
  - **practice** — Unlimited attempts, hints possible.
  - **mastery** — Must achieve threshold (e.g. 80%) per skill.
  - **exam** — Locked, timed, secure.

---

## 5. Scoring & Mastery Engine (Phase 1)

### Weighted skill-based scoring

- Each question has `points` (weight) and is linked to skills via `quiz_question_skills`.
- On submit:
  - Compute overall score (existing).
  - Compute **per-skill** score and store in **`quiz_attempt_skill_scores`** (score, max_score, optional mastery_percent).
  - Update **`skill_mastery`** (per user/skill/course) from attempt skill scores (e.g. rolling average or best attempt).

### Mastery thresholds (app logic)

- Beginner: 0–50%
- Developing: 51–75%
- Proficient: 76–90%
- Mastery: 91–100%

Certificates (Phase 3) can require e.g. “Minimum 80% mastery across core skills”.

---

## 6. AI Layer (Phase 3)

- **AI Quiz Generator** — From lesson content; suggest difficulty and skills.
- **AI Feedback** — Per-question or per-skill feedback instead of only “Incorrect”.
- **Adaptive remediation** — Recommend lessons or practice when a skill is below threshold.

---

## 7. Analytics & Insights (Phase 1–2)

- **Students:** Skill breakdown per attempt, progress over time, weak areas.
- **Instructors:** Class skill distribution, question difficulty performance, drop-off, time-to-complete.
- **Enterprise:** Team competency, skill gaps, compliance, department comparison (Phase 3).

---

## 8. Academic Integrity (Phase 3)

- Randomized pools, IP logging, optional proctoring, browser lock, plagiarism/AI-cheating detection.

---

## 9. Gamification (Phase 3)

- XP, streaks, badges per skill, leaderboards, milestones.

---

## 10. Certification & Skill Mapping (Phase 3)

- Certificates that list **skills** and **mastery %** per skill (resume-worthy).

---

## 11. Database Overview (Current)

| Table | Purpose |
|-------|--------|
| `quizzes` | Assessment; + `assessment_mode` (diagnostic/practice/mastery/exam). |
| `quiz_questions` | + `difficulty`, `bloom_level`, `estimated_time_seconds`, `topic_category`, `cognitive_category`. |
| `quiz_question_skills` | Question ↔ skill (many-to-many). |
| `skill_tags` | Skill definitions (global or per course). |
| `skill_mastery` | Per user/skill (and optional course) mastery %. |
| `quiz_attempts` | One row per attempt (existing). |
| `quiz_attempt_skill_scores` | Per-attempt, per-skill score/max_score/mastery. |
| `adaptive_logic_rules` | Phase 2 adaptive rules (structure only). |

---

## 12. Phased Implementation

### Phase 1 (Schema + basic usage)

- [x] Skill tags table and RLS.
- [x] Question metadata columns (difficulty, Bloom, time, topic, cognitive).
- [x] Question–skill linking (`quiz_question_skills`).
- [x] Assessment mode on quizzes.
- [x] Skill mastery table.
- [x] Attempt skill scores table.
- [ ] **App:** CRUD for skill tags (admin).
- [ ] **App:** When editing questions, set difficulty, Bloom, skills, estimated time.
- [ ] **App:** On attempt submit, compute and store per-skill scores; optionally update `skill_mastery`.
- [ ] **App:** Basic analytics: show per-skill breakdown on attempt result and in quiz history.

### Phase 2

- [ ] Adaptive logic: select next question from rules using previous answer and mastery.
- [ ] Skill mastery dashboard (student and instructor).
- [ ] AI feedback (e.g. per-skill messages).

### Phase 3

- [ ] AI quiz generation from content.
- [ ] Proctoring / integrity features.
- [ ] Corporate reporting.
- [ ] Gamification (XP, badges, leaderboards).
- [ ] Certificates with skill mastery %.

---

## 13. Migration

Run in Supabase SQL Editor (or via `supabase db push`):

- **`supabase/migrations/20260220140000_nextgen_assessment_phase1.sql`**

This adds the new tables and columns without removing existing ones. Existing quizzes and attempts continue to work; new fields are nullable or have defaults.
