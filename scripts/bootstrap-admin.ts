import { hashPassword, verifyPassword } from "@/lib/auth/passwords";
import { usersRepo } from "@/lib/db/repos/users";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

// Creates or syncs the admin user in DynamoDB from
// ADMIN_BOOTSTRAP_EMAIL / ADMIN_BOOTSTRAP_PASSWORD env vars.
//
// Idempotent and password-syncing:
//  - No user with that email → create with role=admin, email verified.
//  - User exists but isn't admin → promote to admin.
//  - User exists with a different password → update the hash from env.
//
// Run: npm run admin:bootstrap
async function main(): Promise<void> {
  const email = env.ADMIN_BOOTSTRAP_EMAIL;
  const password = env.ADMIN_BOOTSTRAP_PASSWORD;

  logger.info({ email }, "Bootstrapping admin user");

  const existing = await usersRepo.findByEmail(email);

  if (existing) {
    logger.info({ email, userId: existing.id }, "Existing user found");

    if (existing.role !== "admin") {
      await usersRepo.promoteToAdmin(existing.id);
      logger.info({ userId: existing.id }, "Promoted to admin");
    }

    if (!existing.emailVerified) {
      await usersRepo.markEmailVerified(existing.id);
      logger.info({ userId: existing.id }, "Email marked verified");
    }

    const passwordMatches = await verifyPassword(password, existing.passwordHash);
    if (!passwordMatches) {
      const newHash = await hashPassword(password);
      await usersRepo.updatePasswordHash(existing.id, newHash);
      logger.info({ userId: existing.id }, "Password updated from env");
    } else {
      logger.info({ userId: existing.id }, "Password unchanged");
    }

    return;
  }

  const passwordHash = await hashPassword(password);
  const user = await usersRepo.create({
    email,
    fullName: "Administrator",
    passwordHash,
    role: "admin",
    provider: "email",
  });
  await usersRepo.markEmailVerified(user.id);

  logger.info({ email, userId: user.id }, "Admin user created");
}

main()
  .then(() => {
    logger.info("Admin bootstrap complete");
    process.exit(0);
  })
  .catch((err) => {
    logger.error({ err }, "Admin bootstrap failed");
    process.exit(1);
  });
