import { Bell, BrainCircuit, CircleDollarSign, CircleHelp, FileBarChart2, LineChart, PiggyBank } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { PagePlaceholder } from '../components/ui/PagePlaceholder'

function FeaturePage({ title, description, milestone, icon: Icon }: { title: string; description: string; milestone: string; icon: LucideIcon }) {
  return <div className="flex flex-col gap-6"><PageHeader title={title} description={description} /><PagePlaceholder title={title} description={description} milestone={milestone} icon={Icon} /></div>
}

export const SpendingPage = () => <FeaturePage title="Spending" description="Review cash outflow patterns across all linked accounts." milestone="the spending workspace" icon={CircleDollarSign} />
export const SavingsPage = () => <FeaturePage title="Savings" description="See savings behavior and the surplus available for your next goal." milestone="the savings workspace" icon={PiggyBank} />
export const BudgetsPage = () => <FeaturePage title="Budgets" description="Set practical spending limits against your real transaction activity." milestone="the budgets workspace" icon={PiggyBank} />
export const AiInsightsPage = () => <FeaturePage title="AI Insights" description="Turn transaction patterns into clear, actionable financial guidance." milestone="AI coaching" icon={BrainCircuit} />
export const ReportsPage = () => <FeaturePage title="Reports" description="Prepare concise account and cash-flow reporting for your business." milestone="reporting" icon={FileBarChart2} />
export const AlertsPage = () => <FeaturePage title="Alerts" description="Keep an eye on meaningful changes in your financial activity." milestone="alerts" icon={Bell} />
export const LoanPoolPage = () => <FeaturePage title="Loan Pool" description="Explore lending readiness through your consented business score." milestone="the lender connection flow" icon={LineChart} />
export const HelpSupportPage = () => <FeaturePage title="Help & Support" description="Find guidance for account connections, statements, and FinSave features." milestone="the support center" icon={CircleHelp} />
