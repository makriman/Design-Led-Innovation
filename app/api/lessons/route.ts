import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getReflectedGameIndicesByLessonIds,
  listLessonsPage,
  parseLessonGames,
} from "@/lib/db";
import { AUTH_COOKIE_NAME, requireUnlockedApiFromCookie } from "@/lib/auth";

const DEFAULT_LIMIT = 9;
const MAX_LIMIT = 24;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const unlocked = requireUnlockedApiFromCookie(cookieStore.get(AUTH_COOKIE_NAME)?.value);
  if (!unlocked) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const cursorRaw = searchParams.get("cursor");
  const limitRaw = searchParams.get("limit");

  const limitNumber = limitRaw ? Number(limitRaw) : DEFAULT_LIMIT;
  const limit = Number.isFinite(limitNumber)
    ? Math.min(MAX_LIMIT, Math.max(1, Math.floor(limitNumber)))
    : DEFAULT_LIMIT;

  const cursor = cursorRaw && Number.isFinite(Number(cursorRaw)) ? Number(cursorRaw) : null;
  const lessonPage = await listLessonsPage({ q, cursor, limit });
  const pageLessons = lessonPage.lessons;
  const lessonIds = pageLessons.map((lesson) => lesson.id);

  if (lessonIds.length === 0) {
    return NextResponse.json({
      lessons: [],
      nextCursor: null,
      hasMore: false,
    });
  }

  const reflectedMap = await getReflectedGameIndicesByLessonIds(lessonIds);

  const payload = pageLessons.map((lesson) => {
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

  return NextResponse.json({
    lessons: payload,
    hasMore: lessonPage.hasMore,
    nextCursor: lessonPage.nextCursor,
  });
}
