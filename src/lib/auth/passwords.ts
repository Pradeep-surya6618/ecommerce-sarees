import bcrypt from "bcryptjs";

const BCRYPT_COST = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_COST);
}

export async function verifyPassword(plain: string, storedHash: string): Promise<boolean> {
  if (!storedHash) return false;
  return bcrypt.compare(plain, storedHash);
}

// Backwards-compatible aliases used by older call sites. Same behaviour as
// hashPassword / verifyPassword — the "stub" name remains so we can remove
// the alias in a follow-up sweep without touching this file again.
export const hashPasswordStub = hashPassword;
export const verifyPasswordStub = verifyPassword;
