import Link from "next/link";
import type { ReactNode } from "react";
import { BookOpenCheck, Sparkles, WandSparkles } from "lucide-react";
import { DashboardSplash } from "@/components/DashboardSplash";
import { LessonForm } from "@/components/LessonForm";
import { LessonHistoryFeed } from "@/components/LessonHistoryFeed";
import { requireSessionUser } from "@/lib/server-auth";

export default async function DashboardPage() {
  await requireSessionUser();

  return (
    <section className="space-y-8">
      <DashboardSplash />

      <div className="rounded-3xl border border-border bg-gradient-to-br from-white via-neutral to-white p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Kwame&apos;s Dashboard</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-900">Build Better Lessons Faster</h1>
        <p className="mt-2 max-w-3xl text-base text-slate-600">
          Design joyful, practical lessons for real classrooms, reflect on what happened, and improve.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <ActionTile
          href="#generate-plan"
          icon={<WandSparkles className="h-5 w-5" />}
          title="Generate"
          description="Create 3 new activities"
        />
        <ActionTile
          href="/history"
          icon={<BookOpenCheck className="h-5 w-5" />}
          title="History"
          description="Browse past plans"
        />
        <ActionTile
          href="/insights"
          icon={<Sparkles className="h-5 w-5" />}
          title="Insights"
          description="See coaching patterns"
        />
      </div>

      <section id="generate-plan" className="space-y-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Create your next lesson</h2>
          <p className="text-sm text-slate-500">Pick a grade, pick a subject, then generate a fun plan.</p>
        </div>
        <LessonForm />
      </section>

      <LessonHistoryFeed
        title="Past generated plans"
        subtitle="Search and scroll through your complete lesson history"
      />
    </section>
  );
}

function ActionTile({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-border bg-white p-4 transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
    >
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">{icon}</span>
      <p className="mt-4 text-lg font-bold text-slate-900">{title}</p>
      <p className="text-sm text-slate-500">{description}</p>
    </Link>
  );
}
