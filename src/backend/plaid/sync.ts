/**
 * Transaction sync from Plaid into the transactions table.
 *
 * Per AGENTS.md §3, sync is per account, never per user: each linked bank
 * account has its own access token and is synced independently. The sweep
 * (`syncAllAccounts`) iterates over every plaid-linked account so a user
 * with several banks gets all of them updated.
 */
import { categorizeBatchWithFallback } from '../categorization/pipeline'
import { prisma } from '../db/client'
import { decryptSecret, getTokenEncryptionKey } from './tokenCipher'
import { getPlaidConfig, plaidAmountToRwfMinor, syncTransactions } from './client'

export type SyncResult = {
  imported: number
  cursor: string
  skipped: number
}

export async function syncLinkedAccount(accountId: string): Promise<SyncResult> {
  const account = await prisma.account.findUnique({
    where: { id: accountId },
    select: {
      id: true,
      source: true,
      accessTokenCiphertext: true,
    },
  })

  if (!account || account.source !== 'plaid_bank' || !account.accessTokenCiphertext) {
    throw Object.assign(new Error('account_not_synced'), { statusCode: 404 })
  }

  const config = getPlaidConfig()
  const key = getTokenEncryptionKey()

  if (!config || !key) {
    throw Object.assign(new Error('plaid_not_configured'), { statusCode: 503 })
  }

  const accessToken = decryptSecret(account.accessTokenCiphertext, key)
  const sync = await syncTransactions(config, accessToken)

  const categorized = await categorizeBatchWithFallback(
    sync.added.map((transaction) => ({
      merchantName: transaction.name,
      amountMinor: plaidAmountToRwfMinor(transaction.amount, config.env),
    })),
  )

  const created = await prisma.transaction.createMany({
    data: sync.added.map((transaction, index) => ({
      accountId: account.id,
      externalId: transaction.transaction_id,
      merchantName: transaction.name,
      amountMinor: categorized[index].amountMinor,
      category: categorized[index].category,
      occurredAt: new Date(`${transaction.date}T00:00:00.000Z`),
      rawDescription: transaction.pending ? `pending: ${transaction.name}` : transaction.name,
    })),
    skipDuplicates: true,
  })

  await prisma.account.update({
    where: { id: account.id },
    data: { lastSyncedAt: new Date() },
  })

  return {
    imported: created.count,
    cursor: sync.next_cursor,
    skipped: sync.modified.length + sync.removed.length,
  }
}

/**
 * Scheduled sweep: sync every plaid-linked account in the system. One
 * account failing must not stop the others — this runs unattended as a
 * system job (AGENTS.md §6 `system` role).
 */
export async function syncAllAccounts() {
  const accounts = await prisma.account.findMany({
    where: { source: 'plaid_bank' },
    select: { id: true },
  })

  const results: Array<{ accountId: string; ok: boolean; imported?: number; error?: string }> = []

  for (const account of accounts) {
    try {
      const result = await syncLinkedAccount(account.id)
      results.push({ accountId: account.id, ok: true, imported: result.imported })
    } catch (error) {
      results.push({
        accountId: account.id,
        ok: false,
        error: error instanceof Error ? error.message : 'sync_failed',
      })
    }
  }

  return results
}
