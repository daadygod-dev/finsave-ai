/**
 * Transaction category metadata shared by the dashboard, transactions
 * module, and anywhere else categories are rendered. Mirror of the backend
 * TransactionCategory enum (prisma/schema.prisma, src/backend/categorization/rules.ts).
 */
import type { TransactionCategory } from '../api/types'

export const TRANSACTION_CATEGORIES: TransactionCategory[] = [
  'food',
  'transport',
  'mobile_money',
  'utilities',
  'rent',
  'income',
  'uncategorized',
]

export type CategoryMeta = {
  label: string
  /** Tailwind dot color for inline lists. */
  dot: string
  /** Badge tone for chips (see components/ui/Badge.tsx). */
  badge: 'neutral' | 'palm' | 'lake' | 'maize' | 'brick'
}

export const CATEGORY_META: Record<TransactionCategory, CategoryMeta> = {
  food: { label: 'Food & market', dot: 'bg-lake', badge: 'lake' },
  transport: { label: 'Transport', dot: 'bg-palm', badge: 'palm' },
  mobile_money: { label: 'Mobile money', dot: 'bg-maize', badge: 'maize' },
  utilities: { label: 'Utilities', dot: 'bg-lake/60', badge: 'lake' },
  rent: { label: 'Rent', dot: 'bg-brick', badge: 'brick' },
  income: { label: 'Income', dot: 'bg-palm', badge: 'palm' },
  uncategorized: { label: 'Uncategorized', dot: 'bg-ink/30', badge: 'neutral' },
}

export function categoryLabel(category: string): string {
  return CATEGORY_META[category as TransactionCategory]?.label ?? category.replace(/_/g, ' ')
}

export function categoryMeta(category: string): CategoryMeta {
  return CATEGORY_META[category as TransactionCategory] ?? CATEGORY_META.uncategorized
}
