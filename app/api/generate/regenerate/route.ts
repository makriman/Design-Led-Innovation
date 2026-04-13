import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import db, { replaceGameInLesson, type LessonRow } from "@/lib/db";
import { generateGamesWithClaude } from "@/lib/claude";
import { GenerateRequestSchema } from "@/lib/schemas";
import { AUTH_COOKIE_NAME, requireApiUserFromCookie } from "@/lib/auth";

const RegenerateSchema = z.object({
  lessonId: z.number().int().positive(),
  gameIndex: z.number().int().min(0).max(2),
});

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const user = await requireApiUserFromCookie(cookieStore.get(AUTH_COOKIE_NAME)?.value);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = RegenerateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid regenerate request." }, { status: 400 });
    }

    const lesson = db
      .prepare("SELECT * FROM lessons WHERE id = ? AND user_id = ?")
      .get(parsed.data.lessonId, user.id) as LessonRow | undefined;

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found." }, { status: 404 });
    }

    const lessonContext = GenerateRequestSchema.parse({
      grade: lesson.grade,
      studentCount: lesson.student_count,
      subject: lesson.subject,
      topic: lesson.topic ?? "",
      durationMinutes: lesson.duration_minutes,
    });

    const generated = await generateGamesWithClaude(lessonContext);

    const nextGame = generated.games[parsed.data.gameIndex];
    const updatedGames = replaceGameInLesson(lesson.id, parsed.data.gameIndex, nextGame);

    if (!updatedGames) {
      return NextResponse.json({ error: "Could not update lesson." }, { status: 500 });
    }

    return NextResponse.json({ game: nextGame, games: updatedGames });
  } catch {
    return NextResponse.json({ error: "Failed to regenerate game." }, { status: 500 });
  }
}
