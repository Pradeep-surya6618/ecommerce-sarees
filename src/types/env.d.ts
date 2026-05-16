import type { Env } from "@/lib/env";

// ProcessEnv values are always strings at runtime.
// This type alias maps known Env keys to optional strings for editor autocomplete.
type KnownEnvKeys = Partial<Record<keyof Env, string>>;

declare global {
  namespace NodeJS {
    interface ProcessEnv extends KnownEnvKeys {
      // Inherits optional string overloads for all known Env variable names.
      // The actual typed, validated values are accessed via the `env` export in @/lib/env.
      readonly _envTypesLoaded?: "true";
    }
  }
}

export {};
