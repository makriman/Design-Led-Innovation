"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Loader2, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

const grades = ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8"];
const subjects = ["Maths", "History", "Chemistry", "Physics", "English", "Social Sciences"];
const durations = [15, 30, 45] as const;

function OptionTile({
  value,
  selected,
  onClick,
}: {
  value: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
        selected
          ? "border-primary/40 bg-primary/10 text-primary shadow-sm"
          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      {value}
    </button>
  );
}

export function LessonForm() {
  const router = useRouter();
  const [grade, setGrade] = useState<string | null>(null);
  const [subject, setSubject] = useState<string | null>(null);
  const [studentCount, setStudentCount] = useState(40);
  const [topic, setTopic] = useState("");
  const [durationMinutes, setDurationMinutes] = useState<(typeof durations)[number]>(30);
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isReady = Boolean(grade && subject);

  const primaryLabel = useMemo(() => {
    if (!grade) {
      return "Select a grade to begin";
    }
    if (!subject) {
      return "Select a subject to continue";
    }
    return "Make Learning Fun";
  }, [grade, subject]);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!grade || !subject) {
      setError("Select both grade and subject first.");
      return;
    }

    setIsLoading(true);
    const params = new URLSearchParams({
      grade,
      subject,
      studentCount: String(studentCount),
      durationMinutes: String(durationMinutes),
    });
    if (topic.trim()) {
      params.set("topic", topic.trim());
    }
    router.push(`/generate?${params.toString()}`);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-6 rounded-3xl border border-border bg-white p-6 shadow-[0_20px_40px_rgba(15,23,42,0.06)]"
    >
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-900">Select grade</h2>
        <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {grades.map((item) => (
            <OptionTile key={item} value={item} selected={grade === item} onClick={() => setGrade(item)} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-900">Select subject</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((item) => (
            <OptionTile key={item} value={item} selected={subject === item} onClick={() => setSubject(item)} />
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-slate-50/70">
        <button
          type="button"
          onClick={() => setShowFilters((current) => !current)}
          className="flex w-full items-center justify-between px-4 py-3 text-left"
        >
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
            <SlidersHorizontal className="h-4 w-4" />
            More filters (optional)
          </span>
          <ChevronDown className={`h-4 w-4 text-slate-500 transition ${showFilters ? "rotate-180" : ""}`} />
        </button>

        {showFilters ? (
          <div className="space-y-4 border-t border-slate-200 px-4 py-4">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label htmlFor="studentCount" className="mb-0 text-sm font-semibold text-slate-700">
                  Number of learners
                </Label>
                <span className="text-sm font-bold text-slate-700">{studentCount}</span>
              </div>
              <Slider id="studentCount" value={studentCount} onChange={setStudentCount} min={10} max={120} step={1} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="topic" className="text-sm font-semibold text-slate-700">
                Topic (optional)
              </Label>
              <Input
                id="topic"
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                placeholder="e.g. fractions, ecosystems"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">Total duration</Label>
              <div className="flex flex-wrap gap-2">
                {durations.map((duration) => {
                  const selected = durationMinutes === duration;
                  return (
                    <button
                      type="button"
                      key={duration}
                      onClick={() => setDurationMinutes(duration)}
                      className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                        selected
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                      }`}
                    >
                      {duration} min
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}
      </section>

      {error ? <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

      <Button type="submit" size="lg" variant="default" className="w-full rounded-2xl" disabled={!isReady || isLoading}>
        {isLoading ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Opening generator...
          </span>
        ) : (
          <span>{primaryLabel}</span>
        )}
      </Button>
    </form>
  );
}
