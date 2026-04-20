import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  createInsightsSnapshot,
  getLatestInsightsSnapshot,
  getRecentReflections,
  getReflectionCount,
} from "@/lib/db";
import { generateInsightsWithClaude } from "@/lib/claude";
import { RefreshInsightsSchema } from "@/lib/schemas";
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
    const body = await request.json().catch(() => ({}));
    const parsedBody = RefreshInsightsSchema.safeParse(body);
    const forceRefresh = parsedBody.success ? parsedBody.data.forceRefresh : false;

    const reflections = await getRecentReflections(20);
    const reflectionCount = await getReflectionCount();
    const latestCache = await getLatestInsightsSnapshot();

    if (!forceRefresh && latestCache && latestCache.reflection_count_at_generation === reflectionCount) {
      return NextResponse.json({
        ...latestCache.parsed,
        reflectionCount,
        fromCache: true,
      });
    }

    const insights = await generateInsightsWithClaude(reflections, { bypassCache: forceRefresh });
    await createInsightsSnapshot({ insights, reflectionCount });

    return NextResponse.json({
      ...insights,
      reflectionCount,
      fromCache: false,
    });
  } catch {
    return NextResponse.json({ error: "Could not generate insights." }, { status: 500 });
  }
}
