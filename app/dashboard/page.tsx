import { LessonForm } from "@/components/LessonForm";
import { requireSessionUser } from "@/lib/server-auth";

export default async function DashboardPage() {
  await requireSessionUser();

  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-bold">Generate Today&apos;s Games</h1>
      <p className="text-lg text-slate-700">One form. One tap. 3 ready-to-run activities.</p>
      <LessonForm />
    </section>
  );
}
