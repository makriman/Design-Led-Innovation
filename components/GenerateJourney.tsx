"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import { ConfettiBurst } from "@/components/ConfettiBurst";
import { Button } from "@/components/ui/button";
import styles from "./GenerateFlow.module.css";

type Phase = "loading" | "celebrating" | "error";

const allowedGrades = new Set([
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
  "Grade 7",
  "Grade 8",
]);

const allowedSubjects = new Set([
  "Maths",
  "History",
  "Chemistry",
  "Physics",
  "English",
  "Social Sciences",
]);

const allowedDurations = new Set([15, 30, 45]);
const MIN_WAIT_MS = 2100;
const CONFETTI_MS = 1400;

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export function GenerateJourney() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasStartedRef = useRef(false);

  const [phase, setPhase] = useState<Phase>("loading");
  const [error, setError] = useState<string | null>(null);
  const [stageIndex, setStageIndex] = useState(0);

  const payload = useMemo(() => {
    const grade = (searchParams.get("grade") || "").trim();
    const subject = (searchParams.get("subject") || "").trim();
    const topic = (searchParams.get("topic") || "").trim();
    const studentCount = Number(searchParams.get("studentCount") || "");
    const durationMinutes = Number(searchParams.get("durationMinutes") || "");

    if (
      !allowedGrades.has(grade) ||
      !allowedSubjects.has(subject) ||
      !Number.isInteger(studentCount) ||
      studentCount < 10 ||
      studentCount > 120 ||
      !allowedDurations.has(durationMinutes)
    ) {
      return null;
    }

    return {
      grade,
      subject,
      topic,
      studentCount,
      durationMinutes,
    };
  }, [searchParams]);

  useEffect(() => {
    if (phase !== "loading") {
      return;
    }

    const interval = window.setInterval(() => {
      setStageIndex((current) => (current + 1) % 4);
    }, 920);

    return () => window.clearInterval(interval);
  }, [phase]);

  useEffect(() => {
    if (hasStartedRef.current) {
      return;
    }
    hasStartedRef.current = true;

    if (!payload) {
      setPhase("error");
      setError("Missing generation details. Please start again from dashboard.");
      return;
    }

    const run = async () => {
      const startedAt = Date.now();

      try {
        const response = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = (await response.json()) as { lessonId?: number; error?: string };
        if (!response.ok || !data.lessonId) {
          throw new Error(data.error || "Could not generate your lesson.");
        }

        const elapsed = Date.now() - startedAt;
        if (elapsed < MIN_WAIT_MS) {
          await sleep(MIN_WAIT_MS - elapsed);
        }

        setPhase("celebrating");
        await sleep(CONFETTI_MS);
        router.replace(`/generate/${data.lessonId}?ready=1`);
      } catch (caughtError) {
        setPhase("error");
        setError(caughtError instanceof Error ? caughtError.message : "Could not generate your lesson.");
      }
    };

    void run();
  }, [payload, router]);

  const stageCopy = [
    "Designing game structure...",
    "Balancing class difficulty...",
    "Preparing activity variations...",
    "Finalizing your lesson set...",
  ];

  if (phase === "error") {
    return (
      <section className="mx-auto max-w-2xl space-y-4 rounded-3xl border border-rose-200 bg-white p-8">
        <h1 className="text-2xl font-black tracking-tight text-slate-900">Could not generate this lesson</h1>
        <p className="text-sm text-slate-600">{error || "Please try again."}</p>
        <Link href="/dashboard">
          <Button className="rounded-xl">Back to dashboard</Button>
        </Link>
      </section>
    );
  }

  return (
    <section className={`mx-auto max-w-3xl space-y-6 rounded-3xl p-8 ${styles.shell}`}>
      <ConfettiBurst active={phase === "celebrating"} />

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">Inspire Generator</p>
        <h1 className="text-3xl font-black tracking-tight text-slate-900">
          {phase === "celebrating" ? "Ready to play!" : "Building your games..."}
        </h1>
        <p className="text-sm text-slate-600">
          {phase === "celebrating"
            ? "Your lesson set is complete. Opening it now."
            : "You can review this plan in a moment. We are preparing it now."}
        </p>
      </div>

      <div className={styles.pulseBar} />

      <div className="flex items-center gap-4 rounded-2xl border border-primary/10 bg-white/80 p-4">
        <div className={styles.spinnerWrap}>
          {phase === "celebrating" ? (
            <Sparkles className="h-8 w-8 text-primary" />
          ) : (
            <>
              <Loader2 className="absolute h-9 w-9 animate-spin text-primary/30" />
              <span className={styles.spinnerDot} />
            </>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-900">{phase === "celebrating" ? "Your lesson is ready." : stageCopy[stageIndex]}</p>
          <p className="text-xs text-slate-500">Images and cards will load progressively once opened.</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className={`${styles.skeletonBox} h-36`} />
        <div className={`${styles.skeletonBox} h-36`} />
        <div className={`${styles.skeletonBox} h-36`} />
      </div>
    </section>
  );
}
