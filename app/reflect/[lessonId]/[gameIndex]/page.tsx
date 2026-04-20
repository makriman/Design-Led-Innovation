import { notFound } from "next/navigation";
import { ReflectionForm } from "@/components/ReflectionForm";
import { getLessonById, parseLessonGames } from "@/lib/db";
import { requireSessionUser } from "@/lib/server-auth";

type ReflectPageProps = {
  params: Promise<{ lessonId: string; gameIndex: string }>;
};

export default async function ReflectPage({ params }: ReflectPageProps) {
  const { lessonId, gameIndex } = await params;
  await requireSessionUser();
  const lesson = await getLessonById(Number(lessonId));

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
      <h1 className="text-3xl font-black tracking-tight text-slate-900">Teacher Feedback</h1>
      <p className="text-sm text-slate-500">Rate the game, add quick notes, and get instant AI suggestions.</p>
      <ReflectionForm lessonId={lesson.id} gameIndex={index} gameName={games[index].name} />
    </section>
  );
}
