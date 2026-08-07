/**
 * TEMPORARY Phase 4 unblocking tool — promote a user to `msme_owner`.
 *
 * Usage:
 *   npm run role:promote -- --list               # read-only user listing
 *   npm run role:promote -- <email>              # promote one user
 *   TEST_USER_EMAIL=<email> npm run role:promote # same, via env
 *
 * Why it updates BOTH sources of truth:
 *   - Prisma `User.role` is what the backend role gate reads
 *     (`requireRoles('msme_owner')` → `authenticateConsumer`).
 *   - Supabase `user_metadata.role` is read by `POST /api/v1/auth/register`,
 *     which the login page calls on EVERY sign-in and which upserts the
 *     Prisma row back to the metadata role (src/backend/routes/auth.ts).
 *     Flipping Prisma alone would be silently reverted on the test user's
 *     next login.
 *
 * Delete this script once Phase 4 validation is complete.
 */
import 'dotenv/config'
import { UserRole } from '@prisma/client'
import { prisma } from '../src/backend/db/client'
import { getSupabaseAdmin } from '../src/backend/supabase'

const TARGET_ROLE = UserRole.msme_owner

function usage(): never {
  console.log(`Usage:
  npm run role:promote -- --list        list users (read-only)
  npm run role:promote -- <email>       promote <email> to ${TARGET_ROLE}
  TEST_USER_EMAIL=<email> npm run role:promote`)
  process.exit(1)
}

async function listUsers() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
      _count: { select: { accounts: true, creditScores: true } },
    },
  })

  if (users.length === 0) {
    console.log('No users in the PostgreSQL User table.')
    return
  }

  console.log('Users in the PostgreSQL User table:')
  for (const user of users) {
    console.log(
      `  ${user.role.padEnd(12)} ${user.email.padEnd(44)} accounts=${user._count.accounts} scores=${user._count.creditScores} created=${user.createdAt.toISOString()} id=${user.id}`,
    )
  }
}

/** Best-effort: keep Supabase metadata in sync so register-upserts don't revert the flip. */
async function syncSupabaseMetadata(userId: string) {
  const supabase = getSupabaseAdmin()

  if (!supabase) {
    console.warn('  ! SUPABASE_SERVICE_ROLE_KEY not configured — skipped Supabase metadata sync.')
    return
  }

  // Merge, never replace: metadata also carries name / onboarding flags.
  const { data: current, error: readError } = await supabase.auth.admin.getUserById(userId)

  if (readError || !current?.user) {
    console.warn(`  ! Could not read Supabase user metadata (${readError?.message ?? 'not found'}).`)
    return
  }

  const { error } = await supabase.auth.admin.updateUserById(userId, {
    user_metadata: { ...(current.user.user_metadata ?? {}), role: TARGET_ROLE },
  })

  if (error) {
    console.warn(`  ! Supabase metadata sync failed (${error.message}).`)
  } else {
    console.log('  ✓ Supabase user_metadata.role synced to msme_owner.')
  }
}

async function promoteUser(email: string) {
  const user = await prisma.user.findUnique({ where: { email } })

  if (!user) {
    console.error(`No user with email "${email}" in the PostgreSQL User table.`)
    console.error('Run `npm run role:promote -- --list` to see existing users.')
    process.exit(1)
  }

  console.log(`Target: ${user.email} (current role: ${user.role})`)

  if (user.role === TARGET_ROLE) {
    console.log('  Already msme_owner — no Prisma update needed.')
  } else {
    await prisma.user.update({ where: { id: user.id }, data: { role: TARGET_ROLE } })
    console.log(`  ✓ Prisma User.role updated: ${user.role} → ${TARGET_ROLE}.`)
  }

  await syncSupabaseMetadata(user.id)
  console.log('Done. The backend role gate now passes — no sign-out needed.',)
}

async function main() {
  const args = process.argv.slice(2)

  if (args.length === 0) usage()

  if (args[0] === '--help' || args[0] === '-h') usage()

  if (args[0] === '--list') {
    await listUsers()
    return
  }

  const email = args[0] ?? process.env.TEST_USER_EMAIL
  if (!email) usage()

  await promoteUser(email)
}

main()
  .catch((error: unknown) => {
    console.error('Role promotion failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
