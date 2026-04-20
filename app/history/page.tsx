import { LessonHistoryFeed } from "@/components/LessonHistoryFeed";
import { requireSessionUser } from "@/lib/server-auth";

export default async function HistoryPage() {
  await requireSessionUser();

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Lesson History</h1>
        <p className="mt-1 text-sm text-slate-500">Search, browse, and reopen any generated plan.</p>
      </div>

      <LessonHistoryFeed />
    </section>
  );
}
