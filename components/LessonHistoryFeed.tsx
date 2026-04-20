"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, Clock3, Loader2, Search, Users } from "lucide-react";

type LessonSummary = {
  id: number;
  grade: string;
  studentCount: number;
  subject: string;
  topic: string | null;
  durationMinutes: number;
  createdAt: string;
  reflectionStatusByGame: boolean[];
};

type LessonsResponse = {
  lessons: LessonSummary[];
  hasMore: boolean;
  nextCursor: number | null;
};

type LessonHistoryFeedProps = {
  title?: string;
  subtitle?: string;
};

export function LessonHistoryFeed({ title = "History", subtitle = "Search past learning plans" }: LessonHistoryFeedProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [lessons, setLessons] = useState<LessonSummary[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const requestKeyRef = useRef(0);
  const cursorRef = useRef<number | null>(null);
  const loadingRef = useRef(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [query]);

  const fetchLessons = useCallback(
    async (reset: boolean) => {
      if (loadingRef.current) {
        return;
      }

      loadingRef.current = true;
      setLoading(true);
      setError(null);
      const requestKey = requestKeyRef.current + 1;
      requestKeyRef.current = requestKey;

      try {
        const search = new URLSearchParams();
        search.set("limit", "9");
        if (debouncedQuery) {
          search.set("q", debouncedQuery);
        }
        const activeCursor = reset ? null : cursorRef.current;
        if (activeCursor !== null) {
          search.set("cursor", String(activeCursor));
        }

        const response = await fetch(`/api/lessons?${search.toString()}`, { cache: "no-store" });
        const data = (await response.json()) as LessonsResponse & { error?: string };

        if (!response.ok) {
          throw new Error(data.error ?? "Could not load lesson history.");
        }

        if (requestKey !== requestKeyRef.current) {
          return;
        }

        setLessons((current) => (reset ? data.lessons : [...current, ...data.lessons]));
        cursorRef.current = data.nextCursor;
        setHasMore(data.hasMore);
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : "Could not load lesson history.");
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [debouncedQuery]
  );

  useEffect(() => {
    setLessons([]);
    cursorRef.current = null;
    setHasMore(true);
  }, [debouncedQuery]);

  useEffect(() => {
    fetchLessons(true);
  }, [debouncedQuery, fetchLessons]);

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel || !hasMore || loading) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          fetchLessons(false);
        }
      },
      { rootMargin: "200px 0px 200px 0px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchLessons, hasMore, loading]);

  const emptyMessage = useMemo(() => {
    if (debouncedQuery) {
      return `No lessons match "${debouncedQuery}".`;
    }
    return "No plans yet. Generate one above to get started.";
  }, [debouncedQuery]);

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-500">{subtitle}</p>
      </div>

      <div className="rounded-full border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <label htmlFor="history-search" className="sr-only">
          Search lesson history
        </label>
        <div className="flex items-center gap-3">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            id="history-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by grade, subject, or topic"
            className="w-full border-none bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
          />
        </div>
      </div>

      {error ? <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

      {lessons.length === 0 && !loading ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-500">
          {emptyMessage}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lessons.map((lesson) => {
            const reflected = lesson.reflectionStatusByGame.filter(Boolean).length;
            const total = lesson.reflectionStatusByGame.length;

            return (
              <Link
                key={lesson.id}
                href={`/generate/${lesson.id}`}
                className="group rounded-3xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
              >
                <div className="mb-4 overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-gold/10 to-white p-4">
                  <p className="text-sm font-semibold text-slate-500">
                    {lesson.grade} · {lesson.subject}
                  </p>
                  <p className="mt-1 text-lg font-bold text-slate-900">{lesson.topic || "Core lesson objective"}</p>
                </div>

                <div className="space-y-2 text-sm text-slate-600">
                  <p className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-slate-400" /> {lesson.studentCount} learners
                  </p>
                  <p className="flex items-center gap-2">
                    <Clock3 className="h-4 w-4 text-slate-400" /> {lesson.durationMinutes} min total
                  </p>
                  <p className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-slate-400" />{" "}
                    {new Date(lesson.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <p className="mt-4 text-sm font-semibold text-primary">
                  {reflected}/{total} games reflected
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-700 group-hover:text-slate-900">Open plan</p>
              </Link>
            );
          })}
        </div>
      )}

      <div ref={loadMoreRef} className="flex min-h-10 items-center justify-center py-2">
        {loading ? (
          <span className="inline-flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading plans...
          </span>
        ) : null}
        {!hasMore && lessons.length > 0 ? <span className="text-xs text-slate-400">You are all caught up.</span> : null}
      </div>
    </section>
  );
}
