import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import type { Game, InsightsResponse } from "@/lib/schemas";

const dbPath = path.join(process.cwd(), "data", "inspire.db");
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

declare global {
  // eslint-disable-next-line no-var
  var __inspireDb__: InstanceType<typeof Database> | undefined;
}

const db: InstanceType<typeof Database> = global.__inspireDb__ ?? new Database(dbPath);
if (!global.__inspireDb__) {
  global.__inspireDb__ = db;
}

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lessons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  grade TEXT NOT NULL,
  student_count INTEGER NOT NULL,
  subject TEXT NOT NULL,
  topic TEXT,
  duration_minutes INTEGER NOT NULL,
  games_json TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS reflections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  lesson_id INTEGER NOT NULL,
  game_index INTEGER NOT NULL,
  game_name TEXT NOT NULL,
  star_rating INTEGER NOT NULL DEFAULT 3,
  what_worked TEXT NOT NULL,
  what_flopped TEXT NOT NULL,
  what_to_change TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (lesson_id) REFERENCES lessons(id)
);

CREATE TABLE IF NOT EXISTS insights_cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  patterns_text TEXT NOT NULL,
  reflection_count_at_generation INTEGER NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
`);

const reflectionColumns = db.prepare("PRAGMA table_info(reflections)").all() as Array<{ name: string }>;
if (!reflectionColumns.some((column) => column.name === "star_rating")) {
  db.exec("ALTER TABLE reflections ADD COLUMN star_rating INTEGER NOT NULL DEFAULT 3;");
}

export type UserRow = {
  id: number;
  username: string;
  password_hash: string;
  created_at: string;
};

export type LessonRow = {
  id: number;
  user_id: number;
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
  user_id: number;
  lesson_id: number;
  game_index: number;
  game_name: string;
  star_rating: number;
  what_worked: string;
  what_flopped: string;
  what_to_change: string;
  created_at: string;
};

export type InsightsCacheRow = {
  id: number;
  user_id: number;
  patterns_text: string;
  reflection_count_at_generation: number;
  created_at: string;
};

export function createLesson(params: {
  userId: number;
  grade: string;
  studentCount: number;
  subject: string;
  topic?: string | null;
  durationMinutes: number;
  games: Game[];
}) {
  const stmt = db.prepare(
    `INSERT INTO lessons (user_id, grade, student_count, subject, topic, duration_minutes, games_json)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  const result = stmt.run(
    params.userId,
    params.grade,
    params.studentCount,
    params.subject,
    params.topic ?? null,
    params.durationMinutes,
    JSON.stringify(params.games)
  );
  return Number(result.lastInsertRowid);
}

export function replaceGameInLesson(lessonId: number, gameIndex: number, game: Game) {
  const lesson = db
    .prepare("SELECT games_json FROM lessons WHERE id = ?")
    .get(lessonId) as Pick<LessonRow, "games_json"> | undefined;

  if (!lesson) {
    return null;
  }

  const games = JSON.parse(lesson.games_json) as Game[];
  games[gameIndex] = game;

  db.prepare("UPDATE lessons SET games_json = ? WHERE id = ?").run(JSON.stringify(games), lessonId);
  return games;
}

export function parseLessonGames(lesson: Pick<LessonRow, "games_json">): Game[] {
  try {
    const parsed = JSON.parse(lesson.games_json);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed as Game[];
  } catch {
    return [];
  }
}

export function getLatestInsightsCache(userId: number): (InsightsCacheRow & { parsed: InsightsResponse }) | null {
  const row = db
    .prepare(
      "SELECT * FROM insights_cache WHERE user_id = ? ORDER BY reflection_count_at_generation DESC, created_at DESC LIMIT 1"
    )
    .get(userId) as InsightsCacheRow | undefined;

  if (!row) {
    return null;
  }

  try {
    return {
      ...row,
      parsed: JSON.parse(row.patterns_text) as InsightsResponse,
    };
  } catch {
    return null;
  }
}

export default db;
