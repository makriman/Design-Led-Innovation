"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2, Sparkles, Star } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type CoachingResponse = {
  summary: string;
  tips: string[];
  futurePlanNote: string;
};

type ReflectionFormProps = {
  lessonId: number;
  gameIndex: number;
  gameName: string;
};

export function ReflectionForm({ lessonId, gameIndex, gameName }: ReflectionFormProps) {
  const [starRating, setStarRating] = useState(0);
  const [teacherFeedback, setTeacherFeedback] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coaching, setCoaching] = useState<CoachingResponse | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setCoaching(null);

    if (starRating < 1) {
      setError("Please select a star rating first.");
      return;
    }

    if (teacherFeedback.trim().length < 3) {
      setError("Please share a quick note about how the game went.");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/reflections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId,
          gameIndex,
          gameName,
          starRating,
          teacherFeedback,
        }),
      });

      const data = (await response.json()) as { coaching?: CoachingResponse; error?: string };
      if (!response.ok || !data.coaching) {
        setError(data.error ?? "Could not save reflection.");
        return;
      }

      setCoaching(data.coaching);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card className="mx-auto w-full max-w-3xl rounded-3xl border-slate-200">
      <CardHeader>
        <CardTitle className="text-2xl font-black tracking-tight text-slate-900">I played: {gameName}</CardTitle>
        <p className="text-sm text-slate-500">Share quick feedback and get AI coaching for next time.</p>
      </CardHeader>

      <CardContent>
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <Label className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Star rating</Label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setStarRating(value)}
                  className="rounded-md p-1 transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  aria-label={`${value} star${value === 1 ? "" : "s"}`}
                >
                  <Star className={`h-8 w-8 ${value <= starRating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />
                </button>
              ))}
              <span className="ml-2 text-sm font-semibold text-slate-700">
                {starRating > 0 ? `${starRating}/5` : "No rating yet"}
              </span>
            </div>
          </div>

          <div>
            <Label htmlFor="teacherFeedback" className="text-sm font-semibold text-slate-700">
              How did it go?
            </Label>
            <Textarea
              id="teacherFeedback"
              required
              value={teacherFeedback}
              onChange={(event) => setTeacherFeedback(event.target.value)}
              placeholder="What happened in class? What should change next time?"
            />
          </div>

          {error ? <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

          <Button type="submit" variant="accent" size="lg" className="w-full rounded-2xl" disabled={isSaving}>
            {isSaving ? (
              <span className="inline-flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting feedback...
              </span>
            ) : (
              "Submit feedback"
            )}
          </Button>
        </form>

        {coaching ? (
          <section className="mt-6 space-y-4 rounded-2xl border border-primary/20 bg-primary/5 p-5">
            <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-primary">
              <Sparkles className="h-4 w-4" />
              AI coaching
            </p>
            <p className="text-sm text-slate-700">{coaching.summary}</p>
            <ul className="list-disc space-y-1 pl-6 text-sm text-slate-700">
              {coaching.tips.map((tip, index) => (
                <li key={`${tip}-${index}`}>{tip}</li>
              ))}
            </ul>
            <p className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-700">{coaching.futurePlanNote}</p>

            <div className="grid gap-2 sm:grid-cols-2">
              <Link href="/dashboard" className={cn(buttonVariants({ variant: "outline" }), "rounded-xl")}>
                Back to dashboard
              </Link>
              <Link href="/insights" className={cn(buttonVariants({ variant: "accent" }), "rounded-xl")}>
                View insights
              </Link>
            </div>
          </section>
        ) : null}
      </CardContent>
    </Card>
  );
}
