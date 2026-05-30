import { cookies } from "next/headers";

const COOKIE_NAME = "gym_user_id";

export async function getUserId(): Promise<string | null> {
  const c = await cookies();
  return c.get(COOKIE_NAME)?.value || null;
}

export async function setUserIdCookie(id: string) {
  const c = await cookies();
  c.set(COOKIE_NAME, id, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
