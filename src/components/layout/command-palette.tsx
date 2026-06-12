"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import {
  LayoutDashboard,
  Package,
  Receipt,
  Users,
  CalendarClock,
  Wallet,
  ArrowUpDown,
  Truck,
  ClipboardCheck,
  BarChart3,
  Mail,
  Plus,
  FileText,
  DollarSign,
  type LucideIcon,
} from "lucide-react"

interface QuickAction {
  label: string
  icon: LucideIcon
  shortcut?: string
  action: () => void
}

interface NavItem {
  label: string
  href: string
  icon: LucideIcon
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Products", href: "/dashboard/products", icon: Package },
  { label: "Billing POS", href: "/dashboard/billing", icon: Receipt },
  { label: "Customers", href: "/dashboard/customers", icon: Users },
  { label: "Orders", href: "/dashboard/orders", icon: CalendarClock },
  { label: "Collections", href: "/dashboard/collections", icon: Wallet },
  { label: "Expenses", href: "/dashboard/expenses", icon: ArrowUpDown },
  { label: "Vendors", href: "/dashboard/vendors", icon: Truck },
  { label: "Daily Closing", href: "/dashboard/daily-closing", icon: ClipboardCheck },
  { label: "Reports", href: "/dashboard/reports", icon: BarChart3 },
  { label: "Email Reports", href: "/dashboard/email-reports", icon: Mail },
]

export function CommandPalette() {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const runAction = useCallback(
    (action: () => void) => {
      setOpen(false)
      action()
    },
    []
  )

  const quickActions: QuickAction[] = [
    {
      label: "New Bill",
      icon: Plus,
      action: () => router.push("/dashboard/billing"),
    },
    {
      label: "New Product",
      icon: Package,
      action: () => router.push("/dashboard/products"),
    },
    {
      label: "New Expense",
      icon: DollarSign,
      action: () => router.push("/dashboard/expenses"),
    },
    {
      label: "New Order",
      icon: CalendarClock,
      action: () => router.push("/dashboard/orders"),
    },
    {
      label: "New Customer",
      icon: Users,
      action: () => router.push("/dashboard/customers"),
    },
    {
      label: "Generate Report",
      icon: BarChart3,
      action: () => router.push("/dashboard/reports"),
    },
    {
      label: "Daily Closing",
      icon: ClipboardCheck,
      action: () => router.push("/dashboard/daily-closing"),
    },
  ]

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search pages, actions..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Quick Actions">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <CommandItem
                key={action.label}
                onSelect={() => runAction(action.action)}
              >
                <Icon />
                <span>{action.label}</span>
                {action.shortcut && (
                  <CommandShortcut>{action.shortcut}</CommandShortcut>
                )}
              </CommandItem>
            )
          })}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Navigation">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <CommandItem
                key={item.href}
                onSelect={() => runAction(() => router.push(item.href))}
              >
                <Icon />
                <span>{item.label}</span>
              </CommandItem>
            )
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
