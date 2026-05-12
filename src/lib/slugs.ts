import { customAlphabet } from "nanoid";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const nano = customAlphabet(ALPHABET, 6);

export function generateShortSlug(): string {
  return nano();
}
