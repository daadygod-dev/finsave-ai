import * as Popover from '@radix-ui/react-popover'
import { format, parseISO } from 'date-fns'
import { CalendarDays } from 'lucide-react'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/style.css'

type DatePickerProps = { value: string; onChange: (value: string) => void; label: string }

/** shadcn Calendar + Popover pattern, retaining an ISO-date value for the API. */
export function DatePicker({ value, onChange, label }: DatePickerProps) {
  const selected = value ? parseISO(value) : undefined
  return <Popover.Root><Popover.Trigger asChild><button type="button" aria-label={label} className="inline-flex h-10 min-w-[142px] items-center gap-2 rounded-xl border border-ink/15 bg-white px-3 text-left text-sm font-medium text-ink shadow-[inset_0_1px_1px_rgba(15,18,21,0.02)] outline-none transition-[border-color,box-shadow] duration-200 hover:border-brand/40 focus:ring-2 focus:ring-brand/25"><CalendarDays size={16} className="text-brand" /><span className={value ? '' : 'text-ink/45'}>{selected ? format(selected, 'MMM d, yyyy') : label}</span></button></Popover.Trigger><Popover.Portal><Popover.Content align="start" sideOffset={6} className="z-50 rounded-xl border border-[#d7e6f3] bg-white p-3 shadow-[0_14px_30px_-18px_rgba(15,18,21,0.28)]"><DayPicker mode="single" selected={selected} onSelect={(day) => { if (day) onChange(format(day, 'yyyy-MM-dd')) }} showOutsideDays classNames={{ selected: 'bg-brand text-white rounded-md', day_button: 'h-8 w-8 rounded-md hover:bg-ledger', month_caption: 'font-semibold text-ink', chevron: 'fill-brand' }} /><button type="button" onClick={() => onChange('')} className="mt-2 text-xs font-medium text-brand hover:text-brand-deep">Clear date</button></Popover.Content></Popover.Portal></Popover.Root>
}
