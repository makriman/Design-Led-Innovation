import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import db, { parseLessonGames, type LessonRow, type ReflectionRow } from "@/lib/db";
import { ReflectionSchema } from "@/lib/schemas";
import { AUTH_COOKIE_NAME, requireApiUserFromCookie } from "@/lib/auth";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const user = await requireApiUserFromCookie(cookieStore.get(AUTH_COOKIE_NAME)?.value);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const normalized = {
      lessonId: Number(body.lessonId),
      gameIndex: Number(body.gameIndex),
      gameName: body.gameName,
      whatWorked: body.whatWorked,
      whatFlopped: body.whatFlopped,
      whatToChange: body.whatToChange,
    };

    const parsed = ReflectionSchema.safeParse(normalized);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid reflection payload." }, { status: 400 });
    }

    const lesson = db
      .prepare("SELECT * FROM lessons WHERE id = ? AND user_id = ?")
      .get(parsed.data.lessonId, user.id) as LessonRow | undefined;

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found." }, { status: 404 });
    }

    const games = parseLessonGames(lesson);
    if (!games[parsed.data.gameIndex]) {
      return NextResponse.json({ error: "Game index out of range." }, { status: 400 });
    }

    const existing = db
      .prepare("SELECT id FROM reflections WHERE user_id = ? AND lesson_id = ? AND game_index = ?")
      .get(user.id, parsed.data.lessonId, parsed.data.gameIndex) as { id: number } | undefined;

    if (existing) {
      db.prepare(
        `UPDATE reflections
         SET game_name = ?, what_worked = ?, what_flopped = ?, what_to_change = ?, created_at = CURRENT_TIMESTAMP
         WHERE id = ?`
      ).run(
        parsed.data.gameName,
        parsed.data.whatWorked,
        parsed.data.whatFlopped,
        parsed.data.whatToChange,
        existing.id
      );
    } else {
      db.prepare(
        `INSERT INTO reflections (user_id, lesson_id, game_index, game_name, what_worked, what_flopped, what_to_change)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).run(
        user.id,
        parsed.data.lessonId,
        parsed.data.gameIndex,
        parsed.data.gameName,
        parsed.data.whatWorked,
        parsed.data.whatFlopped,
        parsed.data.whatToChange
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not save reflection." }, { status: 500 });
  }
}

export async function GET() {
  const cookieStore = await cookies();
  const user = await requireApiUserFromCookie(cookieStore.get(AUTH_COOKIE_NAME)?.value);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const reflections = db
    .prepare("SELECT * FROM reflections WHERE user_id = ? ORDER BY created_at DESC")
    .all(user.id) as ReflectionRow[];

  return NextResponse.json({ reflections });
}
