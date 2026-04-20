import jwt from "jsonwebtoken";
import { scryptSync, timingSafeEqual } from "node:crypto";
import type { NextResponse } from "next/server";
import { env } from "@/lib/env";

export const AUTH_COOKIE_NAME = "inspire_unlock";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;
const HASH_PREFIX = "scrypt";

type SessionTokenPayload = {
  scope: "unlock";
};

export function verifyAppPasscode(passcode: string) {
  const encodedHash = env.appPasscodeHash.trim();
  const [algorithm, salt, hashHex] = encodedHash.split("$");

  if (algorithm !== HASH_PREFIX || !salt || !hashHex) {
    return false;
  }

  const expected = Buffer.from(hashHex, "hex");
  const derived = scryptSync(passcode, salt, expected.length);
  if (expected.length !== derived.length) {
    return false;
  }
  return timingSafeEqual(expected, derived);
}

export function signSessionToken() {
  const payload: SessionTokenPayload = { scope: "unlock" };
  return jwt.sign(payload, env.sessionSecret, { expiresIn: "12h" });
}

export function verifySessionToken(token: string): SessionTokenPayload | null {
  try {
    return jwt.verify(token, env.sessionSecret) as SessionTokenPayload;
  } catch {
    return null;
  }
}

export function isUnlockedToken(token?: string) {
  if (!token) {
    return false;
  }

  const payload = verifySessionToken(token);
  return payload?.scope === "unlock";
}

export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export function clearSessionCookie(response: NextResponse) {
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

export function requireUnlockedApiFromCookie(cookieToken?: string) {
  return isUnlockedToken(cookieToken);
}
