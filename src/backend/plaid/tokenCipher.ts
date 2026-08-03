/**
 * AES-256-GCM encryption for stored third-party secrets (Plaid access tokens).
 *
 * The schema field is deliberately named `accessTokenCiphertext` — a Plaid
 * access token is a credential that can read a user's bank data, so it is
 * never stored in plaintext. The key is derived from TOKEN_ENCRYPTION_KEY
 * (any string; hashed to 32 bytes) and must be present to store or read
 * tokens. Fail closed when the key is missing.
 */
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'

const IV_LENGTH = 12
const AUTH_TAG_LENGTH = 16

function deriveKey(secret: string) {
  return createHash('sha256').update(secret).digest()
}

export function encryptSecret(plaintext: string, keySecret: string): string {
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv('aes-256-gcm', deriveKey(keySecret), iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()

  if (tag.length !== AUTH_TAG_LENGTH) {
    throw new Error('crypto_unavailable')
  }

  return [iv.toString('base64'), tag.toString('base64'), encrypted.toString('base64')].join('.')
}

export function decryptSecret(payload: string, keySecret: string): string {
  const [ivB64, tagB64, dataB64] = payload.split('.')

  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error('malformed_ciphertext')
  }

  const decipher = createDecipheriv(
    'aes-256-gcm',
    deriveKey(keySecret),
    Buffer.from(ivB64, 'base64'),
  )
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'))
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataB64, 'base64')),
    decipher.final(),
  ])

  return decrypted.toString('utf8')
}

export function getTokenEncryptionKey(
  env: NodeJS.ProcessEnv = process.env,
): string | null {
  return env.TOKEN_ENCRYPTION_KEY ?? null
}
