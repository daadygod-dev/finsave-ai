import type { ReactNode } from 'react'
import Image from '../../../public/finsave-shield.png'
import { Link } from "react-router-dom"

/** Shared two-column authentication frame for all public account flows. */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-ledger px-4 py-6 text-ink sm:px-6 lg:px-8 lg:py-10">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-3xl bg-white shadow-sm lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)]">
        <aside className="relative hidden min-h-[40rem] flex-col bg-[#ffffff] p-10 lg:flex">
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-brand/45 bg-brand/10 ">
              
              <img src={Image} alt="FinSave AI Shield"  className='rounded-2xl'/>
            </div>
            <h1 className="mt-5 text-xl font-medium tracking-wide text-white">FinSave AI</h1>
          </div>

          <div className=" px-5 py-4 flex gap-5 ">
            <p className="text-sm leading-6t">
              <Link to="/privacy" className="text-neutral-500 underline">

              Privacy policy
              </Link>
            </p>
            <p className="text-sm leading-6t">
              <Link to="/privacy" className="text-neutral-500 underline">

              Terms of service
              </Link>
            </p>
            <p className="text-sm leading-6t">
              <Link to="/privacy" className="text-neutral-500 underline">

              Contact us
              </Link>
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
