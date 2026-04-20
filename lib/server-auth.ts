import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE_NAME, isUnlockedToken } from "@/lib/auth";

const SINGLE_USER = {
  id: 1,
  username: "Teacher",
} as const;

export async function isSessionUnlocked() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  return isUnlockedToken(token);
}

export async function getSessionUser() {
  if (await isSessionUnlocked()) {
    return SINGLE_USER;
  }
  return null;
}

export async function requireSessionUser() {
  if (!(await isSessionUnlocked())) {
    redirect("/unlock");
  }
  return SINGLE_USER;
}
