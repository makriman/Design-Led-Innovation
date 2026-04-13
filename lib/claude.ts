import Anthropic from "@anthropic-ai/sdk";
import { env } from "@/lib/env";
import {
  GameGenerationResponseSchema,
  type GenerateRequestInput,
  InsightsResponseSchema,
} from "@/lib/schemas";
import type { ReflectionRow } from "@/lib/db";

const anthropic = new Anthropic({
  apiKey: env.anthropicApiKey,
});

const systemPrompt = `You are a curriculum designer for primary school teachers in Sub-Saharan Africa. You design play-based learning games that work in classrooms with 40-plus students, no electricity, no printers, and no internet. Materials must be items the teacher already has: chalk, blackboard, paper, stones, sticks, bottle caps, leaves, the children themselves, their voices, and their bodies. Never suggest printouts, worksheets that need copying, devices, videos, purchased toys, or any paid resource. Keep language simple. Assume English is a second or third language for the teacher. Use short sentences.`;

const insightsSystemPrompt = `You are a gentle, practical coach for primary school teachers in Sub-Saharan Africa who are learning to use play-based learning. You read their reflections and spot patterns. You speak directly to the teacher in plain language. You give one concrete tip per pattern. You never lecture. You are encouraging but honest. Short sentences.`;

function extractTextFromClaudeResponse(content: Anthropic.Messages.ContentBlock[]): string {
  return content
    .map((block) => (block.type === "text" ? block.text : ""))
    .join("\n")
    .trim();
}

function parseJsonObject(text: string): unknown {
  const trimmed = text.trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("Claude did not return JSON");
    }
    return JSON.parse(match[0]);
  }
}

export async function generateGamesWithClaude(input: GenerateRequestInput) {
  const topic = input.topic?.trim();
  const perGameMinutes = Math.max(4, Math.floor(input.durationMinutes / 3));

  const userPrompt = `Design 3 different play-based learning games for:
- Grade: ${input.grade}
- Class size: ${input.studentCount} students
- Subject: ${input.subject}
- Topic: ${topic || "teacher's choice of a core topic for this grade and subject"}
- Duration: ${input.durationMinutes} minutes total (so each game is about ${perGameMinutes} minutes)

Return ONLY valid JSON matching this exact schema, no markdown, no preamble:

{
  "games": [
    {
      "name": "string",
      "objective": "string",
      "materials": ["string"],
      "setup": ["string"],
      "howToPlay": ["string"],
      "teacherScript": ["string"],
      "assessmentCues": ["string"],
      "variations": { "largerClass": "string", "smallerClass": "string" }
    }
  ]
}

The 3 games must be meaningfully different: one movement-based, one verbal/call-and-response, one small-group cooperative. All 3 must teach the same objective from different angles.

Hard material rule: every item in "materials" must be realistic for a rural classroom and must come from this allowed pool only: chalk, blackboard, paper, stones, sticks, bottle caps, leaves, children's bodies, voices.`;

  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const retryNote =
      attempt === 0
        ? ""
        : "\n\nYour previous output was invalid. Retry and obey every schema/material rule exactly.";

    try {
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 4000,
        temperature: 0.7,
        system: systemPrompt,
        messages: [{ role: "user", content: `${userPrompt}${retryNote}` }],
      });

      const rawText = extractTextFromClaudeResponse(response.content);
      const parsed = parseJsonObject(rawText);
      return GameGenerationResponseSchema.parse(parsed);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Failed to generate valid games");
}

export async function generateInsightsWithClaude(reflections: ReflectionRow[]) {
  if (reflections.length < 3) {
    return {
      patterns: [],
      message: "Log a few more reflections and Inspire will start spotting patterns for you.",
    };
  }

  const reflectionsText = reflections
    .map(
      (r, i) => `${i + 1}. Game: ${r.game_name}
   What worked: ${r.what_worked}
   What flopped: ${r.what_flopped}
   What to change: ${r.what_to_change}`
    )
    .join("\n\n");

  const insightsUserPrompt = `Here are the last ${reflections.length} reflections from this teacher, newest first:

${reflectionsText}

Identify up to 4 patterns. For each pattern, write:
- A one-sentence observation (e.g. "You've mentioned noise in 4 reflections.")
- One concrete, resource-free tip the teacher can try next class.

Return ONLY valid JSON:

{
  "patterns": [
    { "observation": "string", "tip": "string" }
  ]
}

If there are fewer than 3 reflections, return an empty patterns array and a friendly note in a "message" field asking the teacher to log a few more reflections first.`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 2000,
    temperature: 0.5,
    system: insightsSystemPrompt,
    messages: [{ role: "user", content: insightsUserPrompt }],
  });

  const rawText = extractTextFromClaudeResponse(response.content);
  const parsed = parseJsonObject(rawText);
  return InsightsResponseSchema.parse(parsed);
}
