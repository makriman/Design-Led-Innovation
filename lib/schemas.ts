import { z } from "zod";

const allowedMaterialPatterns = [
  /chalk/,
  /blackboard|board/,
  /paper/,
  /stone|pebble|rock/,
  /stick/,
  /bottle\s*cap|caps?/,
  /leaf|leaves/,
  /voice|voices/,
  /body|bodies|hands?|feet/,
  /children|child|students?|learners?/,
];

const bannedMaterialPatterns = [
  /print|printer|photocopy|worksheet|laminat/,
  /phone|tablet|computer|laptop|screen|device|internet|wifi|video|projector|tv/,
  /toy|purchase|buy|paid|cost/,
];

export const AuthSchema = z.object({
  username: z.string().min(3).max(40).trim(),
  password: z.string().min(6).max(128),
});

export const GenerateRequestSchema = z.object({
  grade: z.enum([
    "Grade 1",
    "Grade 2",
    "Grade 3",
    "Grade 4",
    "Grade 5",
    "Grade 6",
    "Grade 7",
  ]),
  studentCount: z.number().int().min(10).max(120),
  subject: z.enum([
    "Maths",
    "English",
    "Science",
    "Social Studies",
    "Local Language",
    "Life Skills",
  ]),
  topic: z.string().trim().max(100).optional().or(z.literal("")),
  durationMinutes: z.number().int().refine((val) => [15, 30, 45].includes(val), {
    message: "Duration must be 15, 30, or 45",
  }),
});

export const GameSchema = z.object({
  name: z.string().min(2).max(120),
  objective: z.string().min(5).max(400),
  materials: z
    .array(z.string().min(1))
    .min(1)
    .max(12)
    .refine(
      (materials) =>
        materials.every((material) => {
          const text = material.toLowerCase();
          const hasBanned = bannedMaterialPatterns.some((pattern) => pattern.test(text));
          const hasAllowed = allowedMaterialPatterns.some((pattern) => pattern.test(text));
          return !hasBanned && hasAllowed;
        }),
      {
        message:
          "Materials must be realistic classroom items only (chalk, paper, stones, sticks, bottle caps, leaves, voices, bodies).",
      }
    ),
  setup: z.array(z.string().min(1)).min(1).max(6),
  howToPlay: z.array(z.string().min(1)).min(5).max(12),
  teacherScript: z.array(z.string().min(1)).min(1).max(8),
  assessmentCues: z.array(z.string().min(1)).min(1).max(6),
  variations: z.object({
    largerClass: z.string().min(2).max(250),
    smallerClass: z.string().min(2).max(250),
  }),
});

export const GameGenerationResponseSchema = z.object({
  games: z.array(GameSchema).length(3),
});

export const ReflectionSchema = z.object({
  lessonId: z.number().int().positive(),
  gameIndex: z.number().int().min(0).max(2),
  gameName: z.string().min(1).max(120),
  whatWorked: z.string().trim().min(3).max(3000),
  whatFlopped: z.string().trim().min(3).max(3000),
  whatToChange: z.string().trim().min(3).max(3000),
});

export const InsightPatternSchema = z.object({
  observation: z.string().min(4).max(300),
  tip: z.string().min(4).max(300),
});

export const InsightsResponseSchema = z.object({
  patterns: z.array(InsightPatternSchema).max(4),
  message: z.string().max(250).optional(),
});

export const RefreshInsightsSchema = z.object({
  forceRefresh: z.boolean().optional().default(false),
});

export type AuthInput = z.infer<typeof AuthSchema>;
export type GenerateRequestInput = z.infer<typeof GenerateRequestSchema>;
export type Game = z.infer<typeof GameSchema>;
export type GameGenerationResponse = z.infer<typeof GameGenerationResponseSchema>;
export type ReflectionInput = z.infer<typeof ReflectionSchema>;
export type InsightsResponse = z.infer<typeof InsightsResponseSchema>;
