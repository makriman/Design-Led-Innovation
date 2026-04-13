import { PatternCard } from "@/components/PatternCard";
import { RefreshInsightsButton } from "@/components/RefreshInsightsButton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import db, { getLatestInsightsCache, type ReflectionRow } from "@/lib/db";
import { requireSessionUser } from "@/lib/server-auth";

function calculateStreak(reflections: ReflectionRow[]) {
  if (reflections.length === 0) {
    return 0;
  }

  const uniqueDays = new Set(
    reflections.map((reflection) => new Date(reflection.created_at).toISOString().slice(0, 10))
  );

  let streak = 0;
  const cursor = new Date();

  while (true) {
    const key = cursor.toISOString().slice(0, 10);
    if (!uniqueDays.has(key)) {
      break;
    }
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export default async function InsightsPage() {
  const user = await requireSessionUser();

  const totalLessons = db.prepare("SELECT COUNT(*) as count FROM lessons WHERE user_id = ?").get(user.id) as {
    count: number;
  };

  const reflections = db
    .prepare("SELECT * FROM reflections WHERE user_id = ? ORDER BY created_at DESC")
    .all(user.id) as ReflectionRow[];

  const recentReflections = reflections.slice(0, 5);
  const insightsCache = getLatestInsightsCache(user.id);

  const totalGamesRun = reflections.length;
  const totalReflections = reflections.length;
  const streak = calculateStreak(reflections);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Insights</h1>
          <p className="text-lg text-slate-700">Patterns from your reflections, in plain language.</p>
        </div>
        <RefreshInsightsButton />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total games run</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">{totalGamesRun}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Reflections logged</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">{totalReflections}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Current streak</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">{streak} day{streak === 1 ? "" : "s"}</p>
          </CardContent>
        </Card>
      </div>

      <section className="space-y-3">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">Patterns Inspire noticed</h2>
          <Badge>Lessons: {totalLessons.count}</Badge>
        </div>

        {insightsCache ? (
          <>
            <p className="text-base text-slate-700">
              Insights based on your last {insightsCache.reflection_count_at_generation} reflections.
            </p>
            {insightsCache.parsed.patterns.length > 0 ? (
              <div className="space-y-3">
                {insightsCache.parsed.patterns.map((pattern, idx) => (
                  <PatternCard key={idx} observation={pattern.observation} tip={pattern.tip} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent>
                  <p className="text-lg text-slate-700">
                    {insightsCache.parsed.message ||
                      "Add a few more reflections and then tap Refresh insights to see patterns."}
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <Card>
            <CardContent>
              <p className="text-lg text-slate-700">
                No insights yet. Tap <span className="font-semibold text-primary">Refresh insights</span> to generate
                your first pattern summary.
              </p>
            </CardContent>
          </Card>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-bold">Recent reflections</h2>
        {recentReflections.length === 0 ? (
          <Card>
            <CardContent>
              <p className="text-lg text-slate-700">No reflections yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {recentReflections.map((reflection) => (
              <Card key={reflection.id}>
                <CardHeader>
                  <CardTitle className="text-xl">{reflection.game_name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-base text-slate-800">
                  <p>
                    <span className="font-semibold text-primary">Worked:</span> {reflection.what_worked}
                  </p>
                  <p>
                    <span className="font-semibold text-primary">Flopped:</span> {reflection.what_flopped}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
