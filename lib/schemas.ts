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

export const UnlockSchema = z.object({
  passcode: z.string().trim().min(1).max(64),
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
    "Grade 8",
  ]),
  studentCount: z.number().int().min(10).max(120),
  subject: z.enum([
    "Maths",
    "History",
    "Chemistry",
    "Physics",
    "English",
    "Social Sciences",
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
  starRating: z.number().int().min(1).max(5),
  teacherFeedback: z.string().trim().min(3).max(3000).optional(),
  lowRatingReason: z.string().trim().min(3).max(200).optional(),
  lowRatingContext: z.string().trim().min(3).max(200).optional(),
  lowRatingSupport: z.string().trim().min(3).max(200).optional(),
  whatWorked: z.string().trim().min(3).max(3000).optional(),
  whatFlopped: z.string().trim().min(3).max(3000).optional(),
  whatToChange: z.string().trim().min(3).max(3000).optional(),
}).superRefine((value, context) => {
  const hasTeacherFeedback = Boolean(value.teacherFeedback?.trim());
  const hasLegacyFeedback = Boolean(value.whatWorked?.trim() && value.whatFlopped?.trim() && value.whatToChange?.trim());

  if (!hasTeacherFeedback && !hasLegacyFeedback) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Provide teacherFeedback or the legacy worked/flopped/change fields.",
    });
  }

  if (value.starRating <= 2) {
    if (!value.lowRatingReason?.trim()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["lowRatingReason"],
        message: "Low ratings require main issue selection.",
      });
    }
    if (!value.lowRatingContext?.trim()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["lowRatingContext"],
        message: "Low ratings require classroom factor selection.",
      });
    }
    if (!value.lowRatingSupport?.trim()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["lowRatingSupport"],
        message: "Low ratings require support selection.",
      });
    }
  }
});

export const CoachingResponseSchema = z.object({
  summary: z.string().min(4).max(400),
  tips: z.array(z.string().min(4).max(220)).min(2).max(4),
  futurePlanNote: z.string().min(4).max(240),
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

export type UnlockInput = z.infer<typeof UnlockSchema>;
export type GenerateRequestInput = z.infer<typeof GenerateRequestSchema>;
export type Game = z.infer<typeof GameSchema>;
export type GameGenerationResponse = z.infer<typeof GameGenerationResponseSchema>;
export type ReflectionInput = z.infer<typeof ReflectionSchema>;
export type CoachingResponse = z.infer<typeof CoachingResponseSchema>;
export type InsightsResponse = z.infer<typeof InsightsResponseSchema>;
