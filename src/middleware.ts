import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, SESSION_PAYLOAD } from "@/lib/auth/constants";

const ADMIN_PATHS = ["/", "/roster", "/settings", "/matches"];

function isAdminPath(pathname: string): boolean {
  if (pathname === "/") return true;
  return ADMIN_PATHS.some((p) => p !== "/" && (pathname === p || pathname.startsWith(`${p}/`)));
}

async function hmacHex(secret: string, payload: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function verifySessionEdge(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const dot = token.indexOf(".");
  if (dot === -1) return false;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (payload !== SESSION_PAYLOAD || sig.length !== 64) return false;
  const secret = process.env.SESSION_SECRET;
  if (!secret) return false;
  const expected = await hmacHex(secret, payload);
  // Constant-time compare via XOR
  if (sig.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) {
    diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!isAdminPath(pathname)) return NextResponse.next();
  if (pathname === "/login") return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const valid = await verifySessionEdge(token);
  if (!valid) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - /login, /logout, /p (public viewer routes), /api/avatars (public), /api/og (public OG image generation), /_next, static files
     */
    "/((?!login|logout|p/|p$|api/avatars|api/og|_next/|favicon.ico).*)",
  ],
};
