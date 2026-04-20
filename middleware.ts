import { NextRequest, NextResponse } from "next/server";

const AUTH_COOKIE_NAME = "inspire_unlock";

const protectedRoutes = ["/", "/dashboard", "/generate", "/history", "/reflect", "/insights"];

function isProtectedPath(pathname: string) {
  return protectedRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const unlocked = Boolean(request.cookies.get(AUTH_COOKIE_NAME)?.value);

  if (pathname === "/unlock" && unlocked) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (isProtectedPath(pathname) && !unlocked) {
    return NextResponse.redirect(new URL("/unlock", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/unlock", "/dashboard/:path*", "/generate/:path*", "/history/:path*", "/reflect/:path*", "/insights/:path*"],
};
