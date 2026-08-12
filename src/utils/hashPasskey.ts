export async function hashPasskey(
  passkey: string,
  userId: string,
): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${userId}:${passkey}`);
  const digest = await crypto.subtle.digest("SHA-256", data);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
