function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}. Add it to .env.local`);
  }
  return value;
}

function resolveAnthropicModel(): string {
  const configuredModel = process.env.ANTHROPIC_MODEL?.trim();
  return configuredModel || "claude-3-5-sonnet-latest";
}

function resolveAnthropicFeedbackModel(): string {
  const configuredModel = process.env.ANTHROPIC_FEEDBACK_MODEL?.trim();
  return configuredModel || "claude-3-haiku-20240307";
}

export const env = {
  get anthropicApiKey() {
    return requireEnv("ANTHROPIC_API_KEY").trim();
  },
  get anthropicModel() {
    return resolveAnthropicModel();
  },
  get anthropicFeedbackModel() {
    return resolveAnthropicFeedbackModel();
  },
  get databaseUrl() {
    return requireEnv("DATABASE_URL").trim();
  },
  get appPasscodeHash() {
    return requireEnv("APP_PASSCODE_HASH").trim();
  },
  get sessionSecret() {
    const secret = process.env.SESSION_SECRET || process.env.JWT_SECRET || requireEnv("SESSION_SECRET");
    return secret.trim();
  },
};
