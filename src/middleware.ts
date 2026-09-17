import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const { pathname } = request.nextUrl;
  const isRanked = host.split(":")[0] === "ranked.oldboys.games";

  if (isRanked && pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/zhou";
    return NextResponse.redirect(url);
  }

  if (pathname === "/zhou" || pathname.startsWith("/zhou/")) {
    const url = request.nextUrl.clone();
    const stripped = pathname.slice("/zhou".length);
    url.pathname = stripped.length > 0 ? stripped : "/";
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
