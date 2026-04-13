import { NextResponse } from "next/server";
import db from "@/lib/db";
import { AuthSchema } from "@/lib/schemas";
import { hashPassword, setAuthCookie, signAuthToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = AuthSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid username or password format." }, { status: 400 });
    }

    const username = parsed.data.username.trim();

    const existing = db.prepare("SELECT id FROM users WHERE username = ?").get(username) as { id: number } | undefined;
    if (existing) {
      return NextResponse.json({ error: "Username already exists." }, { status: 409 });
    }

    const passwordHash = await hashPassword(parsed.data.password);
    const result = db
      .prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)")
      .run(username, passwordHash);

    const userId = Number(result.lastInsertRowid);
    const token = signAuthToken({ userId, username });

    const response = NextResponse.json({ ok: true, userId });
    setAuthCookie(response, token);
    return response;
  } catch {
    return NextResponse.json({ error: "Failed to create account." }, { status: 500 });
  }
}
