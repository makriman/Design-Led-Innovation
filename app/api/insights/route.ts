import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import db, { getLatestInsightsCache, type ReflectionRow } from "@/lib/db";
import { generateInsightsWithClaude } from "@/lib/claude";
import { RefreshInsightsSchema } from "@/lib/schemas";
import { AUTH_COOKIE_NAME, requireApiUserFromCookie } from "@/lib/auth";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const user = await requireApiUserFromCookie(cookieStore.get(AUTH_COOKIE_NAME)?.value);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const parsedBody = RefreshInsightsSchema.safeParse(body);
    const forceRefresh = parsedBody.success ? parsedBody.data.forceRefresh : false;

    const reflections = db
      .prepare("SELECT * FROM reflections WHERE user_id = ? ORDER BY created_at DESC LIMIT 20")
      .all(user.id) as ReflectionRow[];

    const reflectionCountRow = db
      .prepare("SELECT COUNT(*) as count FROM reflections WHERE user_id = ?")
      .get(user.id) as { count: number };

    const reflectionCount = reflectionCountRow.count;
    const latestCache = getLatestInsightsCache(user.id);

    if (!forceRefresh && latestCache && latestCache.reflection_count_at_generation === reflectionCount) {
      return NextResponse.json({
        ...latestCache.parsed,
        reflectionCount,
        fromCache: true,
      });
    }

    const insights = await generateInsightsWithClaude(reflections);

    db.prepare(
      "INSERT INTO insights_cache (user_id, patterns_text, reflection_count_at_generation) VALUES (?, ?, ?)"
    ).run(user.id, JSON.stringify(insights), reflectionCount);

    return NextResponse.json({
      ...insights,
      reflectionCount,
      fromCache: false,
    });
  } catch {
    return NextResponse.json({ error: "Could not generate insights." }, { status: 500 });
  }
}
