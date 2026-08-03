import { Decimal } from 'decimal.js'

export type TransactionForCategorization = {
  merchantName: string
  amountMinor: bigint | number
}

export type CategorizedTransaction = TransactionForCategorization & {
  category: TransactionCategory
  confidence: number
}

export const TRANSACTION_CATEGORIES = [
  'food',
  'transport',
  'mobile_money',
  'utilities',
  'rent',
  'income',
  'uncategorized',
] as const

export type TransactionCategory = (typeof TRANSACTION_CATEGORIES)[number]

const keywordRules: Array<{
  category: TransactionCategory
  confidence: number
  keywords: string[]
}> = [
  { category: 'mobile_money', confidence: 0.95, keywords: ['mtn momo', 'airtel money', 'mobile money'] },
  { category: 'transport', confidence: 0.9, keywords: ['taxi', 'moto', 'fuel', 'yego'] },
  { category: 'food', confidence: 0.9, keywords: ['market', 'restaurant', 'grocery', 'supermarket'] },
  { category: 'utilities', confidence: 0.9, keywords: ['electricity', 'water', 'wasac', 'reg'] },
  { category: 'rent', confidence: 0.9, keywords: ['rent', 'landlord'] },
  { category: 'income', confidence: 0.92, keywords: ['salary', 'client payment', 'invoice'] },
]

export function categorizeTransaction(
  transaction: TransactionForCategorization,
): CategorizedTransaction {
  const merchant = transaction.merchantName.toLowerCase()
  const amount = new Decimal(transaction.amountMinor.toString())

  if (amount.isPositive() && merchant.includes('deposit')) {
    return { ...transaction, category: 'income', confidence: 0.85 }
  }

  const match = keywordRules.find((rule) =>
    rule.keywords.some((keyword) => merchant.includes(keyword)),
  )

  if (!match) {
    return { ...transaction, category: 'uncategorized', confidence: 0 }
  }

  return {
    ...transaction,
    category: match.category,
    confidence: match.confidence,
  }
}
