import CryptoJS from "crypto-js";
import { CIPHER_SECRET } from "./constant";
const APP_SECRET = CIPHER_SECRET;
function deriveKey(userId: string): string {
  return CryptoJS.SHA256(`${APP_SECRET}:${userId}`).toString();
}

export function encryptPasskey(passkey: string, userId: string): string {
  const key = deriveKey(userId);
  return CryptoJS.AES.encrypt(passkey, key).toString();
}

export function decryptPasskey(ciphertext: string, userId: string): string {
  if (!ciphertext) return "";
  try {
    const key = deriveKey(userId);
    const bytes = CryptoJS.AES.decrypt(ciphertext, key);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch {
    return "";
  }
}
