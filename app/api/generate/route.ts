import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createLesson } from "@/lib/db";
import { generateGamesWithClaude } from "@/lib/claude";
import { GenerateRequestSchema } from "@/lib/schemas";
import { AUTH_COOKIE_NAME, requireApiUserFromCookie } from "@/lib/auth";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const user = await requireApiUserFromCookie(cookieStore.get(AUTH_COOKIE_NAME)?.value);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = GenerateRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid lesson form data." }, { status: 400 });
    }

    const generation = await generateGamesWithClaude(parsed.data);

    const lessonId = createLesson({
      userId: user.id,
      grade: parsed.data.grade,
      studentCount: parsed.data.studentCount,
      subject: parsed.data.subject,
      topic: parsed.data.topic?.trim() || null,
      durationMinutes: parsed.data.durationMinutes,
      games: generation.games,
    });

    return NextResponse.json({ lessonId, games: generation.games });
  } catch {
    return NextResponse.json({ error: "Failed to generate games." }, { status: 500 });
  }
}
