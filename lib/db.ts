import { neon } from "@neondatabase/serverless";
import { env } from "@/lib/env";
import type { CoachingResponse, Game, InsightsResponse } from "@/lib/schemas";

const sql = neon(env.databaseUrl);

declare global {
  // eslint-disable-next-line no-var
  var __inspireDbReady__: Promise<void> | undefined;
}

async function initializeDatabase() {
  await sql.query(`
    CREATE TABLE IF NOT EXISTS lessons (
      id BIGSERIAL PRIMARY KEY,
      grade TEXT NOT NULL,
      student_count INTEGER NOT NULL,
      subject TEXT NOT NULL,
      topic TEXT,
      duration_minutes INTEGER NOT NULL,
      games_json JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await sql.query(`
    CREATE TABLE IF NOT EXISTS reflections (
      id BIGSERIAL PRIMARY KEY,
      lesson_id BIGINT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
      game_index INTEGER NOT NULL,
      game_name TEXT NOT NULL,
      star_rating INTEGER NOT NULL DEFAULT 3,
      teacher_feedback TEXT,
      ai_coaching_json JSONB,
      what_worked TEXT NOT NULL,
      what_flopped TEXT NOT NULL,
      what_to_change TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (lesson_id, game_index)
    );
  `);

  await sql.query(`
    CREATE TABLE IF NOT EXISTS insights_snapshots (
      id BIGSERIAL PRIMARY KEY,
      patterns_json JSONB NOT NULL,
      reflection_count_at_generation INTEGER NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await sql.query(`
    CREATE TABLE IF NOT EXISTS ai_cache_entries (
      cache_key TEXT PRIMARY KEY,
      operation TEXT NOT NULL,
      model TEXT NOT NULL,
      prompt_version TEXT NOT NULL,
      request_json JSONB NOT NULL,
      response_json JSONB NOT NULL,
      hit_count INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_hit_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await sql.query(`
    CREATE TABLE IF NOT EXISTS ai_call_log (
      id BIGSERIAL PRIMARY KEY,
      operation TEXT NOT NULL,
      cache_key TEXT NOT NULL,
      cache_hit BOOLEAN NOT NULL,
      bypass_cache BOOLEAN NOT NULL DEFAULT FALSE,
      model TEXT NOT NULL,
      prompt_version TEXT NOT NULL,
      request_json JSONB NOT NULL,
      response_json JSONB,
      error_text TEXT,
      duration_ms INTEGER,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await sql.query(`CREATE INDEX IF NOT EXISTS idx_lessons_id_desc ON lessons (id DESC);`);
  await sql.query(
    `CREATE INDEX IF NOT EXISTS idx_reflections_lesson_created_desc ON reflections (lesson_id, created_at DESC, id DESC);`
  );
  await sql.query(`CREATE INDEX IF NOT EXISTS idx_reflections_created_desc ON reflections (created_at DESC, id DESC);`);
  await sql.query(
    `CREATE INDEX IF NOT EXISTS idx_insights_snapshots_created_desc ON insights_snapshots (created_at DESC, id DESC);`
  );
  await sql.query(
    `CREATE INDEX IF NOT EXISTS idx_ai_cache_operation_updated_desc ON ai_cache_entries (operation, updated_at DESC);`
  );
  await sql.query(`CREATE INDEX IF NOT EXISTS idx_ai_call_log_created_desc ON ai_call_log (created_at DESC, id DESC);`);
}

async function ensureDatabaseReady() {
  if (!global.__inspireDbReady__) {
    global.__inspireDbReady__ = initializeDatabase().catch((error) => {
      global.__inspireDbReady__ = undefined;
      throw error;
    });
  }

  await global.__inspireDbReady__;
}

async function queryRows<T>(queryText: string, params: unknown[] = []) {
  await ensureDatabaseReady();
  return (await sql.query(queryText, params)) as T[];
}

function toNumber(value: unknown) {
  if (typeof value === "number") {
    return value;
  }
  return Number(value);
}

function toISOString(value: unknown) {
  if (value instanceof Date) {
    return value.toISOString();
  }
  return String(value);
}

function parseStoredJson(value: unknown) {
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
  return value;
}

function stringifyStoredJson(value: unknown) {
  if (value === null || value === undefined) {
    return null;
  }
  return typeof value === "string" ? value : JSON.stringify(value);
}

type LessonRowRaw = {
  id: unknown;
  grade: string;
  student_count: unknown;
  subject: string;
  topic: string | null;
  duration_minutes: unknown;
  games_json: unknown;
  created_at: unknown;
};

type ReflectionRowRaw = {
  id: unknown;
  lesson_id: unknown;
  game_index: unknown;
  game_name: string;
  star_rating: unknown;
  teacher_feedback: string | null;
  ai_coaching_json: unknown;
  what_worked: string;
  what_flopped: string;
  what_to_change: string;
  created_at: unknown;
};

export type LessonRow = {
  id: number;
  grade: string;
  student_count: number;
  subject: string;
  topic: string | null;
  duration_minutes: number;
  games_json: string;
  created_at: string;
};

export type ReflectionRow = {
  id: number;
  lesson_id: number;
  game_index: number;
  game_name: string;
  star_rating: number;
  teacher_feedback: string | null;
  ai_coaching_json: string | null;
  what_worked: string;
  what_flopped: string;
  what_to_change: string;
  created_at: string;
};

type InsightsSnapshotRowRaw = {
  id: unknown;
  patterns_json: unknown;
  reflection_count_at_generation: unknown;
  created_at: unknown;
};

export type InsightsSnapshotRow = {
  id: number;
  patterns_json: string;
  reflection_count_at_generation: number;
  created_at: string;
};

export type AiCacheRow = {
  cache_key: string;
  operation: string;
  model: string;
  prompt_version: string;
  request_json: unknown;
  response_json: unknown;
  hit_count: number;
  created_at: string;
  updated_at: string;
  last_hit_at: string;
};

function mapLessonRow(row: LessonRowRaw): LessonRow {
  return {
    id: toNumber(row.id),
    grade: row.grade,
    student_count: toNumber(row.student_count),
    subject: row.subject,
    topic: row.topic,
    duration_minutes: toNumber(row.duration_minutes),
    games_json: stringifyStoredJson(row.games_json) ?? "[]",
    created_at: toISOString(row.created_at),
  };
}

function mapReflectionRow(row: ReflectionRowRaw): ReflectionRow {
  return {
    id: toNumber(row.id),
    lesson_id: toNumber(row.lesson_id),
    game_index: toNumber(row.game_index),
    game_name: row.game_name,
    star_rating: toNumber(row.star_rating),
    teacher_feedback: row.teacher_feedback,
    ai_coaching_json: stringifyStoredJson(row.ai_coaching_json),
    what_worked: row.what_worked,
    what_flopped: row.what_flopped,
    what_to_change: row.what_to_change,
    created_at: toISOString(row.created_at),
  };
}

function mapInsightsSnapshotRow(row: InsightsSnapshotRowRaw): InsightsSnapshotRow {
  return {
    id: toNumber(row.id),
    patterns_json: stringifyStoredJson(row.patterns_json) ?? "{}",
    reflection_count_at_generation: toNumber(row.reflection_count_at_generation),
    created_at: toISOString(row.created_at),
  };
}

export function parseLessonGames(lesson: Pick<LessonRow, "games_json">): Game[] {
  try {
    const parsed = parseStoredJson(lesson.games_json);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed as Game[];
  } catch {
    return [];
  }
}

export async function createLesson(params: {
  grade: string;
  studentCount: number;
  subject: string;
  topic?: string | null;
  durationMinutes: number;
  games: Game[];
}) {
  const rows = await queryRows<{ id: unknown }>(
    `INSERT INTO lessons (grade, student_count, subject, topic, duration_minutes, games_json)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb)
     RETURNING id`,
    [
      params.grade,
      params.studentCount,
      params.subject,
      params.topic ?? null,
      params.durationMinutes,
      JSON.stringify(params.games),
    ]
  );

  return toNumber(rows[0]?.id);
}

export async function getLessonById(lessonId: number) {
  const rows = await queryRows<LessonRowRaw>("SELECT * FROM lessons WHERE id = $1 LIMIT 1", [lessonId]);
  if (!rows[0]) {
    return null;
  }
  return mapLessonRow(rows[0]);
}

export async function replaceGameInLesson(lessonId: number, gameIndex: number, game: Game) {
  const lesson = await getLessonById(lessonId);
  if (!lesson) {
    return null;
  }

  const games = parseLessonGames(lesson);
  if (!games[gameIndex]) {
    return null;
  }

  games[gameIndex] = game;

  await queryRows("UPDATE lessons SET games_json = $1::jsonb WHERE id = $2", [JSON.stringify(games), lessonId]);
  return games;
}

export async function listLessonsPage(params: { q: string; cursor: number | null; limit: number }) {
  const q = params.q.trim();
  const where: string[] = [];
  const values: unknown[] = [];
  let nextParam = 1;

  if (q) {
    const searchLike = `%${q.replace(/[\\%_]/g, "\\$&")}%`;
    where.push(
      `(grade ILIKE $${nextParam} ESCAPE '\\' OR subject ILIKE $${nextParam + 1} ESCAPE '\\' OR COALESCE(topic, '') ILIKE $${nextParam + 2} ESCAPE '\\')`
    );
    values.push(searchLike, searchLike, searchLike);
    nextParam += 3;
  }

  if (params.cursor !== null) {
    where.push(`id < $${nextParam}`);
    values.push(params.cursor);
    nextParam += 1;
  }

  values.push(params.limit + 1);

  const rows = await queryRows<LessonRowRaw>(
    `SELECT *
     FROM lessons
     ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
     ORDER BY id DESC
     LIMIT $${nextParam}`,
    values
  );

  const lessons = rows.map(mapLessonRow);
  const hasMore = lessons.length > params.limit;
  const pageLessons = hasMore ? lessons.slice(0, params.limit) : lessons;
  const nextCursor = hasMore ? pageLessons[pageLessons.length - 1]?.id ?? null : null;

  return {
    lessons: pageLessons,
    hasMore,
    nextCursor,
  };
}

export async function getReflectedGameIndicesByLessonIds(lessonIds: number[]) {
  if (lessonIds.length === 0) {
    return new Map<number, Set<number>>();
  }

  const placeholders = lessonIds.map((_, index) => `$${index + 1}`).join(", ");
  const rows = await queryRows<{ lesson_id: unknown; game_index: unknown }>(
    `SELECT lesson_id, game_index FROM reflections WHERE lesson_id IN (${placeholders})`,
    lessonIds
  );

  const reflectedMap = new Map<number, Set<number>>();
  for (const row of rows) {
    const lessonId = toNumber(row.lesson_id);
    const gameIndex = toNumber(row.game_index);
    if (!reflectedMap.has(lessonId)) {
      reflectedMap.set(lessonId, new Set<number>());
    }
    reflectedMap.get(lessonId)?.add(gameIndex);
  }

  return reflectedMap;
}

export async function getReflectionsByLessonId(lessonId: number) {
  const rows = await queryRows<ReflectionRowRaw>(
    `SELECT *
     FROM reflections
     WHERE lesson_id = $1
     ORDER BY created_at DESC, id DESC`,
    [lessonId]
  );

  return rows.map(mapReflectionRow);
}

export async function getAllReflections() {
  const rows = await queryRows<ReflectionRowRaw>(
    "SELECT * FROM reflections ORDER BY created_at DESC, id DESC"
  );
  return rows.map(mapReflectionRow);
}

export async function getRecentReflections(limit: number) {
  const rows = await queryRows<ReflectionRowRaw>(
    "SELECT * FROM reflections ORDER BY created_at DESC, id DESC LIMIT $1",
    [limit]
  );
  return rows.map(mapReflectionRow);
}

export async function getReflectionCount() {
  const rows = await queryRows<{ count: unknown }>("SELECT COUNT(*) as count FROM reflections");
  return toNumber(rows[0]?.count ?? 0);
}

export async function getLessonCount() {
  const rows = await queryRows<{ count: unknown }>("SELECT COUNT(*) as count FROM lessons");
  return toNumber(rows[0]?.count ?? 0);
}

export async function upsertReflection(params: {
  lessonId: number;
  gameIndex: number;
  gameName: string;
  starRating: number;
  teacherFeedback: string;
  aiCoaching: CoachingResponse;
  whatWorked: string;
  whatFlopped: string;
  whatToChange: string;
}) {
  const rows = await queryRows<{ id: unknown }>(
    `INSERT INTO reflections (
      lesson_id,
      game_index,
      game_name,
      star_rating,
      teacher_feedback,
      ai_coaching_json,
      what_worked,
      what_flopped,
      what_to_change
    )
    VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9)
    ON CONFLICT (lesson_id, game_index)
    DO UPDATE SET
      game_name = EXCLUDED.game_name,
      star_rating = EXCLUDED.star_rating,
      teacher_feedback = EXCLUDED.teacher_feedback,
      ai_coaching_json = EXCLUDED.ai_coaching_json,
      what_worked = EXCLUDED.what_worked,
      what_flopped = EXCLUDED.what_flopped,
      what_to_change = EXCLUDED.what_to_change,
      created_at = NOW()
    RETURNING id`,
    [
      params.lessonId,
      params.gameIndex,
      params.gameName,
      params.starRating,
      params.teacherFeedback,
      JSON.stringify(params.aiCoaching),
      params.whatWorked,
      params.whatFlopped,
      params.whatToChange,
    ]
  );

  return toNumber(rows[0]?.id);
}

export async function getLatestInsightsSnapshot() {
  const rows = await queryRows<InsightsSnapshotRowRaw>(
    `SELECT *
     FROM insights_snapshots
     ORDER BY reflection_count_at_generation DESC, created_at DESC, id DESC
     LIMIT 1`
  );

  if (!rows[0]) {
    return null;
  }

  const mapped = mapInsightsSnapshotRow(rows[0]);
  try {
    return {
      ...mapped,
      parsed: JSON.parse(mapped.patterns_json) as InsightsResponse,
    };
  } catch {
    return null;
  }
}

export async function createInsightsSnapshot(params: { insights: InsightsResponse; reflectionCount: number }) {
  await queryRows(
    `INSERT INTO insights_snapshots (patterns_json, reflection_count_at_generation)
     VALUES ($1::jsonb, $2)`,
    [JSON.stringify(params.insights), params.reflectionCount]
  );
}

export async function getAiCacheEntry<T>(cacheKey: string) {
  const rows = await queryRows<{ response_json: unknown }>(
    `UPDATE ai_cache_entries
     SET hit_count = hit_count + 1, last_hit_at = NOW(), updated_at = NOW()
     WHERE cache_key = $1
     RETURNING response_json`,
    [cacheKey]
  );

  if (!rows[0]) {
    return null;
  }

  const parsed = parseStoredJson(rows[0].response_json) as T;
  return {
    response: parsed,
  };
}

export async function upsertAiCacheEntry(params: {
  cacheKey: string;
  operation: string;
  model: string;
  promptVersion: string;
  requestJson: unknown;
  responseJson: unknown;
}) {
  await queryRows(
    `INSERT INTO ai_cache_entries (
      cache_key,
      operation,
      model,
      prompt_version,
      request_json,
      response_json
    )
    VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb)
    ON CONFLICT (cache_key)
    DO UPDATE SET
      operation = EXCLUDED.operation,
      model = EXCLUDED.model,
      prompt_version = EXCLUDED.prompt_version,
      request_json = EXCLUDED.request_json,
      response_json = EXCLUDED.response_json,
      updated_at = NOW()`,
    [
      params.cacheKey,
      params.operation,
      params.model,
      params.promptVersion,
      JSON.stringify(params.requestJson),
      JSON.stringify(params.responseJson),
    ]
  );
}

export async function createAiCallLog(params: {
  operation: string;
  cacheKey: string;
  cacheHit: boolean;
  bypassCache: boolean;
  model: string;
  promptVersion: string;
  requestJson: unknown;
  responseJson: unknown | null;
  errorText?: string | null;
  durationMs?: number | null;
}) {
  await queryRows(
    `INSERT INTO ai_call_log (
      operation,
      cache_key,
      cache_hit,
      bypass_cache,
      model,
      prompt_version,
      request_json,
      response_json,
      error_text,
      duration_ms
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9, $10)`,
    [
      params.operation,
      params.cacheKey,
      params.cacheHit,
      params.bypassCache,
      params.model,
      params.promptVersion,
      JSON.stringify(params.requestJson),
      params.responseJson === null ? null : JSON.stringify(params.responseJson),
      params.errorText ?? null,
      params.durationMs ?? null,
    ]
  );
}
