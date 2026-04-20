"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, MapPin, Sparkles, Users, X } from "lucide-react";
import type { Game } from "@/lib/schemas";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type GameCardProps = {
  lessonId: number;
  gameIndex: number;
  initialGame: Game;
  imageUrl: string;
  subject: string;
  grade: string;
};

export function GameCard({ lessonId, gameIndex, initialGame, imageUrl, subject, grade }: GameCardProps) {
  const [game, setGame] = useState(initialGame);
  const [isOpen, setIsOpen] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const materialLabel = useMemo(() => {
    if (game.materials.length === 1) {
      return "1 material";
    }
    return `${game.materials.length} materials`;
  }, [game.materials.length]);

  async function regenerateThisGame() {
    setError(null);
    setIsRegenerating(true);

    try {
      const response = await fetch("/api/generate/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, gameIndex }),
      });

      const data = (await response.json()) as { game?: Game; error?: string };

      if (!response.ok || !data.game) {
        setError(data.error ?? "Could not refresh this game.");
        return;
      }

      setGame(data.game);
      setSaveMessage("Updated and saved to this lesson.");
      setTimeout(() => setSaveMessage(null), 2500);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsRegenerating(false);
    }
  }

  return (
    <>
      <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg">
        <div className="relative h-48 overflow-hidden">
          <img
            src={imageUrl}
            alt={`${game.name} classroom inspiration`}
            className="h-full w-full object-cover transition duration-500 hover:scale-105"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 backdrop-blur">
            Game {gameIndex + 1}
          </span>
        </div>

        <div className="space-y-3 p-5">
          <h3 className="line-clamp-2 text-xl font-bold text-slate-900">{game.name}</h3>
          <p className="line-clamp-3 text-sm text-slate-600">{game.objective}</p>

          <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
            <span className="rounded-full bg-slate-100 px-3 py-1">{subject}</span>
            <span className="rounded-full bg-slate-100 px-3 py-1">{grade}</span>
            <span className="rounded-full bg-slate-100 px-3 py-1">{materialLabel}</span>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1 rounded-xl" onClick={() => setIsOpen(true)}>
              More
            </Button>
            <Link
              href={`/reflect/${lessonId}/${gameIndex}`}
              className={cn(buttonVariants({ variant: "accent", size: "sm" }), "flex-1 rounded-xl")}
            >
              I played this
            </Link>
          </div>
        </div>
      </article>

      {isOpen ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/45 px-4 py-6">
          <div className="mx-auto w-full max-w-3xl rounded-3xl bg-white shadow-2xl">
            <div className="relative h-56 overflow-hidden rounded-t-3xl">
              <img
                src={imageUrl}
                alt={`${game.name} classroom inspiration`}
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-slate-700 hover:bg-white"
                aria-label="Close details"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div>
                <h3 className="text-2xl font-black tracking-tight text-slate-900">{game.name}</h3>
                <p className="mt-2 text-sm text-slate-600">{game.objective}</p>
              </div>

              <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
                <p className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2">
                  <MapPin className="h-4 w-4" /> {subject}
                </p>
                <p className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2">
                  <Users className="h-4 w-4" /> {grade}
                </p>
                <p className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2">
                  <Sparkles className="h-4 w-4" /> {materialLabel}
                </p>
              </div>

              <Section title="Materials needed" items={game.materials} bullet />
              <Section title="Setup" items={game.setup} />
              <Section title="How to play" items={game.howToPlay} ordered />
              <Section title="Teacher script" items={game.teacherScript} />
              <Section title="Assessment cues" items={game.assessmentCues} bullet />

              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                <p className="font-semibold text-slate-900">Class size variations</p>
                <p className="mt-2">
                  <span className="font-semibold">Larger class:</span> {game.variations.largerClass}
                </p>
                <p className="mt-1">
                  <span className="font-semibold">Smaller class:</span> {game.variations.smallerClass}
                </p>
              </div>

              {error ? <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
              {saveMessage ? <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{saveMessage}</p> : null}

              <div className="grid gap-2 sm:grid-cols-3">
                <Button onClick={regenerateThisGame} variant="outline" className="rounded-xl" disabled={isRegenerating}>
                  {isRegenerating ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Refreshing
                    </span>
                  ) : (
                    "Refresh this idea"
                  )}
                </Button>
                <Link
                  href={`/reflect/${lessonId}/${gameIndex}`}
                  className={cn(buttonVariants({ variant: "accent" }), "rounded-xl")}
                >
                  I played this
                </Link>
                <Button variant="ghost" className="rounded-xl" onClick={() => setIsOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function Section({
  title,
  items,
  ordered,
  bullet,
}: {
  title: string;
  items: string[];
  ordered?: boolean;
  bullet?: boolean;
}) {
  const ListTag = ordered ? "ol" : "ul";
  const markerClass = ordered ? "list-decimal" : bullet ? "list-disc" : "list-disc";

  return (
    <section className="space-y-2">
      <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h4>
      <ListTag className={cn("space-y-1 pl-5 text-sm text-slate-700", markerClass)}>
        {items.map((item, idx) => (
          <li key={`${title}-${idx}`}>{item}</li>
        ))}
      </ListTag>
    </section>
  );
}
