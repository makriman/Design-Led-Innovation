import { NextResponse } from "next/server";
import db, { type UserRow } from "@/lib/db";
import { AuthSchema } from "@/lib/schemas";
import { comparePassword, setAuthCookie, signAuthToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = AuthSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid username or password format." }, { status: 400 });
    }

    const username = parsed.data.username.trim();

    const user = db
      .prepare("SELECT id, username, password_hash, created_at FROM users WHERE username = ?")
      .get(username) as UserRow | undefined;

    if (!user) {
      return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
    }

    const passwordOk = await comparePassword(parsed.data.password, user.password_hash);
    if (!passwordOk) {
      return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
    }

    const token = signAuthToken({ userId: user.id, username: user.username });
    const response = NextResponse.json({ ok: true });
    setAuthCookie(response, token);
    return response;
  } catch {
    return NextResponse.json({ error: "Failed to log in." }, { status: 500 });
  }
}
