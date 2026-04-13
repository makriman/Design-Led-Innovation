function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}. Add it to .env.local`);
  }
  return value;
}

export const env = {
  anthropicApiKey: requireEnv("ANTHROPIC_API_KEY"),
  jwtSecret: requireEnv("JWT_SECRET"),
};
