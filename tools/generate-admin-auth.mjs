import { randomBytes } from "node:crypto";

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32(bytes) {
  let bits = 0;
  let value = 0;
  let output = "";
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += alphabet[(value >>> (bits -= 5)) & 31];
    }
    value &= (1 << bits) - 1;
  }
  if (bits) output += alphabet[(value << (5 - bits)) & 31];
  return output;
}

const totpSecret = base32(randomBytes(20));
const sessionSecret = randomBytes(32).toString("hex");
const issuer = "Aditya Portfolio";
const account = "Admin";
const uri = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}?secret=${totpSecret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;

console.log("Keep these values private. Add them to your server environment:\n");
console.log(`ADMIN_TOTP_SECRET=${totpSecret}`);
console.log(`ADMIN_SESSION_SECRET=${sessionSecret}`);
console.log("\nIn Google Authenticator, choose Add code → Enter a setup key.");
console.log(`Account name: ${issuer} ${account}`);
console.log(`Setup key: ${totpSecret}`);
console.log("Key type: Time based");
console.log(`\nAuthenticator URI (also suitable for a QR code): ${uri}`);
