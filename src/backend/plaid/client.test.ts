import { describe, expect, it } from 'vitest'
import { plaidAmountToRwfMinor } from './client'
import { decryptSecret, encryptSecret } from './tokenCipher'

describe('plaidAmountToRwfMinor', () => {
  it('converts sandbox USD amounts to RWF minor units', () => {
    expect(plaidAmountToRwfMinor(-45.32, 'sandbox')).toBe(-58916n)
    expect(plaidAmountToRwfMinor(100, 'sandbox')).toBe(130000n)
  })

  it('passes amounts through unchanged outside sandbox', () => {
    expect(plaidAmountToRwfMinor(100, 'production')).toBe(100n)
  })
})

describe('token cipher', () => {
  const key = 'some-secret-key-123'

  it('round-trips a secret through AES-256-GCM', () => {
    const ciphertext = encryptSecret('access-sandbox-abcdef', key)

    expect(ciphertext).not.toContain('access-sandbox-abcdef')
    expect(decryptSecret(ciphertext, key)).toBe('access-sandbox-abcdef')
  })

  it('fails to decrypt with the wrong key', () => {
    const ciphertext = encryptSecret('access-sandbox-abcdef', key)

    expect(() => decryptSecret(ciphertext, 'wrong-key')).toThrow()
  })
})
