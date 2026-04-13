import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import db, { parseLessonGames, type LessonRow } from "@/lib/db";
import { requireSessionUser } from "@/lib/server-auth";

type LessonWithReflections = LessonRow & {
  reflection_count: number;
};

export default async function HistoryPage() {
  const user = await requireSessionUser();

  const lessons = db
    .prepare(
      `SELECT l.*, (
          SELECT COUNT(*)
          FROM reflections r
          WHERE r.lesson_id = l.id AND r.user_id = l.user_id
        ) as reflection_count
       FROM lessons l
       WHERE l.user_id = ?
       ORDER BY l.created_at DESC`
    )
    .all(user.id) as LessonWithReflections[];

  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-bold">Lesson History</h1>
      <p className="text-lg text-slate-700">Open any past lesson without regenerating.</p>

      {lessons.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-lg text-slate-700">No lessons yet. Generate your first set of games from the dashboard.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {lessons.map((lesson) => {
            const gameCount = parseLessonGames(lesson).length;
            const reflectedGames = Math.min(gameCount, lesson.reflection_count);

            return (
              <Link href={`/generate/${lesson.id}`} key={lesson.id}>
                <Card className="transition hover:border-primary/40">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-xl">
                      {lesson.grade} • {lesson.subject}
                    </CardTitle>
                    <Badge>{new Date(lesson.created_at).toLocaleDateString()}</Badge>
                  </CardHeader>
                  <CardContent className="space-y-1 text-base text-slate-800">
                    <p>
                      Topic: {lesson.topic || "Core topic chosen by Inspire"} • Duration: {lesson.duration_minutes} min •
                      Students: {lesson.student_count}
                    </p>
                    <p>
                      Reflection status: {reflectedGames}/{gameCount} games logged
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
