import { NextResponse, type NextRequest } from "next/server";

export const AGENT_SESSION_COOKIE = "agent_session";

const SESSION_TTL_SECONDS = 60 * 60 * 8;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 60;

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const bytesToBase64 = (bytes: Uint8Array): string => {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

const base64ToBytes = (base64: string): Uint8Array => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

const base64UrlEncode = (input: string): string =>
  bytesToBase64(textEncoder.encode(input))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

const base64UrlDecode = (input: string): string => {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = normalized.length % 4;
  const padded = pad === 0 ? normalized : `${normalized}${"=".repeat(4 - pad)}`;
  return textDecoder.decode(base64ToBytes(padded));
};

const getSessionSecret = (): string =>
  process.env.AGENT_SESSION_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  "dev-agent-secret-change-me";

const sign = async (payload: string): Promise<string> => {
  const key = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(getSessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    textEncoder.encode(payload),
  );

  return bytesToBase64(new Uint8Array(signatureBuffer))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
};

const timingSafeEqualString = (left: string, right: string): boolean => {
  if (left.length !== right.length) return false;
  let result = 0;
  for (let i = 0; i < left.length; i += 1) {
    result |= left.charCodeAt(i) ^ right.charCodeAt(i);
  }
  return result === 0;
};

const readCookie = (cookieHeader: string | null, name: string): string => {
  if (!cookieHeader) return "";
  const entries = cookieHeader.split(";").map((item) => item.trim());
  const target = entries.find((item) => item.startsWith(`${name}=`));
  if (!target) return "";
  return decodeURIComponent(target.slice(name.length + 1));
};

const getClientIp = (request: Request | NextRequest): string => {
  const forwarded = request.headers.get("x-forwarded-for") || "";
  const firstForwarded = forwarded.split(",")[0]?.trim();
  if (firstForwarded) return firstForwarded;
  return request.headers.get("x-real-ip") || "unknown";
};

const isRateLimited = (request: Request | NextRequest): boolean => {
  const ip = getClientIp(request);
  const key = `${ip}:agent-api`;
  const now = Date.now();

  const current = rateLimitStore.get(key);
  if (!current || now > current.resetAt) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return false;
  }

  current.count += 1;
  rateLimitStore.set(key, current);
  return current.count > RATE_LIMIT_MAX_REQUESTS;
};

export const verifyAdminCredentials = (
  username: string,
  password: string,
): boolean => {
  const isProduction = process.env.NODE_ENV === "production";
  const expectedUser = isProduction
    ? process.env.AGENT_ADMIN_USER || ""
    : "admin";
  const expectedPassword = isProduction
    ? process.env.AGENT_ADMIN_PASSWORD || ""
    : "admin";

  return (
    timingSafeEqualString(username.trim(), expectedUser) &&
    timingSafeEqualString(password, expectedPassword)
  );
};

export const isAdminCredentialsConfigured = (): boolean => {
  if (process.env.NODE_ENV !== "production") {
    return true;
  }

  return Boolean(
    process.env.AGENT_ADMIN_USER?.trim() &&
    process.env.AGENT_ADMIN_PASSWORD?.trim(),
  );
};

export const createSessionToken = async (username: string): Promise<string> => {
  const payload = JSON.stringify({
    sub: username,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  });
  const encodedPayload = base64UrlEncode(payload);
  const signature = await sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
};

export const isSessionTokenValid = async (token: string): Promise<boolean> => {
  if (!token || !token.includes(".")) return false;
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return false;

  const expectedSignature = await sign(encodedPayload);
  if (!timingSafeEqualString(signature, expectedSignature)) {
    return false;
  }

  try {
    const decoded = base64UrlDecode(encodedPayload);
    const parsed = JSON.parse(decoded) as { exp?: number };
    if (!parsed.exp || typeof parsed.exp !== "number") return false;
    return parsed.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
};

export const isAgentSessionValid = (
  request: Request | NextRequest,
): Promise<boolean> => {
  const token = readCookie(request.headers.get("cookie"), AGENT_SESSION_COOKIE);
  return isSessionTokenValid(token);
};

const withNoIndex = (response: NextResponse): NextResponse => {
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  return response;
};

export const ensureAgentApiAccess = async (
  request: Request | NextRequest,
): Promise<NextResponse | null> => {
  const hasSession = await isAgentSessionValid(request);
  if (!hasSession) {
    return withNoIndex(
      NextResponse.json(
        { ok: false, message: "Unauthorized" },
        { status: 401 },
      ),
    );
  }

  if (isRateLimited(request)) {
    return withNoIndex(
      NextResponse.json(
        { ok: false, message: "Too many requests" },
        { status: 429 },
      ),
    );
  }

  return null;
};

export const applySecurityHeaders = (
  response: NextResponse,
  pathname: string,
): NextResponse => {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );

  if (
    pathname.startsWith("/agent") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/agent")
  ) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    response.headers.set("Cache-Control", "no-store");
  }

  return response;
};

export const buildSessionCookie = (token: string): string => {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${AGENT_SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_TTL_SECONDS}${secure}`;
};

export const buildSessionCookieClear = (): string => {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${AGENT_SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`;
};
