import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import db, { parseLessonGames, type LessonRow, type ReflectionRow } from "@/lib/db";
import { AUTH_COOKIE_NAME, requireApiUserFromCookie } from "@/lib/auth";

type LessonRouteProps = {
  params: { id: string } | Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: LessonRouteProps) {
  const cookieStore = await cookies();
  const user = await requireApiUserFromCookie(cookieStore.get(AUTH_COOKIE_NAME)?.value);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await Promise.resolve(params);

  const lesson = db
    .prepare("SELECT * FROM lessons WHERE id = ? AND user_id = ?")
    .get(Number(id), user.id) as LessonRow | undefined;

  if (!lesson) {
    return NextResponse.json({ error: "Lesson not found." }, { status: 404 });
  }

  const reflections = db
    .prepare("SELECT * FROM reflections WHERE user_id = ? AND lesson_id = ? ORDER BY created_at DESC")
    .all(user.id, lesson.id) as ReflectionRow[];

  return NextResponse.json({
    lesson: {
      id: lesson.id,
      grade: lesson.grade,
      studentCount: lesson.student_count,
      subject: lesson.subject,
      topic: lesson.topic,
      durationMinutes: lesson.duration_minutes,
      games: parseLessonGames(lesson),
      createdAt: lesson.created_at,
    },
    reflections,
  });
}
