const crypto = require('crypto');

const PREFIX = 'enc:v1:';

function resolveKey() {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) {
    throw new Error('Missing ENCRYPTION_KEY in environment.');
  }

  if (/^[a-fA-F0-9]{64}$/.test(raw)) {
    return Buffer.from(raw, 'hex');
  }

  const maybeBase64 = Buffer.from(raw, 'base64');
  if (maybeBase64.length === 32) {
    return maybeBase64;
  }

  throw new Error('ENCRYPTION_KEY must be 32-byte base64 or 64-char hex.');
}

const ENCRYPTION_KEY = resolveKey();

function encryptText(plainText) {
  if (!plainText || typeof plainText !== 'string') {
    return plainText;
  }

  if (plainText.startsWith(PREFIX)) {
    return plainText;
  }

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${PREFIX}${iv.toString('base64url')}.${tag.toString('base64url')}.${encrypted.toString('base64url')}`;
}

function decryptText(cipherText) {
  if (!cipherText || typeof cipherText !== 'string') {
    return cipherText;
  }

  if (!cipherText.startsWith(PREFIX)) {
    return cipherText;
  }

  const payload = cipherText.slice(PREFIX.length);
  const [ivB64, tagB64, dataB64] = payload.split('.');

  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error('Invalid encrypted payload format.');
  }

  const iv = Buffer.from(ivB64, 'base64url');
  const tag = Buffer.from(tagB64, 'base64url');
  const encrypted = Buffer.from(dataB64, 'base64url');

  const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

  return decrypted.toString('utf8');
}

module.exports = {
  encryptText,
  decryptText
};
