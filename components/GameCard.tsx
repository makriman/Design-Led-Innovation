"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Printer, RefreshCw, Save } from "lucide-react";
import type { Game } from "@/lib/schemas";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type GameCardProps = {
  lessonId: number;
  gameIndex: number;
  initialGame: Game;
};

export function GameCard({ lessonId, gameIndex, initialGame }: GameCardProps) {
  const [game, setGame] = useState(initialGame);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        setError(data.error ?? "Could not regenerate this game.");
        return;
      }

      setGame(data.game);
      setSaveMessage("Updated and saved.");
      setTimeout(() => setSaveMessage(null), 2500);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsRegenerating(false);
    }
  }

  function handleSave() {
    setSaveMessage("Already saved to history.");
    setTimeout(() => setSaveMessage(null), 2500);
  }

  return (
    <Card className="print-card">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>{game.name}</CardTitle>
          <Badge>Game {gameIndex + 1}</Badge>
        </div>
        <p className="text-base text-slate-700">
          <span className="font-semibold text-primary">Objective:</span> {game.objective}
        </p>
      </CardHeader>

      <CardContent>
        <Section title="Materials needed" items={game.materials} bullet />
        <Section title="Setup" items={game.setup} />
        <Section title="How to play" items={game.howToPlay} ordered />
        <Section title="What the teacher says/does" items={game.teacherScript} />
        <Section title="How to know it worked" items={game.assessmentCues} bullet />

        <div className="rounded-lg border border-border bg-neutral p-4">
          <p className="font-semibold text-primary">Variation for class size</p>
          <p className="mt-2 text-base text-slate-800">
            <span className="font-semibold">Larger class:</span> {game.variations.largerClass}
          </p>
          <p className="mt-1 text-base text-slate-800">
            <span className="font-semibold">Smaller class:</span> {game.variations.smallerClass}
          </p>
        </div>

        {error ? <p className="rounded-lg bg-red-50 p-3 text-base text-red-700">{error}</p> : null}

        <div className="no-print grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Button onClick={handleSave} variant="outline" className="w-full">
            <Save className="mr-2 h-4 w-4" /> Save
          </Button>

          <Button onClick={regenerateThisGame} variant="outline" className="w-full" disabled={isRegenerating}>
            {isRegenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Regenerating
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" /> Regenerate this game
              </>
            )}
          </Button>

          <Button onClick={() => window.print()} variant="outline" className="w-full">
            <Printer className="mr-2 h-4 w-4" /> Print-friendly view
          </Button>

          <Link
            href={`/reflect/${lessonId}/${gameIndex}`}
            className={cn(buttonVariants({ variant: "accent" }), "w-full")}
          >
            I ran this
          </Link>
        </div>

        {saveMessage ? <p className="no-print text-base font-semibold text-primary">{saveMessage}</p> : null}
      </CardContent>
    </Card>
  );
}

type SectionProps = {
  title: string;
  items: string[];
  ordered?: boolean;
  bullet?: boolean;
};

function Section({ title, items, ordered, bullet }: SectionProps) {
  const ListTag = ordered ? "ol" : "ul";
  const listClass = ordered ? "list-decimal" : bullet ? "list-disc" : "list-disc";

  return (
    <section>
      <h4 className="font-semibold text-primary">{title}</h4>
      <ListTag className={`mt-2 space-y-1 pl-6 text-base text-slate-800 ${listClass}`}>
        {items.map((item, idx) => (
          <li key={`${title}-${idx}`}>{item}</li>
        ))}
      </ListTag>
    </section>
  );
}
