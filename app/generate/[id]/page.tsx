import { notFound } from "next/navigation";
import { GameCard } from "@/components/GameCard";
import { getLessonById, parseLessonGames } from "@/lib/db";
import { getGameImageUrl } from "@/lib/game-images";
import { requireSessionUser } from "@/lib/server-auth";

type GeneratePageProps = {
  params: Promise<{ id: string }>;
};

export default async function GenerateResultPage({ params }: GeneratePageProps) {
  const { id } = await params;
  await requireSessionUser();
  const lesson = await getLessonById(Number(id));

  if (!lesson) {
    notFound();
  }

  const games = parseLessonGames(lesson);

  return (
    <section className="space-y-5">
      <div className="no-print">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Your 3 learning games are ready</h1>
        <p className="text-sm text-slate-500">Open each game, review the steps, and log feedback after class.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {games.map((game, index) => (
          <GameCard
            key={`${lesson.id}-${index}`}
            lessonId={lesson.id}
            gameIndex={index}
            initialGame={game}
            imageUrl={getGameImageUrl(lesson.subject, index)}
            subject={lesson.subject}
            grade={lesson.grade}
          />
        ))}
      </div>
    </section>
  );
}
