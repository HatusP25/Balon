import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";

export async function POST() {
  const store = await cookies();
  store.delete(SESSION_COOKIE_NAME);
  redirect("/login");
}

export async function GET() {
  // also allow clearing via GET for convenience
  const store = await cookies();
  store.delete(SESSION_COOKIE_NAME);
  redirect("/login");
}
