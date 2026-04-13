import { notFound } from "next/navigation";
import { ReflectionForm } from "@/components/ReflectionForm";
import db, { parseLessonGames, type LessonRow } from "@/lib/db";
import { requireSessionUser } from "@/lib/server-auth";

type ReflectPageProps = {
  params:
    | { lessonId: string; gameIndex: string }
    | Promise<{ lessonId: string; gameIndex: string }>;
};

export default async function ReflectPage({ params }: ReflectPageProps) {
  const { lessonId, gameIndex } = await Promise.resolve(params);
  const user = await requireSessionUser();

  const lesson = db
    .prepare("SELECT * FROM lessons WHERE id = ? AND user_id = ?")
    .get(Number(lessonId), user.id) as LessonRow | undefined;

  if (!lesson) {
    notFound();
  }

  const games = parseLessonGames(lesson);
  const index = Number(gameIndex);

  if (Number.isNaN(index) || index < 0 || index > 2 || !games[index]) {
    notFound();
  }

  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-bold">Quick Reflection</h1>
      <p className="text-lg text-slate-700">Capture what happened while it&apos;s fresh.</p>
      <ReflectionForm lessonId={lesson.id} gameIndex={index} gameName={games[index].name} />
    </section>
  );
}
