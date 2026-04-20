"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Loader2, Sparkles, Star } from "lucide-react";
import { RatingMoodAnimation } from "@/components/RatingMoodAnimation";
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

const lowRatingReasonOptions = [
  "Learners did not understand instructions",
  "Game was too difficult for this class",
  "Game was too easy and lost attention",
  "Class became too noisy or chaotic",
  "Timing was too short or too long",
  "Materials setup failed in class",
];

const lowRatingContextOptions = [
  "Large class management was hard",
  "Mixed ability levels slowed progress",
  "Language clarity was an issue",
  "Space in classroom was limited",
  "Unexpected interruptions happened",
  "Energy and behavior were low",
];

const lowRatingSupportOptions = [
  "Need a simpler version next class",
  "Need clearer step-by-step script",
  "Need better transition strategy",
  "Need adaptation for large classes",
  "Need stronger assessment cues",
  "Need alternative low-material setup",
];

function FeedbackTileGroup({
  title,
  options,
  value,
  onSelect,
}: {
  title: string;
  options: string[];
  value: string;
  onSelect: (next: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold text-slate-700">{title}</Label>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((option) => {
          const selected = option === value;
          return (
            <button
              key={option}
              type="button"
              onClick={() => onSelect(option)}
              className={`rounded-xl border px-3 py-3 text-left text-sm font-medium transition ${
                selected
                  ? "border-primary/40 bg-primary/10 text-primary shadow-sm"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ReflectionForm({ lessonId, gameIndex, gameName }: ReflectionFormProps) {
  const [starRating, setStarRating] = useState(0);
  const [teacherFeedback, setTeacherFeedback] = useState("");
  const [lowRatingReason, setLowRatingReason] = useState("");
  const [lowRatingContext, setLowRatingContext] = useState("");
  const [lowRatingSupport, setLowRatingSupport] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coaching, setCoaching] = useState<CoachingResponse | null>(null);
  const isLowRating = starRating > 0 && starRating <= 2;

  useEffect(() => {
    if (starRating > 2) {
      setLowRatingReason("");
      setLowRatingContext("");
      setLowRatingSupport("");
    }
  }, [starRating]);

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

    if (isLowRating && (!lowRatingReason || !lowRatingContext || !lowRatingSupport)) {
      setError("Please select the low-rating details so we can improve the next plan.");
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
          lowRatingReason: lowRatingReason || undefined,
          lowRatingContext: lowRatingContext || undefined,
          lowRatingSupport: lowRatingSupport || undefined,
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
        <p className="text-sm text-slate-500">Interactive review + fast coaching for your next class.</p>
      </CardHeader>

      <CardContent>
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <Label className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Star rating</Label>
            <div className="flex flex-wrap items-center gap-2">
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

          <RatingMoodAnimation rating={starRating} />

          {isLowRating ? (
            <section className="space-y-3 rounded-2xl border border-amber-300 bg-amber-50/60 p-4">
              <p className="text-sm font-semibold text-amber-800">
                Thanks for being honest. Help us capture what failed so the next plan improves.
              </p>

              <FeedbackTileGroup
                title="Main issue"
                options={lowRatingReasonOptions}
                value={lowRatingReason}
                onSelect={setLowRatingReason}
              />

              <FeedbackTileGroup
                title="Classroom factor"
                options={lowRatingContextOptions}
                value={lowRatingContext}
                onSelect={setLowRatingContext}
              />

              <FeedbackTileGroup
                title="Most useful support for next class"
                options={lowRatingSupportOptions}
                value={lowRatingSupport}
                onSelect={setLowRatingSupport}
              />
            </section>
          ) : null}

          <div>
            <Label htmlFor="teacherFeedback" className="text-sm font-semibold text-slate-700">
              How did it go?
            </Label>
            <Textarea
              id="teacherFeedback"
              required
              value={teacherFeedback}
              onChange={(event) => setTeacherFeedback(event.target.value)}
              placeholder="What happened in class? Share one win and one thing to improve."
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
