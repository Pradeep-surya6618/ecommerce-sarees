/**
 * STUB hashing for the UI-only phase. NOT secure — real bcrypt
 * (cost 12) lands when the backend phase wires Users to DynamoDB.
 */
const STUB_PREFIX = "stub-hash:";

export async function hashPasswordStub(plain: string): Promise<string> {
  return `${STUB_PREFIX}${plain}`;
}

export async function verifyPasswordStub(plain: string, storedHash: string): Promise<boolean> {
  return storedHash === `${STUB_PREFIX}${plain}`;
}
