"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";
import { signSession } from "@/lib/auth/session";
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "@/lib/auth/constants";

export async function loginAction(_prev: { error?: string } | undefined, formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const expected = env.ADMIN_PASSWORD;

  const a = Buffer.from(password.padEnd(expected.length, "\0"));
  const b = Buffer.from(expected.padEnd(password.length, "\0"));
  const ok = a.length === b.length && timingSafeEqual(a, b) && password.length === expected.length;

  if (!ok) {
    return { error: "Wrong password" };
  }

  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, signSession(), {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  redirect("/");
}
