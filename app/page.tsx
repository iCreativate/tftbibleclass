import Link from "next/link";
import { ArrowRight, BookOpen, Sparkles } from "lucide-react";
import heroBackground from "../hero background/hero.jpg";
import { LandingAuthModal } from "@/components/landing-auth-modal";
import { HeroAuthButton } from "@/components/hero-auth-button";
import { AdminAuthModal } from "@/components/admin-auth-modal";
import { AdminFooterButton } from "@/components/admin-footer-button";
import { getPublishedCourses } from "@/lib/courses";
import { CourseCard } from "@/components/course-card";

export default async function HomePage() {
  const courses = await getPublishedCourses();
  return (
    <main className="flex-1 bg-white">
      <div
        className="relative min-h-[640px] overflow-hidden sm:min-h-[700px]"
        style={{
          backgroundImage: `url(${heroBackground.src})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-slate-900/70" />
        <LandingAuthModal />
        <AdminAuthModal />
        <div className="relative mx-auto flex min-h-[640px] max-w-6xl flex-col justify-center gap-12 px-4 py-6 pt-28 sm:min-h-[700px] sm:px-6 sm:pt-32 lg:px-8 lg:py-12">
          <section className="grid gap-12 md:grid-cols-[1.25fr,1fr] md:items-center">
            <div className="space-y-6 text-white">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-medium backdrop-blur-sm">
                <Sparkles className="h-4 w-4 text-amber-300" />
                <span className="tracking-widest uppercase">
                  Walking with Jesus, one lesson at a time
                </span>
              </div>
              <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl lg:text-[2.75rem] lg:leading-tight">
                A calm, focused home for Bible study online
              </h1>
              <p className="max-w-xl text-base leading-relaxed text-slate-200 sm:text-lg">
                TFT Bible Class blends guided teaching, reflective sessions, and a
                clear, modern interface so you can go deeper in the Word.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <HeroAuthButton />
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-slate-300">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 backdrop-blur-sm">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Self-paced lessons
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 backdrop-blur-sm">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  Reflective sessions
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 backdrop-blur-sm">
                  <span className="h-2 w-2 rounded-full bg-blue-400" />
                  Certificates
                </span>
              </div>
            </div>
            <div className="relative flex justify-end">
              <div className="relative h-56 w-40 rounded-2xl border border-white/20 bg-gradient-to-br from-primary/90 to-primary-800 shadow-2xl shadow-black/30">
                <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl text-white">
                  <BookOpen className="h-16 w-16 opacity-90" strokeWidth={1.25} />
                  <span className="mt-2 text-xs font-semibold tracking-widest uppercase">
                    Holy Bible
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <div className="mx-auto max-w-6xl flex flex-col gap-20 px-4 py-16 sm:px-6 lg:px-8">
        <section className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card transition-shadow hover:shadow-card-hover">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <BookOpen className="h-6 w-6" />
            </div>
            <h2 className="font-heading text-lg font-semibold text-slate-900">
              Guided Courses
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Structured journeys through books of the Bible with video lessons,
              readings, and reflections.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card transition-shadow hover:shadow-card-hover">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
              <Sparkles className="h-6 w-6" />
            </div>
            <h2 className="font-heading text-lg font-semibold text-slate-900">
              Self-Paced Devotions
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Move through modules when you’re ready. Progress is saved across
              devices.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card transition-shadow hover:shadow-card-hover">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
              <ArrowRight className="h-6 w-6" />
            </div>
            <h2 className="font-heading text-lg font-semibold text-slate-900">
              Learn, Reflect, Share
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Take notes, meditate on Scripture, and share what you’re learning
              with others.
            </p>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                Explore our courses
              </p>
              <h2 className="mt-2 font-heading text-2xl font-semibold text-slate-900">
                Bible classes for every season
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                New courses appear here when published. Register or sign in to enroll and access lessons, materials, and certificates.
              </p>
            </div>
            <Link
              href="/courses"
              className="shrink-0 text-sm font-semibold text-primary hover:text-primary-700"
            >
              View all courses →
            </Link>
          </div>
          {courses.length === 0 ? (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-10 text-center shadow-card text-slate-500">
              No courses available yet. Check back soon.
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <CourseCard
                  key={course.id}
                  id={course.id}
                  title={course.title}
                  description={course.description ?? ""}
                  thumbnailUrl={course.thumbnail_url}
                  difficulty={
                    course.difficulty as "Beginner" | "Intermediate" | "Advanced"
                  }
                  estimatedMinutes={course.estimated_minutes ?? 60}
                />
              ))}
            </div>
          )}
        </section>

        <section className="grid gap-8 rounded-2xl border border-slate-200/80 bg-white p-8 shadow-card md:grid-cols-[1.5fr,1fr]">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              How it works
            </p>
            <h2 className="font-heading text-2xl font-semibold text-slate-900">
              A gentle rhythm for deep Bible study
            </h2>
            <ul className="space-y-4 text-sm text-slate-600">
              <li>
                <span className="font-semibold text-slate-900">1. Choose a course.</span>{" "}
                Begin with a gospel, a letter, or a themed journey that fits
                your season.
              </li>
              <li>
                <span className="font-semibold text-slate-900">2. Watch and reflect.</span>{" "}
                Short video sessions with guided reflections and Scripture
                readings.
              </li>
              <li>
                <span className="font-semibold text-slate-900">3. Capture what God is saying.</span>{" "}
                Notes, reflection questions, and space to return whenever you
                need.
              </li>
              <li>
                <span className="font-semibold text-slate-900">4. Grow at a sustainable pace.</span>{" "}
                Track progress, revisit modules, and let truth sink in slowly.
              </li>
            </ul>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Designed for real life
            </p>
            <p className="mt-3 text-sm leading-relaxed text-slate-700">
              TFT Bible Class is about creating space in your week to sit with
              Scripture, listen for the Lord’s voice, and respond in obedience.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-slate-700">
              Whether you’re new to the Bible or have been walking with Jesus
              for years, the lessons are warm, clear, and rooted in the text.
            </p>
            <p className="mt-4 text-xs text-slate-500">
              Start where you are, with the time you have.
            </p>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              For individuals
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Study on your own with prompts that move you from reading to
              reflection and prayer.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              For a closer walk with God
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Deepen your daily walk with Jesus through gentle, structured time
              in the Word.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              For serving in the church
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Support church and ministry teams with courses that align with
              your teaching and rhythms.
            </p>
          </div>
        </section>
      </div>

      <footer className="border-t border-slate-200 bg-slate-900">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-white">
              TFT Bible Class
            </p>
            <p>Walking slowly through Scripture, one lesson at a time.</p>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <Link href="/courses" className="hover:text-white transition-colors">
              Courses
            </Link>
            <Link href="/auth/login" className="hover:text-white transition-colors">
              Login
            </Link>
            <Link href="/contact" className="hover:text-white transition-colors">
              Contact
            </Link>
            <AdminFooterButton />
          </div>
          <div className="space-y-1 text-right text-xs text-slate-500">
            <p>“Let the word of Christ dwell in you richly.”</p>
            <p className="font-scripture text-slate-400">Colossians 3:16</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
