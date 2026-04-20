import { NextResponse } from "next/server";
import { setSessionCookie, signSessionToken, verifyAppPasscode } from "@/lib/auth";
import { UnlockSchema } from "@/lib/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = UnlockSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid passcode payload." }, { status: 400 });
    }

    const passcodeOk = verifyAppPasscode(parsed.data.passcode);
    if (!passcodeOk) {
      return NextResponse.json({ error: "Incorrect passcode." }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true });
    setSessionCookie(response, signSessionToken());
    return response;
  } catch {
    return NextResponse.json({ error: "Could not unlock app." }, { status: 500 });
  }
}
