"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

const grades = ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7"];
const subjects = ["Maths", "English", "Science", "Social Studies", "Local Language", "Life Skills"];

export function LessonForm() {
  const router = useRouter();
  const [grade, setGrade] = useState("Grade 3");
  const [studentCount, setStudentCount] = useState(40);
  const [subject, setSubject] = useState("Maths");
  const [topic, setTopic] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grade,
          studentCount,
          subject,
          topic,
          durationMinutes,
        }),
      });

      const data = (await response.json()) as { lessonId?: number; error?: string };

      if (!response.ok || !data.lessonId) {
        setError(data.error ?? "Could not generate games. Please try again.");
        return;
      }

      router.push(`/generate/${data.lessonId}`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Plan Your Next Lesson</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <Label htmlFor="grade">Grade</Label>
            <Select id="grade" value={grade} onChange={(e) => setGrade(e.target.value)}>
              {grades.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label htmlFor="studentCount" className="mb-0">
                Number of students
              </Label>
              <span className="font-semibold text-primary">{studentCount}</span>
            </div>
            <Slider id="studentCount" value={studentCount} onChange={setStudentCount} min={10} max={120} step={1} />
          </div>

          <div>
            <Label htmlFor="subject">Subject</Label>
            <Select id="subject" value={subject} onChange={(e) => setSubject(e.target.value)}>
              {subjects.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="topic">Topic (optional)</Label>
            <Input
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. fractions, water cycle"
            />
          </div>

          <div>
            <Label htmlFor="duration">Duration</Label>
            <Select
              id="duration"
              value={String(durationMinutes)}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
            >
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="45">45 minutes</option>
            </Select>
          </div>

          {error ? <p className="rounded-lg bg-red-50 p-3 text-base text-red-700">{error}</p> : null}

          <Button type="submit" variant="accent" size="lg" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Generating 3 games...
              </span>
            ) : (
              "Generate 3 Games"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
