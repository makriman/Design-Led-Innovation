import { NextRequest, NextResponse } from "next/server";

const AUTH_COOKIE_NAME = "inspire_token";

const protectedRoutes = ["/dashboard", "/generate", "/history", "/reflect", "/insights"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  const isProtected = protectedRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
  if (isProtected && !token) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/generate/:path*", "/history/:path*", "/reflect/:path*", "/insights/:path*"],
};
