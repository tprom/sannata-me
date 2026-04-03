import { NextResponse } from "next/server";
import {
  applySecurityHeaders,
  buildSessionCookieClear,
} from "@/lib/security/agent-auth";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.headers.append("Set-Cookie", buildSessionCookieClear());
  return applySecurityHeaders(response, "/admin/login");
}
