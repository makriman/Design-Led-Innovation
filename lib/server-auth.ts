import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth";
import db from "@/lib/db";

export async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const payload = verifyAuthToken(token);
  if (!payload) {
    return null;
  }

  const user = db.prepare("SELECT id, username FROM users WHERE id = ?").get(payload.userId) as
    | { id: number; username: string }
    | undefined;

  return user ?? null;
}

export async function requireSessionUser() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}
