import * as Select from '@radix-ui/react-select'
import { Check, ChevronDown } from 'lucide-react'

type Option = { value: string; label: string }
type FilterSelectProps = { value: string; onValueChange: (value: string) => void; options: Option[]; label: string }

/** shadcn/Radix select composition for compact data filters. */
export function FilterSelect({ value, onValueChange, options, label }: FilterSelectProps) {
  return (
    <Select.Root value={value} onValueChange={onValueChange}>
      <Select.Trigger aria-label={label} className="inline-flex h-10 min-w-[150px] items-center justify-between gap-2 rounded-xl border border-ink/15 bg-white px-3 text-sm font-medium text-ink shadow-[inset_0_1px_1px_rgba(15,18,21,0.02)] outline-none transition-[border-color,box-shadow] duration-200 focus:ring-2 focus:ring-brand/25 data-[state=open]:border-brand/50">
        <Select.Value /> <Select.Icon><ChevronDown size={15} className="text-ink/45" /></Select.Icon>
      </Select.Trigger>
      <Select.Portal><Select.Content position="popper" sideOffset={6} className="z-50 max-h-64 min-w-[var(--radix-select-trigger-width)] overflow-auto rounded-xl border border-[#d7e6f3] bg-white p-1 shadow-[0_14px_30px_-18px_rgba(15,18,21,0.28)]"><Select.Viewport>{options.map((option) => <Select.Item key={option.value} value={option.value} className="relative flex cursor-pointer select-none items-center rounded-lg py-2 pl-8 pr-3 text-sm text-ink outline-none data-[highlighted]:bg-ledger data-[state=checked]:font-semibold"><Select.ItemIndicator className="absolute left-2.5 text-brand"><Check size={14} /></Select.ItemIndicator><Select.ItemText>{option.label}</Select.ItemText></Select.Item>)}</Select.Viewport></Select.Content></Select.Portal>
    </Select.Root>
  )
}
