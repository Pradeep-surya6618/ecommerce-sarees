import { sessionsRepo } from "@/lib/db/repos/sessions";
import { usersRepo } from "@/lib/db/repos/users";
import type { User } from "@/types/domain";
import { getSessionCookie } from "./session-cookie";

export async function getCurrentUser(): Promise<User | null> {
  const sessionId = await getSessionCookie();
  if (!sessionId) return null;
  const session = await sessionsRepo.findById(sessionId);
  if (!session) return null;
  return usersRepo.findById(session.userId);
}
