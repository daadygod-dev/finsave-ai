import { describe, expect, it } from 'vitest'
import {
  authErrorMessage,
  validateConfirmPassword,
  validateEmail,
  validatePassword,
} from './validators'

describe('validateEmail', () => {
  it('accepts a well-formed email', () => {
    expect(validateEmail('owner@example.com')).toBeNull()
  })

  it('rejects missing and malformed emails', () => {
    expect(validateEmail('')).not.toBeNull()
    expect(validateEmail('not-an-email')).not.toBeNull()
    expect(validateEmail('owner@')).not.toBeNull()
  })
})

describe('validatePassword', () => {
  it('requires at least 8 characters', () => {
    expect(validatePassword('12345678')).toBeNull()
    expect(validatePassword('short')).not.toBeNull()
  })

  it('requires a value', () => {
    expect(validatePassword('')).not.toBeNull()
  })
})

describe('validateConfirmPassword', () => {
  it('requires matching confirmation', () => {
    expect(validateConfirmPassword('secret-pass', 'secret-pass')).toBeNull()
    expect(validateConfirmPassword('secret-pass', 'different')).not.toBeNull()
    expect(validateConfirmPassword('secret-pass', '')).not.toBeNull()
  })
})

describe('authErrorMessage', () => {
  it('maps common Supabase errors to friendly messages', () => {
    expect(authErrorMessage(new Error('Invalid login credentials'))).toBe(
      'Incorrect email or password.',
    )
    expect(authErrorMessage(new Error('Email not confirmed'))).toContain('confirm your email')
    expect(authErrorMessage(new Error('User already registered'))).toContain('already exists')
  })

  it('passes through unknown messages', () => {
    expect(authErrorMessage(new Error('something unexpected'))).toBe('something unexpected')
  })
})
