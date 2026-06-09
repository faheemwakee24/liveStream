const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

export function generateRoomId(length = 9): string {
  const out: string[] = [];
  const arr = new Uint32Array(length);
  crypto.getRandomValues(arr);
  for (let i = 0; i < length; i++) {
    out.push(ALPHABET[arr[i] % ALPHABET.length]);
    if (i === 2 || i === 5) out.push("-");
  }
  return out.join("");
}
