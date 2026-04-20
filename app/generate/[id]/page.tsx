import { notFound } from "next/navigation";
import { GenerateResultExperience } from "@/components/GenerateResultExperience";
import { getLessonById, parseLessonGames } from "@/lib/db";
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
    <GenerateResultExperience
      lessonId={lesson.id}
      grade={lesson.grade}
      subject={lesson.subject}
      games={games}
    />
  );
}
