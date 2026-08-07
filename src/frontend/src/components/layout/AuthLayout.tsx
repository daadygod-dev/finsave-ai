import type { ReactNode } from 'react'
import Image from '../../../public/finsave-shield.png'

/** Shared two-column authentication frame for all public account flows. */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-ledger px-4 py-6 text-ink sm:px-6 lg:px-8 lg:py-10">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-3xl bg-white shadow-[0_24px_72px_rgba(15,17,26,0.12)] lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)]">
        <aside className="relative hidden min-h-[40rem] flex-col bg-[#0F111A] p-10 lg:flex">
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-brand/45 bg-brand/10 shadow-[0_18px_40px_rgba(112,201,94,0.18)]">
              
              <img src={Image} alt="FinSave AI Shield" />
            </div>
            <h1 className="mt-5 text-xl font-medium tracking-wide text-white">FinSave AI</h1>
          </div>

          <div className="rounded-2xl border border-white/15 px-5 py-4">
            <p className="text-sm leading-6 text-brand-bright">
              Automated cash flow metrics and credit scoring built directly for African enterprises.
            </p>
          </div>
        </aside>

        <section className="flex min-w-0 items-center justify-center px-5 py-10 sm:px-10 lg:px-14 lg:py-12">
          <div className="w-full max-w-md animate-fade-up">{children}</div>
        </section>
      </div>
    </main>
  )
}
