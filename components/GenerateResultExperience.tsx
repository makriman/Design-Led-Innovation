"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Game } from "@/lib/schemas";
import { getGameImageUrl } from "@/lib/game-images";
import { ConfettiBurst } from "@/components/ConfettiBurst";

const LazyGameCard = dynamic(
  () => import("@/components/GameCard").then((module) => module.GameCard),
  { ssr: false }
);

type GenerateResultExperienceProps = {
  lessonId: number;
  grade: string;
  subject: string;
  games: Game[];
};

type RevealPhase = "loading" | "revealing" | "ready";

const MIN_PREP_MS = 700;

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function CardSkeleton() {
  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
      <div className="h-48 animate-pulse bg-slate-100" />
      <div className="space-y-3 p-5">
        <div className="h-5 w-3/4 animate-pulse rounded bg-slate-100" />
        <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
        <div className="h-4 w-5/6 animate-pulse rounded bg-slate-100" />
      </div>
    </article>
  );
}

export function GenerateResultExperience({ lessonId, grade, subject, games }: GenerateResultExperienceProps) {
  const searchParams = useSearchParams();
  const fromGenerator = searchParams.get("ready") === "1";
  const [phase, setPhase] = useState<RevealPhase>("loading");
  const [visibleCount, setVisibleCount] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  const cards = useMemo(
    () =>
      games.map((game, index) => ({
        game,
        index,
        imageUrl: getGameImageUrl(subject, index),
      })),
    [games, subject]
  );

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (fromGenerator) {
        setShowConfetti(true);
        await sleep(850);
        if (cancelled) return;
        setShowConfetti(false);
      }

      await sleep(MIN_PREP_MS);
      if (cancelled) return;
      setPhase("revealing");

      for (let i = 1; i <= cards.length; i += 1) {
        setVisibleCount(i);
        await sleep(180);
        if (cancelled) return;
      }

      setPhase("ready");
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [cards.length, fromGenerator]);

  return (
    <section className="relative space-y-5">
      <ConfettiBurst active={showConfetti} />

      <div className="no-print">
        {phase === "loading" ? (
          <div className="space-y-2">
            <div className="h-9 w-80 max-w-full animate-pulse rounded-lg bg-slate-100" />
            <div className="h-4 w-96 max-w-full animate-pulse rounded bg-slate-100" />
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Your 3 learning games are ready</h1>
            <p className="text-sm text-slate-500">
              Open each game, review the steps, and log feedback after class.
              {phase !== "ready" ? " Final touches loading..." : ""}
            </p>
          </>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map(({ game, index, imageUrl }) =>
          index < visibleCount ? (
            <LazyGameCard
              key={`${lessonId}-${index}`}
              lessonId={lessonId}
              gameIndex={index}
              initialGame={game}
              imageUrl={imageUrl}
              subject={subject}
              grade={grade}
            />
          ) : (
            <CardSkeleton key={`skeleton-${lessonId}-${index}`} />
          )
        )}
      </div>
    </section>
  );
}
