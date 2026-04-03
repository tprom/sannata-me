import { NextResponse } from "next/server";
import {
  buildSessionCookie,
  createSessionToken,
  verifyAdminCredentials,
  isAdminCredentialsConfigured,
  applySecurityHeaders,
} from "@/lib/security/agent-auth";

type LoginBody = {
  username?: string;
  password?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LoginBody;
    const username = body.username?.trim() ?? "";
    const password = body.password ?? "";

    if (!username || !password) {
      const response = NextResponse.json(
        { ok: false, message: "Логин и пароль обязательны." },
        { status: 400 },
      );
      return applySecurityHeaders(response, "/admin/login");
    }

    if (!verifyAdminCredentials(username, password)) {
      const isConfigured = isAdminCredentialsConfigured();
      const defaultHint =
        process.env.NODE_ENV !== "production" && !isConfigured
          ? " Для локальной разработки используйте admin / admin или задайте AGENT_ADMIN_USER и AGENT_ADMIN_PASSWORD в .env.local."
          : "";
      const response = NextResponse.json(
        { ok: false, message: `Неверные учетные данные.${defaultHint}` },
        { status: 401 },
      );
      return applySecurityHeaders(response, "/admin/login");
    }

    const token = await createSessionToken(username);
    const response = NextResponse.json({ ok: true });
    response.headers.append("Set-Cookie", buildSessionCookie(token));
    return applySecurityHeaders(response, "/admin/login");
  } catch {
    const response = NextResponse.json(
      { ok: false, message: "Ошибка авторизации." },
      { status: 500 },
    );
    return applySecurityHeaders(response, "/admin/login");
  }
}
