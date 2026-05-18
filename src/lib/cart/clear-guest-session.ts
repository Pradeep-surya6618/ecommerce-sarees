import { cookies } from "next/headers";

export async function clearGuestSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete("gs_session");
}
