import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import db, { parseLessonGames, type LessonRow } from "@/lib/db";
import { AUTH_COOKIE_NAME, requireApiUserFromCookie } from "@/lib/auth";

export async function GET() {
  const cookieStore = await cookies();
  const user = await requireApiUserFromCookie(cookieStore.get(AUTH_COOKIE_NAME)?.value);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const lessons = db
    .prepare("SELECT * FROM lessons WHERE user_id = ? ORDER BY created_at DESC")
    .all(user.id) as LessonRow[];

  const reflectionRows = db
    .prepare("SELECT lesson_id, game_index FROM reflections WHERE user_id = ?")
    .all(user.id) as Array<{ lesson_id: number; game_index: number }>;

  const reflectedMap = new Map<number, Set<number>>();
  for (const row of reflectionRows) {
    if (!reflectedMap.has(row.lesson_id)) {
      reflectedMap.set(row.lesson_id, new Set<number>());
    }
    reflectedMap.get(row.lesson_id)?.add(row.game_index);
  }

  const payload = lessons.map((lesson) => {
    const games = parseLessonGames(lesson);
    const reflected = reflectedMap.get(lesson.id) ?? new Set<number>();

    return {
      id: lesson.id,
      grade: lesson.grade,
      studentCount: lesson.student_count,
      subject: lesson.subject,
      topic: lesson.topic,
      durationMinutes: lesson.duration_minutes,
      createdAt: lesson.created_at,
      reflectionStatusByGame: games.map((_, index) => reflected.has(index)),
    };
  });

  return NextResponse.json({ lessons: payload });
}
