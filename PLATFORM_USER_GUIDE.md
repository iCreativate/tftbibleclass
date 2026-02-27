## TFT Bible Class – Admin & Student Guide

This guide explains how **admins/facilitators** manage the platform and how **students** navigate and use it.

---

## Admin & Facilitator Guide

### 1. Accessing the admin area

- **Admin URL**: `/admin`
- **Admin login**: `/auth/admin`
- Your account must have the **admin** (or **facilitator**) role in Supabase, or be covered by the `ADMIN_EMAIL_OVERRIDE` config in the environment.

If you see “No profile or admin role” or get redirected back to login:
- Check that your user exists in Supabase under `Authentication → Users`.
- Ensure your profile row has `role = admin` or `role = facilitator`, or use the `grant_admin(email)` helper from the migrations.

### 2. Main admin sections

Once signed in, you will see the admin dashboard with navigation for:

- **Courses**
  - Create and edit courses (title, description, difficulty, estimated time, thumbnail).
  - Add and reorder **modules/lessons** and attach materials (PDFs, links, etc.).
  - Publish/unpublish courses to control what appears in the student catalog.

- **Quizzes**
  - Create question banks and quizzes linked to modules.
  - Configure question types, answers, and explanations.
  - Attach quizzes to modules so they appear at the end of a lesson for students.

- **Users**
  - View enrolled students and their course progress.
  - See which modules/quizzes they have completed.
  - Confirm that specific users have the right role (student, facilitator, admin).

- **Messages**
  - View and respond to **student questions** across courses and modules.
  - Each **thread** is tied to a **course** and optional **module**.
  - You can respond once as the first answer and then continue with follow‑up replies.

### 3. Working with student messages

Go to `/admin/messages`:

- You will see a list of **message threads**.
- Each thread shows:
  - **Topic**: course title and (if set) the module title.
  - A **timeline** of messages:
    - “Student” messages (questions and follow‑ups).
    - “You” messages (admin/facilitator responses).
- To reply:
  - Click **“Respond”** to give the first answer on a thread.
  - After that, use **“Reply again”** to continue the conversation.

Facilitators and admins can:
- See all notes/questions students have asked.
- Keep a running back‑and‑forth with students inside each thread.

### 4. Monitoring student progress

From **Courses** and **Users**:
- See which courses students are enrolled in.
- Check overall course progress (percentage of modules completed).
- Optionally award certificates (if you’ve enabled that feature).

### 5. Best practices for admins

- Encourage students to:
  - Always select the **correct course and module** when asking a question.
  - Use the **Messages & reflections** area in each course to keep questions organised.
- Use the **Messages** section regularly to:
  - Answer new questions.
  - Follow up on ongoing threads.
  - Spot recurring themes that may require content updates.

---

## Student Guide

### 1. Signing in and getting started

- Go to the main site and use the **login/register** forms.
- After signing in, you’ll land on the **Student home**:
  - See your **enrolled courses** and basic stats.
  - Access the **course catalog** to start new courses (if allowed by your admin).

### 2. Navigating courses

- Go to `/student/courses` (or “My courses” in the navigation).
- Click a course card to open it:
  - The **main content** shows lessons and materials.
  - The **right sidebar** shows:
    - Progress bar.
    - Difficulty and estimated time.
    - Links to Scripture reading and messaging.

Inside a course:
- Use the **module/lesson list** to move through the content.
- Some lessons may include **quizzes** at the end; complete them to track your learning.

### 3. Asking questions & messaging facilitators

You can send messages from two main places:

1. **From within a course** (sidebar)
   - On a course page or lesson page, look for the **“Questions & notes”** card in the sidebar.
   - This area lets you:
     - See your **message history** for that course.
     - Reply inside existing threads with your facilitator.
     - Ask a **new question** by choosing:
       - **Course** – required (already selected for the current course).
       - **Module** – optional (select the specific lesson, or leave as “This course generally”).

2. **From the Messages & reflections page**
   - Go to `/student/profile` navigation and select **“Messages & reflections”** (or the equivalent link).
   - There you’ll see:
     - All your **message threads**, each labelled with its **course** and (if set) **module**.
     - A **history** of each conversation with your facilitator.
     - A form to ask new questions:
       - Pick the **course** and optional **module** from the dropdown.
       - Type your question and send.

If you are **not enrolled** in any course:
- The question form will be **disabled** and show a notice telling you to enroll in a course first.

### 4. Viewing replies and continuing the conversation

- When a facilitator replies, their messages appear under **“Facilitator”** in your thread.
- To continue the conversation:
  - Type your follow‑up in the **Reply** field under that thread.
  - Your new message appears as **“You”** in the history.

All of your messages and replies are kept:
- Organised by **course and module**.
- In a **chronological thread**, so you can review past guidance anytime.

### 5. Updating your profile & preferences

Go to `/student/profile`:

- **Profile**
  - **Name**: your display name for the platform (editable).
  - **Email**: your login email (read‑only; managed by your account login).

- **Preferences**
  - **Preferred Bible translation**: pick ESV, NIV, KJV, etc.
  - **Notification preferences**: choose email, in‑app, both, or off.

- **More settings**
  - **Timezone**: used for reminders and scheduling.
  - **Profile photo mode**: use initials or upload a photo (when enabled).
  - **Study reminders**: when you’d like to be reminded to study.
  - **Theme**: light, dark, or system default.

- **Security**
  - Use the **Change password** button to update your password.

Remember to click **“Save settings”** after changing your preferences.

---

## Quick troubleshooting

- **I can’t see any courses**  
  - Ask your admin to enroll you or open the course catalog if it’s restricted.

- **I can’t ask a question – the form is greyed out**  
  - You need to be **enrolled in at least one course**. Once enrolled, the course dropdown will be enabled.

- **My profile shows blank name or email**  
  - Name can be set in the profile page.
  - Email is taken from your login; if it looks wrong, contact an admin to check your user record in Supabase.

This guide should give both admins and students enough orientation to use the platform confidently. For deeper technical configuration (env variables, migrations, deployment), refer to the main project `README.md`.

