import { ArrowUpRight, Banknote, Landmark, ShieldCheck, Smartphone } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const spending = [
  { category: 'Stock', amount: 420000 },
  { category: 'Transport', amount: 180000 },
  { category: 'Utilities', amount: 96000 },
  { category: 'Rent', amount: 260000 },
]

const accounts = [
  { name: 'Bank of Kigali', source: 'Plaid sandbox', balance: 'RWF 1,840,000', icon: Landmark },
  { name: 'MTN MoMo', source: 'CSV statement', balance: 'RWF 426,500', icon: Smartphone },
]

const transactions = [
  { merchant: 'Nyabugogo wholesale stock', account: 'Bank of Kigali', amount: '-RWF 240,000' },
  { merchant: 'MTN MoMo merchant payment', account: 'MTN MoMo', amount: '-RWF 32,500' },
  { merchant: 'Client invoice deposit', account: 'Bank of Kigali', amount: '+RWF 680,000' },
]

export function App() {
  return (
    <main className="min-h-screen bg-ledger text-ink">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-ink/10 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium text-palm">FinSave AI</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-normal text-ink">
              MSME money dashboard
            </h1>
          </div>
          <button className="inline-flex w-fit items-center gap-2 rounded-md bg-palm px-4 py-2 text-sm font-semibold text-white outline-none transition hover:bg-palm/90 focus-visible:ring-2 focus-visible:ring-lake focus-visible:ring-offset-2 focus-visible:ring-offset-ledger">
            <ArrowUpRight aria-hidden="true" size={18} />
            Connect account
          </button>
        </header>

        <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-lg border border-ink/10 bg-white p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-ink/60">Credit score</p>
                <p className="mt-2 text-5xl font-semibold">78</p>
              </div>
              <ShieldCheck className="text-palm" aria-hidden="true" size={34} />
            </div>
            <div className="mt-5 h-3 rounded-full bg-ink/10">
              <div className="h-3 w-[78%] rounded-full bg-maize" />
            </div>
            <p className="mt-3 text-sm text-ink/70">
              Computed from bank and MoMo cash flow, repayment history, and savings behavior.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {accounts.map((account) => {
              const Icon = account.icon
              return (
                <article key={account.name} className="rounded-lg border border-ink/10 bg-white p-5">
                  <div className="flex items-center justify-between gap-3">
                    <Icon className="text-lake" aria-hidden="true" size={24} />
                    <span className="rounded-md bg-ink/5 px-2 py-1 text-xs font-medium text-ink/70">
                      {account.source}
                    </span>
                  </div>
                  <h2 className="mt-4 text-base font-semibold">{account.name}</h2>
                  <p className="mt-1 font-mono text-lg">{account.balance}</p>
                </article>
              )
            })}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-lg border border-ink/10 bg-white p-5">
            <div className="mb-4 flex items-center gap-2">
              <Banknote className="text-brick" aria-hidden="true" size={22} />
              <h2 className="text-lg font-semibold">Monthly spending</h2>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={spending}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="category" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} width={72} />
                  <Tooltip formatter={(value) => `RWF ${Number(value).toLocaleString()}`} />
                  <Bar dataKey="amount" fill="#2f6f8f" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-lg border border-ink/10 bg-white p-5">
            <h2 className="text-lg font-semibold">Recent transactions</h2>
            <div className="mt-4 divide-y divide-ink/10">
              {transactions.map((transaction) => (
                <div key={transaction.merchant} className="grid gap-1 py-3 sm:grid-cols-[1fr_auto]">
                  <div>
                    <p className="font-medium">{transaction.merchant}</p>
                    <p className="text-sm text-ink/60">{transaction.account}</p>
                  </div>
                  <p className="font-mono text-sm font-semibold sm:text-right">{transaction.amount}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </section>
    </main>
  )
}
