import Anthropic from "@anthropic-ai/sdk";
import { createHash } from "node:crypto";
import { env } from "@/lib/env";
import {
  createAiCallLog,
  getAiCacheEntry,
  type ReflectionRow,
  upsertAiCacheEntry,
} from "@/lib/db";
import {
  CoachingResponseSchema,
  GameGenerationResponseSchema,
  type GenerateRequestInput,
  InsightsResponseSchema,
} from "@/lib/schemas";

let anthropicClient: Anthropic | null = null;

function getAnthropicClient() {
  if (!anthropicClient) {
    anthropicClient = new Anthropic({
      apiKey: env.anthropicApiKey,
    });
  }
  return anthropicClient;
}

const systemPrompt = `You are a curriculum designer for primary school teachers in Sub-Saharan Africa. You design play-based learning games that work in classrooms with 40-plus students, no electricity, no printers, and no internet. Materials must be items the teacher already has: chalk, blackboard, paper, stones, sticks, bottle caps, leaves, the children themselves, their voices, and their bodies. Never suggest printouts, worksheets that need copying, devices, videos, purchased toys, or any paid resource. Keep language simple. Assume English is a second or third language for the teacher. Use short sentences.`;

const insightsSystemPrompt = `You are a gentle, practical coach for primary school teachers in Sub-Saharan Africa who are learning to use play-based learning. You read their reflections and spot patterns. You speak directly to the teacher in plain language. You give one concrete tip per pattern. You never lecture. You are encouraging but honest. Short sentences.`;
const reflectionCoachSystemPrompt = `You are an encouraging classroom coach for primary teachers in Sub-Saharan Africa. You read one game reflection and give practical support for the next class. Keep language simple. Keep tips short and resource-free. Always include a note that future lesson plans will improve based on this feedback.`;

const PROMPT_VERSIONS = {
  generateGames: "generate-games-v1",
  insights: "insights-v1",
  reflectionCoaching: "reflection-coaching-v1",
} as const;

function extractTextFromClaudeResponse(content: Anthropic.Messages.ContentBlock[]): string {
  return content
    .map((block) => (block.type === "text" ? block.text : ""))
    .join("\n")
    .trim();
}

function cleanJsonCandidate(text: string): string {
  return text
    .trim()
    .replace(/^\uFEFF/, "")
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .replace(/[“”]/g, "\"")
    .replace(/[‘’]/g, "'")
    .replace(/,\s*(?=[}\]])/g, "");
}

function tryParseJsonCandidate(text: string): unknown | null {
  try {
    return JSON.parse(cleanJsonCandidate(text));
  } catch {
    return null;
  }
}

function parseJsonObject(text: string): unknown {
  const trimmed = text.trim();
  const direct = tryParseJsonCandidate(trimmed);
  if (direct !== null) {
    return direct;
  }

  const match = trimmed.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error("Claude did not return JSON");
  }

  const extracted = tryParseJsonCandidate(match[0]);
  if (extracted !== null) {
    return extracted;
  }

  throw new Error("Claude returned malformed JSON");
}

function normalizeForCache(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(normalizeForCache);
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, entryValue]) => entryValue !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, entryValue]) => [key, normalizeForCache(entryValue)]);
    return Object.fromEntries(entries);
  }

  return value;
}

function createCacheKey(params: {
  operation: string;
  model: string;
  promptVersion: string;
  payload: unknown;
}) {
  const normalizedPayload = normalizeForCache(params.payload);
  const payloadText = JSON.stringify(normalizedPayload);
  const hash = createHash("sha256")
    .update(`${params.operation}:${params.model}:${params.promptVersion}:${payloadText}`)
    .digest("hex");
  return `${params.operation}:${params.model}:${params.promptVersion}:${hash}`;
}

function errorToText(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

type CachedCallParams<T> = {
  operation: string;
  model: string;
  promptVersion: string;
  cacheKey: string;
  requestPayload: unknown;
  bypassCache: boolean;
  parser: (value: unknown) => T;
};

async function readCachedResponse<T>(params: CachedCallParams<T>) {
  if (params.bypassCache) {
    return null;
  }

  const startedAt = Date.now();
  const cached = await getAiCacheEntry<unknown>(params.cacheKey);
  if (!cached) {
    return null;
  }

  try {
    const parsed = params.parser(cached.response);
    await createAiCallLog({
      operation: params.operation,
      cacheKey: params.cacheKey,
      cacheHit: true,
      bypassCache: false,
      model: params.model,
      promptVersion: params.promptVersion,
      requestJson: params.requestPayload,
      responseJson: parsed,
      durationMs: Date.now() - startedAt,
    });
    return parsed;
  } catch (error) {
    await createAiCallLog({
      operation: params.operation,
      cacheKey: params.cacheKey,
      cacheHit: true,
      bypassCache: false,
      model: params.model,
      promptVersion: params.promptVersion,
      requestJson: params.requestPayload,
      responseJson: null,
      errorText: `Cached payload parse failed: ${errorToText(error)}`,
      durationMs: Date.now() - startedAt,
    });
    return null;
  }
}

export async function generateGamesWithClaude(
  input: GenerateRequestInput,
  options: { bypassCache?: boolean } = {}
) {
  const model = env.anthropicModel;
  const topic = input.topic?.trim();
  const perGameMinutes = Math.max(4, Math.floor(input.durationMinutes / 3));
  const operation = "generate_games";
  const promptVersion = PROMPT_VERSIONS.generateGames;
  const cachePayload = {
    grade: input.grade,
    studentCount: input.studentCount,
    subject: input.subject,
    topic: topic || "",
    durationMinutes: input.durationMinutes,
  };
  const cacheKey = createCacheKey({
    operation,
    model,
    promptVersion,
    payload: cachePayload,
  });

  const cached = await readCachedResponse({
    operation,
    model,
    promptVersion,
    cacheKey,
    requestPayload: cachePayload,
    bypassCache: options.bypassCache === true,
    parser: (value) => GameGenerationResponseSchema.parse(value),
  });
  if (cached) {
    return cached;
  }

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
  let retryReason = "Output did not match the schema.";

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const retryNote =
      attempt === 0
        ? ""
        : `\n\nYour previous output was invalid (${retryReason}). Retry and obey every schema/material rule exactly. Return strict JSON only.`;

    const startedAt = Date.now();
    const requestPayload = {
      ...cachePayload,
      attempt,
      systemPrompt,
      userPrompt: `${userPrompt}${retryNote}`,
      temperature: 0.35,
      maxTokens: 4000,
    };

    try {
      const response = await getAnthropicClient().messages.create({
        model,
        max_tokens: 4000,
        temperature: 0.35,
        system: systemPrompt,
        messages: [{ role: "user", content: `${userPrompt}${retryNote}` }],
      });

      const rawText = extractTextFromClaudeResponse(response.content);
      const parsed = GameGenerationResponseSchema.parse(parseJsonObject(rawText));

      await upsertAiCacheEntry({
        cacheKey,
        operation,
        model,
        promptVersion,
        requestJson: cachePayload,
        responseJson: parsed,
      });

      await createAiCallLog({
        operation,
        cacheKey,
        cacheHit: false,
        bypassCache: options.bypassCache === true,
        model,
        promptVersion,
        requestJson: requestPayload,
        responseJson: parsed,
        durationMs: Date.now() - startedAt,
      });

      return parsed;
    } catch (error) {
      lastError = error;
      retryReason = errorToText(error).slice(0, 180);
      await createAiCallLog({
        operation,
        cacheKey,
        cacheHit: false,
        bypassCache: options.bypassCache === true,
        model,
        promptVersion,
        requestJson: requestPayload,
        responseJson: null,
        errorText: errorToText(error),
        durationMs: Date.now() - startedAt,
      });
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Failed to generate valid games");
}

export async function generateInsightsWithClaude(
  reflections: ReflectionRow[],
  options: { bypassCache?: boolean } = {}
) {
  const model = env.anthropicModel;
  if (reflections.length < 3) {
    return {
      patterns: [],
      message: "Log a few more reflections and Inspire will start spotting patterns for you.",
    };
  }

  const reflectionsForPrompt = reflections.map((reflection) => ({
    gameName: reflection.game_name,
    rating: reflection.star_rating,
    teacherFeedback: reflection.teacher_feedback || `${reflection.what_worked} | ${reflection.what_flopped} | ${reflection.what_to_change}`,
  }));

  const reflectionsText = reflectionsForPrompt
    .map(
      (reflection, index) => `${index + 1}. Game: ${reflection.gameName}
   Rating: ${reflection.rating}/5
   Teacher feedback: ${reflection.teacherFeedback}`
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

  const operation = "generate_insights";
  const promptVersion = PROMPT_VERSIONS.insights;
  const cachePayload = {
    reflections: reflectionsForPrompt,
  };
  const cacheKey = createCacheKey({
    operation,
    model,
    promptVersion,
    payload: cachePayload,
  });

  const cached = await readCachedResponse({
    operation,
    model,
    promptVersion,
    cacheKey,
    requestPayload: cachePayload,
    bypassCache: options.bypassCache === true,
    parser: (value) => InsightsResponseSchema.parse(value),
  });
  if (cached) {
    return cached;
  }

  const startedAt = Date.now();
  const requestPayload = {
    ...cachePayload,
    systemPrompt: insightsSystemPrompt,
    userPrompt: insightsUserPrompt,
    temperature: 0.5,
    maxTokens: 2000,
  };

  try {
    const response = await getAnthropicClient().messages.create({
      model,
      max_tokens: 2000,
      temperature: 0.5,
      system: insightsSystemPrompt,
      messages: [{ role: "user", content: insightsUserPrompt }],
    });

    const parsed = InsightsResponseSchema.parse(parseJsonObject(extractTextFromClaudeResponse(response.content)));

    await upsertAiCacheEntry({
      cacheKey,
      operation,
      model,
      promptVersion,
      requestJson: cachePayload,
      responseJson: parsed,
    });

    await createAiCallLog({
      operation,
      cacheKey,
      cacheHit: false,
      bypassCache: options.bypassCache === true,
      model,
      promptVersion,
      requestJson: requestPayload,
      responseJson: parsed,
      durationMs: Date.now() - startedAt,
    });

    return parsed;
  } catch (error) {
    await createAiCallLog({
      operation,
      cacheKey,
      cacheHit: false,
      bypassCache: options.bypassCache === true,
      model,
      promptVersion,
      requestJson: requestPayload,
      responseJson: null,
      errorText: errorToText(error),
      durationMs: Date.now() - startedAt,
    });
    throw error;
  }
}

export async function generateReflectionCoachingWithClaude(
  input: {
    gameName: string;
    starRating: number;
    teacherFeedback: string;
  },
  options: { bypassCache?: boolean } = {}
) {
  const model = env.anthropicFeedbackModel;
  const userPrompt = `Teacher reflection for one game:

Game name: ${input.gameName}
Rating: ${input.starRating}/5
Teacher notes: ${input.teacherFeedback}

Return ONLY valid JSON:
{
  "summary": "string",
  "tips": ["string", "string"],
  "futurePlanNote": "string"
}

Rules:
- summary: one short supportive sentence.
- tips: 2 to 4 concrete tips for next class, no paid resources.
- futurePlanNote: explicitly state that future plans will improve using this feedback.
- keep all text concise and practical.`;

  const operation = "generate_reflection_coaching";
  const promptVersion = PROMPT_VERSIONS.reflectionCoaching;
  const cachePayload = {
    gameName: input.gameName,
    starRating: input.starRating,
    teacherFeedback: input.teacherFeedback.trim(),
  };
  const cacheKey = createCacheKey({
    operation,
    model,
    promptVersion,
    payload: cachePayload,
  });

  const cached = await readCachedResponse({
    operation,
    model,
    promptVersion,
    cacheKey,
    requestPayload: cachePayload,
    bypassCache: options.bypassCache === true,
    parser: (value) => CoachingResponseSchema.parse(value),
  });
  if (cached) {
    return cached;
  }

  const startedAt = Date.now();
  const requestPayload = {
    ...cachePayload,
    systemPrompt: reflectionCoachSystemPrompt,
    userPrompt,
    temperature: 0.4,
    maxTokens: 500,
  };

  try {
    const response = await getAnthropicClient().messages.create({
      model,
      max_tokens: 500,
      temperature: 0.4,
      system: reflectionCoachSystemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const parsed = CoachingResponseSchema.parse(parseJsonObject(extractTextFromClaudeResponse(response.content)));

    await upsertAiCacheEntry({
      cacheKey,
      operation,
      model,
      promptVersion,
      requestJson: cachePayload,
      responseJson: parsed,
    });

    await createAiCallLog({
      operation,
      cacheKey,
      cacheHit: false,
      bypassCache: options.bypassCache === true,
      model,
      promptVersion,
      requestJson: requestPayload,
      responseJson: parsed,
      durationMs: Date.now() - startedAt,
    });

    return parsed;
  } catch (error) {
    await createAiCallLog({
      operation,
      cacheKey,
      cacheHit: false,
      bypassCache: options.bypassCache === true,
      model,
      promptVersion,
      requestJson: requestPayload,
      responseJson: null,
      errorText: errorToText(error),
      durationMs: Date.now() - startedAt,
    });
    throw error;
  }
}
