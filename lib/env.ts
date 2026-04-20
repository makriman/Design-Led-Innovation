function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}. Add it to .env.local`);
  }
  return value;
}

function resolveAnthropicModel(): string {
  const configuredModel = process.env.ANTHROPIC_MODEL?.trim();
  return configuredModel || "claude-sonnet-4-6";
}

export const env = {
  get anthropicApiKey() {
    return requireEnv("ANTHROPIC_API_KEY");
  },
  get anthropicModel() {
    return resolveAnthropicModel();
  },
  get databaseUrl() {
    return requireEnv("DATABASE_URL");
  },
  get appPasscodeHash() {
    return requireEnv("APP_PASSCODE_HASH");
  },
  get sessionSecret() {
    return process.env.SESSION_SECRET || process.env.JWT_SECRET || requireEnv("SESSION_SECRET");
  },
};
