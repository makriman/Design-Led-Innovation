import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getLessonById, getReflectionsByLessonId, parseLessonGames } from "@/lib/db";
import { AUTH_COOKIE_NAME, requireUnlockedApiFromCookie } from "@/lib/auth";

type LessonRouteProps = {
  params: Promise<{ id: string }>;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: LessonRouteProps) {
  const cookieStore = await cookies();
  const unlocked = requireUnlockedApiFromCookie(cookieStore.get(AUTH_COOKIE_NAME)?.value);
  if (!unlocked) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;

  const lesson = await getLessonById(Number(id));
  if (!lesson) {
    return NextResponse.json({ error: "Lesson not found." }, { status: 404 });
  }

  const reflections = await getReflectionsByLessonId(lesson.id);

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
