# TFT Bible Class

TFT Bible Class is a serene, self‑paced online Bible study platform built with Next.js 14, Supabase, Tailwind CSS, and TypeScript.

## Tech stack

- Next.js 14 (App Router)
- React 18 + TypeScript
- Tailwind CSS with custom TFT theme
- Supabase (Auth, PostgreSQL, Storage)
- shadcn-style UI primitives (buttons, inputs, etc.)

## Getting started

1. Install dependencies:

```bash
npm install
```

2. Create a `.env.local` file in the project root and add:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

3. Set up the database schema in Supabase:

- Open the SQL editor in your Supabase project.
- Paste the contents of `supabase/schema.sql`.
- Run the script to create tables, policies, and relationships.

4. Run the development server:

```bash
npm run dev
```

Visit `http://localhost:3000` to open TFT Bible Class.

## Roles

- `student` (default): Can enroll in courses, track progress, take quizzes, and manage notes.
- `facilitator`: Can create and manage courses, modules, quizzes, and monitor student progress.
- `admin`: Can manage users, approve facilitators, and post platform‑wide announcements.

You can manually promote a user by updating their `profiles.role` value in Supabase.

