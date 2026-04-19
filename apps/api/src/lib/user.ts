export function stripPassword<T extends { password_hash?: string }>(user: T): Omit<T, "password_hash"> {
  const { password_hash: _, ...safe } = user;
  return safe as Omit<T, "password_hash">;
}
