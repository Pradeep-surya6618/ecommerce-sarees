import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

async function main(): Promise<void> {
  logger.info(
    { email: env.ADMIN_BOOTSTRAP_EMAIL },
    "admin bootstrap stub — implementation lands in Phase 3 (Auth)",
  );
  console.log(
    "Bootstrap admin is a stub. It becomes functional after Phase 3 implements lib/auth and the Users repository.",
  );
}

main().catch((err) => {
  logger.error({ err }, "admin bootstrap failed");
  process.exit(1);
});
