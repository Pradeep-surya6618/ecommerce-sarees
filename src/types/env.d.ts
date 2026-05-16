import type { Env } from "@/lib/env";

declare global {
  namespace NodeJS {
    type ProcessEnv = Partial<Record<keyof Env, string>>;
  }
}

export {};
