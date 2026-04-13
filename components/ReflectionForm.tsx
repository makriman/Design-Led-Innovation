"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
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
  const [whatWorked, setWhatWorked] = useState("");
  const [whatFlopped, setWhatFlopped] = useState("");
  const [whatToChange, setWhatToChange] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

          {error ? <p className="rounded-lg bg-red-50 p-3 text-base text-red-700">{error}</p> : null}

          <Button type="submit" variant="accent" size="lg" className="w-full" disabled={isSaving}>
            {isSaving ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" /> Saving reflection...
              </span>
            ) : (
              "Save reflection"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
