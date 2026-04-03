import createIntlMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import {
  applySecurityHeaders,
  ensureAgentApiAccess,
  isAgentSessionValid,
} from "@/lib/security/agent-auth";

const intlMiddleware = createIntlMiddleware({
  locales: ["en", "de", "ru", "uk"],
  defaultLocale: "en",
});

const isAgentPagePath = (pathname: string): boolean =>
  pathname === "/agent" ||
  pathname.startsWith("/agent/") ||
  /^\/(en|de|ru|uk)\/agent(\/|$)/.test(pathname);

const isProtectedAdminPath = (pathname: string): boolean =>
  pathname.startsWith("/admin") && pathname !== "/admin/login";

const isServicePath = (pathname: string): boolean =>
  pathname.startsWith("/api/agent") ||
  pathname.startsWith("/admin") ||
  isAgentPagePath(pathname);

const normalizeAgentNextPath = (pathname: string): string => {
  const localized = pathname.match(/^\/(en|de|ru|uk)\/agent(\/.*)?$/);
  if (localized) {
    return `/agent${localized[2] ?? ""}`;
  }
  return pathname;
};

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/agent")) {
    const denied = await ensureAgentApiAccess(request);
    if (denied) {
      return applySecurityHeaders(denied, pathname);
    }

    return applySecurityHeaders(NextResponse.next(), pathname);
  }

  if (isAgentPagePath(pathname) || isProtectedAdminPath(pathname)) {
    if (!(await isAgentSessionValid(request))) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("next", normalizeAgentNextPath(pathname));
      const redirect = NextResponse.redirect(loginUrl);
      return applySecurityHeaders(redirect, "/admin/login");
    }
  }

  if (pathname.startsWith("/admin")) {
    return applySecurityHeaders(NextResponse.next(), pathname);
  }

  const response = pathname.startsWith("/api")
    ? NextResponse.next()
    : intlMiddleware(request);

  return applySecurityHeaders(
    response,
    isServicePath(pathname) ? pathname : "",
  );
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\..*).*)",
  ],
};
