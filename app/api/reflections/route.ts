import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getAllReflections,
  getLessonById,
  parseLessonGames,
  type ReflectionRow,
  upsertReflection,
} from "@/lib/db";
import { generateReflectionCoachingWithClaude } from "@/lib/claude";
import { ReflectionSchema } from "@/lib/schemas";
import { AUTH_COOKIE_NAME, requireUnlockedApiFromCookie } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const unlocked = requireUnlockedApiFromCookie(cookieStore.get(AUTH_COOKIE_NAME)?.value);
  if (!unlocked) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const normalized = {
      lessonId: Number(body.lessonId),
      gameIndex: Number(body.gameIndex),
      gameName: body.gameName,
      starRating: Number(body.starRating),
      teacherFeedback: typeof body.teacherFeedback === "string" ? body.teacherFeedback : undefined,
      whatWorked: typeof body.whatWorked === "string" ? body.whatWorked : undefined,
      whatFlopped: typeof body.whatFlopped === "string" ? body.whatFlopped : undefined,
      whatToChange: typeof body.whatToChange === "string" ? body.whatToChange : undefined,
    };

    const parsed = ReflectionSchema.safeParse(normalized);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid reflection payload." }, { status: 400 });
    }

    const lesson = await getLessonById(parsed.data.lessonId);
    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found." }, { status: 404 });
    }

    const games = parseLessonGames(lesson);
    if (!games[parsed.data.gameIndex]) {
      return NextResponse.json({ error: "Game index out of range." }, { status: 400 });
    }

    const teacherFeedback =
      parsed.data.teacherFeedback?.trim() ||
      [parsed.data.whatWorked, parsed.data.whatFlopped, parsed.data.whatToChange].filter(Boolean).join(" | ");

    const whatWorked = parsed.data.whatWorked?.trim() || teacherFeedback;
    const whatFlopped = parsed.data.whatFlopped?.trim() || "Teacher noted this in the main feedback field.";
    const whatToChange = parsed.data.whatToChange?.trim() || "Apply the AI coaching tips in the next lesson.";

    const coaching =
      (await generateReflectionCoachingWithClaude({
        gameName: parsed.data.gameName,
        starRating: parsed.data.starRating,
        teacherFeedback,
      }).catch(() => null)) ?? {
        summary: "Thanks for the reflection. You are building momentum every class.",
        tips: [
          "Keep instructions to one short sentence before starting the activity.",
          "Try one small change next class and compare learner response.",
        ],
        futurePlanNote: "Inspire will improve future plans using this feedback.",
      };

    await upsertReflection({
      lessonId: parsed.data.lessonId,
      gameIndex: parsed.data.gameIndex,
      gameName: parsed.data.gameName,
      starRating: parsed.data.starRating,
      teacherFeedback,
      aiCoaching: coaching,
      whatWorked,
      whatFlopped,
      whatToChange,
    });

    return NextResponse.json({ ok: true, coaching });
  } catch {
    return NextResponse.json({ error: "Could not save reflection." }, { status: 500 });
  }
}

export async function GET() {
  const cookieStore = await cookies();
  const unlocked = requireUnlockedApiFromCookie(cookieStore.get(AUTH_COOKIE_NAME)?.value);
  if (!unlocked) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const reflections = (await getAllReflections()) as ReflectionRow[];

  return NextResponse.json({ reflections });
}
