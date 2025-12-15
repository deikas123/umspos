import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static assets and service workers
  if (
    pathname === "/logo.png" ||
    pathname === "/favi.png" ||
    pathname.startsWith("/fonts") ||
    pathname === "/manifest.json" ||
    pathname === "/sw.js" ||
    pathname === "/custom-sw.js" ||
    pathname.startsWith("/workbox")
  ) {
    return NextResponse.next();
  }

  const isAuthPage =
    pathname.startsWith("/signin") ||
    pathname.startsWith("/two-factor") ||
    pathname.startsWith("/error");
  const isDeactivatedPage = pathname.startsWith("/deactivated");

  // Get session cookie (optimistic check - full validation happens in pages/routes)
  const sessionCookie = getSessionCookie(request);

  // If no session and not on auth/deactivated page, redirect to signin
  if (!sessionCookie) {
    if (isAuthPage || isDeactivatedPage) {
      return NextResponse.next();
    }
    const url = request.nextUrl.clone();
    url.pathname = "/signin";
    return NextResponse.redirect(url);
  }

  // If has session and on auth page, redirect to dashboard
  // This ensures authenticated users are redirected away from signin page
  if (isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!api|_next/static|_next/image|favicon.ico.*).*)",
  ],
};
