import { useCallback, useRef, useState, type FormEvent } from 'react'
import { RotateCcw, Umbrella } from 'lucide-react'
import { api } from '../api/endpoints'
import type { InsuranceRecommendation } from '../api/types'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { Field } from '../components/ui/Field'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { PageHeader } from '../components/ui/PageHeader'
import { Spinner } from '../components/ui/Spinner'
import { useAsync } from '../hooks/useAsync'
import { formatRwf } from '../lib/format'

const TYPE_BADGES: Record<string, 'palm' | 'brand' | 'maize' | 'brick' | 'neutral'> = {
  crop: 'palm',
  business: 'brand',
  motorcycle: 'maize',
  health: 'brand',
  life: 'brick',
}

type ProfileForm = {
  sector: string
  occupation: string
  businessType: string
  hasMotorcycle: boolean
  dependents: string
}

const EMPTY_PROFILE: ProfileForm = {
  sector: '',
  occupation: '',
  businessType: '',
  hasMotorcycle: false,
  dependents: '',
}

export function InsurancePage() {
  const [profile, setProfile] = useState<ProfileForm>(EMPTY_PROFILE)
  const [profileOpen, setProfileOpen] = useState(false)
  const [searched, setSearched] = useState(false)

  // Keep the latest profile in a ref so the fetch callback stays stable and
  // the recommendations only load on mount (generic) and on explicit submit.
  const profileRef = useRef(profile)
  profileRef.current = profile

  const fetchRecommendations = useCallback(() => {
    const current = profileRef.current
    return api.insurance.recommendations({
      ...(current.sector.trim() ? { sector: current.sector.trim() } : {}),
      ...(current.occupation.trim() ? { occupation: current.occupation.trim() } : {}),
      ...(current.businessType.trim() ? { business_type: current.businessType.trim() } : {}),
      ...(current.hasMotorcycle ? { has_motorcycle: true } : {}),
      ...(current.dependents.trim() ? { dependents: Number(current.dependents) } : {}),
    })
  }, [])

  const { data, error, loading, reload } = useAsync(fetchRecommendations, [])

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setSearched(true)
    setProfileOpen(false)
    reload()
  }

  const recommendations = data?.recommendations ?? []

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Insurance"
        title="Insurance matches"
        description="Products ranked against your profile, matched by rules, and explained in plain language."
      />

      <section className="card-shell">
        <div className="card-inner flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Umbrella size={18} aria-hidden="true" className="text-palm" />
              <h2 className="text-lg font-semibold text-ink">Insurance profile</h2>
            </div>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink/60">
              Open the matching form in a full-page modal, enter your profile, and return to ranked recommendations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => setProfile(EMPTY_PROFILE)}
            >
              <RotateCcw size={14} aria-hidden="true" />
              Reset profile
            </Button>
            <Button size="md" onClick={() => setProfileOpen(true)}>
              Open matching form
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ProfilePill label="Sector" value={profile.sector || 'Not set'} />
        <ProfilePill label="Occupation" value={profile.occupation || 'Not set'} />
        <ProfilePill label="Business type" value={profile.businessType || 'Not set'} />
        <ProfilePill
          label="Dependents"
          value={profile.dependents || '0'}
          helper={profile.hasMotorcycle ? 'Motorcycle owner/rider' : 'No motorcycle'}
        />
      </section>

      <div className="flex flex-col gap-4">
        {loading ? (
          <div className="flex h-64 items-center justify-center rounded-[1.25rem] border border-ink/10 bg-ink/[0.05]">
            <Spinner size={26} label="Finding matches" className="text-palm" />
          </div>
        ) : error ? (
          <ErrorState
            title="Recommendations unavailable"
            message="The backend could not return recommendations."
            onRetry={() => reload()}
          />
        ) : recommendations.length === 0 ? (
          <div className="card-shell">
            <div className="card-inner p-6">
              <EmptyState
                icon={<Umbrella size={22} strokeWidth={1.75} />}
                title="No recommendations yet"
                body="Fill in your profile and find matches to see ranked insurance products."
              />
            </div>
          </div>
        ) : (
          <>
            <p className="text-xs text-ink/50">
              {searched
                ? `${recommendations.length} products matched your profile`
                : 'General recommendations - refine your profile for a tighter match.'}
            </p>
            <ul className="flex flex-col gap-4">
              {recommendations.map((recommendation, index) => (
                <RecommendationCard key={recommendation.id} recommendation={recommendation} index={index} />
              ))}
            </ul>
          </>
        )}
      </div>

      <Modal open={profileOpen} onClose={() => setProfileOpen(false)} label="Insurance profile matching" fullPage>
        <form onSubmit={submit} className="mx-auto flex w-full max-w-4xl flex-col gap-6">
          <header className="flex items-start justify-between gap-4 border-b border-[#d7e6f3] pb-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Insurance</p>
              <h2 className="mt-1 text-2xl font-semibold text-ink">Match your profile</h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink/60">
                Enter the details that matter for insurance eligibility and pricing. The results update after you submit.
              </p>
            </div>
            <Button variant="secondary" type="button" onClick={() => setProfileOpen(false)}>
              Close
            </Button>
          </header>

          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="card-shell">
              <div className="card-inner flex flex-col gap-4 p-6">
                <h3 className="flex items-center gap-2 text-lg font-semibold">
                  <Umbrella size={20} aria-hidden="true" className="text-palm" />
                  Your profile
                </h3>

                <Field label="Sector" htmlFor="ins-sector" hint="e.g. farming, retail, transport">
                  <Input
                    id="ins-sector"
                    value={profile.sector}
                    onChange={(event) => setProfile((p) => ({ ...p, sector: event.target.value }))}
                    placeholder="farming"
                  />
                </Field>
                <Field label="Occupation" htmlFor="ins-occupation">
                  <Input
                    id="ins-occupation"
                    value={profile.occupation}
                    onChange={(event) => setProfile((p) => ({ ...p, occupation: event.target.value }))}
                    placeholder="e.g. moto rider"
                  />
                </Field>
                <Field label="Business type" htmlFor="ins-business-type">
                  <Input
                    id="ins-business-type"
                    value={profile.businessType}
                    onChange={(event) => setProfile((p) => ({ ...p, businessType: event.target.value }))}
                    placeholder="e.g. shop, boutique"
                  />
                </Field>
                <Field label="Dependents" htmlFor="ins-dependents">
                  <Input
                    id="ins-dependents"
                    inputMode="numeric"
                    value={profile.dependents}
                    onChange={(event) =>
                      setProfile((p) => ({ ...p, dependents: event.target.value.replace(/[^\d]/g, '') }))
                    }
                    placeholder="0"
                  />
                </Field>

                <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-ink/10 bg-ledger px-3.5 py-2.5">
                  <input
                    type="checkbox"
                    checked={profile.hasMotorcycle}
                    onChange={(event) => setProfile((p) => ({ ...p, hasMotorcycle: event.target.checked }))}
                    className="h-4 w-4 rounded border-ink/30 accent-[#1f6f4a]"
                  />
                  <span className="text-sm font-medium text-ink/70">I own / ride a motorcycle</span>
                </label>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <Button variant="ghost" size="sm" type="button" onClick={() => setProfile(EMPTY_PROFILE)}>
                    <RotateCcw size={14} aria-hidden="true" />
                    Reset
                  </Button>
                  <Button type="submit" size="md" loading={loading}>
                    Find matches
                  </Button>
                </div>
              </div>
            </div>

            <div className="card-shell">
              <div className="card-inner flex h-full flex-col gap-4 p-6">
                <h3 className="text-lg font-semibold text-ink">What we use</h3>
                <ul className="space-y-3 text-sm leading-relaxed text-ink/60">
                  <li>Sector and occupation to narrow the product set.</li>
                  <li>Business type to bias toward the right coverage class.</li>
                  <li>Dependents and motorcycle use to influence suitability.</li>
                </ul>
                <div className="rounded-2xl border border-ink/10 bg-ledger p-4 text-sm text-ink/60">
                  The modal keeps the form focused while the results page stays available behind it.
                </div>
              </div>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  )
}

function ProfilePill(props: { label: string; value: string; helper?: string }) {
  return (
    <div className="card-shell">
      <div className="card-inner flex h-full flex-col gap-1.5 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/45">{props.label}</p>
        <p className="text-sm font-semibold text-ink">{props.value}</p>
        {props.helper ? <p className="text-xs text-ink/50">{props.helper}</p> : null}
      </div>
    </div>
  )
}

function RecommendationCard(props: { recommendation: InsuranceRecommendation; index: number }) {
  const { recommendation, index } = props
  const badge = TYPE_BADGES[recommendation.type] ?? 'neutral'

  return (
    <li className="card-shell animate-fade-up" style={{ animationDelay: `${Math.min(index, 4) * 60}ms` }}>
      <div className="card-inner flex flex-col gap-4 p-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-palm/10 text-sm font-semibold text-palm tabular">
              {recommendation.rank}
            </span>
            <h3 className="truncate text-lg font-semibold tracking-tight text-ink">{recommendation.name}</h3>
            <Badge tone={badge}>{recommendation.type}</Badge>
          </div>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink/60">{recommendation.description}</p>
          <p className="mt-2 text-xs font-medium text-ink/45">
            Why: <span className="text-ink/60">{recommendation.reason}</span>
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-4">
          <div className="flex flex-col items-center gap-1" title={`${recommendation.matchScore}% profile match`}>
            <MatchRing score={recommendation.matchScore} />
            <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-ink/45">Match</p>
          </div>

          <div className="rounded-xl border border-ink/10 bg-ledger px-4 py-3 text-right">
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink/45">Est. premium</p>
            <p className="mt-1 font-mono text-sm font-semibold tabular text-ink">
              {formatRwf(recommendation.premiumRangeMinor[0])} - {formatRwf(recommendation.premiumRangeMinor[1])}
            </p>
            <p className="text-[11px] text-ink/40">per month</p>
          </div>
        </div>
      </div>
    </li>
  )
}

function MatchRing({ score }: { score: number }) {
  const radius = 22
  const circumference = 2 * Math.PI * radius
  const clamped = Math.max(0, Math.min(100, score))
  const offset = circumference * (1 - clamped / 100)

  return (
    <div className="relative h-14 w-14" role="img" aria-label={`${clamped}% profile match`}>
      <svg width="56" height="56" viewBox="0 0 56 56" className="h-full w-full -rotate-90">
        <circle cx="28" cy="28" r={radius} fill="none" stroke="rgba(23,33,27,0.08)" strokeWidth="5" />
        <circle
          cx="28"
          cy="28"
          r={radius}
          fill="none"
          stroke="#1f6f4a"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-ink tabular">
        {clamped}%
      </span>
    </div>
  )
}
