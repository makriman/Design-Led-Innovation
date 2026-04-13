"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type ReflectionFormProps = {
  lessonId: number;
  gameIndex: number;
  gameName: string;
};

export function ReflectionForm({ lessonId, gameIndex, gameName }: ReflectionFormProps) {
  const router = useRouter();
  const [step, setStep] = useState<"rating" | "feedback">("rating");
  const [starRating, setStarRating] = useState(0);
  const [whatWorked, setWhatWorked] = useState("");
  const [whatFlopped, setWhatFlopped] = useState("");
  const [whatToChange, setWhatToChange] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function continueToFeedback() {
    if (starRating < 1) {
      setError("Please select a star rating first.");
      return;
    }
    setError(null);
    setStep("feedback");
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
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
          whatWorked,
          whatFlopped,
          whatToChange,
        }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "Could not save reflection.");
        return;
      }

      router.push("/insights");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card className="mx-auto w-full max-w-3xl">
      <CardHeader>
        <CardTitle>Reflect on: {gameName}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="rounded-lg border border-border bg-neutral p-4">
            <Label className="mb-3 text-lg">1. Star rating first</Label>
            <p className="mb-3 text-base text-slate-700">How did this game go overall?</p>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setStarRating(value)}
                  className="rounded-md p-1 transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label={`${value} star${value === 1 ? "" : "s"}`}
                >
                  <Star
                    className={`h-8 w-8 ${value <= starRating ? "fill-yellow-400 text-yellow-400" : "text-slate-400"}`}
                  />
                </button>
              ))}
              <span className="ml-2 text-base font-semibold text-primary">
                {starRating > 0 ? `${starRating}/5` : "No rating yet"}
              </span>
            </div>
          </div>

          {step === "rating" ? (
            <Button type="button" variant="accent" size="lg" className="w-full" onClick={continueToFeedback}>
              Continue to feedback
            </Button>
          ) : (
            <>
              <div className="rounded-lg border border-border p-4">
                <Label className="mb-1 text-lg">2. Feedback</Label>
                <p className="text-base text-slate-700">
                  You picked <span className="font-semibold text-primary">{starRating}/5</span>. Add details below.
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  className="mt-2 px-0 text-base underline"
                  onClick={() => setStep("rating")}
                >
                  Change rating
                </Button>
              </div>

              <div>
                <Label htmlFor="worked">What worked?</Label>
                <Textarea
                  id="worked"
                  required
                  value={whatWorked}
                  onChange={(e) => setWhatWorked(e.target.value)}
                  placeholder="What helped learners engage and understand?"
                />
              </div>

              <div>
                <Label htmlFor="flopped">What flopped?</Label>
                <Textarea
                  id="flopped"
                  required
                  value={whatFlopped}
                  onChange={(e) => setWhatFlopped(e.target.value)}
                  placeholder="What did not go as planned?"
                />
              </div>

              <div>
                <Label htmlFor="change">What would you change next time?</Label>
                <Textarea
                  id="change"
                  required
                  value={whatToChange}
                  onChange={(e) => setWhatToChange(e.target.value)}
                  placeholder="One practical change for next class"
                />
              </div>
            </>
          )}

          {error ? <p className="rounded-lg bg-red-50 p-3 text-base text-red-700">{error}</p> : null}

          {step === "feedback" ? (
            <Button type="submit" variant="accent" size="lg" className="w-full" disabled={isSaving}>
              {isSaving ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" /> Saving reflection...
                </span>
              ) : (
                "Save reflection"
              )}
            </Button>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}
