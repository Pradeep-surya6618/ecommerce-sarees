import { sessionsRepo } from "@/lib/db/repos/sessions";
import { usersRepo } from "@/lib/db/repos/users";
import { logger } from "@/lib/logger";

// Deletes a user by email, along with all their active sessions.
//
// Usage: npm run user:delete -- <email>
async function main(): Promise<void> {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: npm run user:delete -- <email>");
    process.exit(2);
  }

  const user = await usersRepo.findByEmail(email);
  if (!user) {
    logger.info({ email }, "No user found with that email, nothing to delete");
    return;
  }

  await sessionsRepo.deleteByUserId(user.id);
  await usersRepo.deleteById(user.id);

  logger.info({ email, userId: user.id }, "User deleted");
}

main()
  .then(() => {
    logger.info("Done");
    process.exit(0);
  })
  .catch((err) => {
    logger.error({ err }, "Delete failed");
    process.exit(1);
  });
