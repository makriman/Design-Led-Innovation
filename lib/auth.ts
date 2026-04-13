import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { env } from "@/lib/env";
import db, { type UserRow } from "@/lib/db";

export const AUTH_COOKIE_NAME = "inspire_token";
const TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export type AuthTokenPayload = {
  userId: number;
  username: string;
};

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function signAuthToken(payload: AuthTokenPayload) {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: "7d" });
}

export function verifyAuthToken(token: string): AuthTokenPayload | null {
  try {
    return jwt.verify(token, env.jwtSecret) as AuthTokenPayload;
  } catch {
    return null;
  }
}

export function setAuthCookie(response: NextResponse, token: string) {
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TOKEN_MAX_AGE_SECONDS,
  });
}

export function clearAuthCookie(response: NextResponse) {
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  const payload = verifyAuthToken(token);
  if (!payload) {
    return null;
  }

  const user = db
    .prepare("SELECT id, username, password_hash, created_at FROM users WHERE id = ?")
    .get(payload.userId) as UserRow | undefined;

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
  };
}

export async function requireApiUserFromCookie(cookieToken?: string) {
  if (!cookieToken) {
    return null;
  }

  const payload = verifyAuthToken(cookieToken);
  if (!payload) {
    return null;
  }

  const user = db.prepare("SELECT id, username FROM users WHERE id = ?").get(payload.userId) as
    | Pick<UserRow, "id" | "username">
    | undefined;

  return user ?? null;
}
