import { notFound } from "next/navigation";
import { GameCard } from "@/components/GameCard";
import db, { parseLessonGames, type LessonRow } from "@/lib/db";
import { requireSessionUser } from "@/lib/server-auth";

type GeneratePageProps = {
  params: { id: string } | Promise<{ id: string }>;
};

export default async function GenerateResultPage({ params }: GeneratePageProps) {
  const { id } = await Promise.resolve(params);
  const user = await requireSessionUser();

  const lesson = db
    .prepare("SELECT * FROM lessons WHERE id = ? AND user_id = ?")
    .get(Number(id), user.id) as LessonRow | undefined;

  if (!lesson) {
    notFound();
  }

  const games = parseLessonGames(lesson);

  return (
    <section className="space-y-5">
      <div className="no-print">
        <h1 className="text-3xl font-bold">Your 3 Games Are Ready</h1>
        <p className="text-lg text-slate-700">Tap a game to run, print, or reflect after class.</p>
      </div>

      {games.map((game, index) => (
        <GameCard key={`${lesson.id}-${index}`} lessonId={lesson.id} gameIndex={index} initialGame={game} />
      ))}
    </section>
  );
}
