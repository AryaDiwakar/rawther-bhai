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
  MessageSquare,
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
  { label: "Products", href: "/products", icon: Package },
  { label: "Billing POS", href: "/billing", icon: Receipt },
  { label: "Customers", href: "/customers", icon: Users },
  { label: "Orders", href: "/orders", icon: CalendarClock },
  { label: "Collections", href: "/collections", icon: Wallet },
  { label: "Expenses", href: "/expenses", icon: ArrowUpDown },
  { label: "Vendors", href: "/vendors", icon: Truck },
  { label: "Daily Closing", href: "/closing", icon: ClipboardCheck },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  { label: "Email Reports", href: "/email-reports", icon: Mail },
  { label: "WhatsApp", href: "/whatsapp", icon: MessageSquare },
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
      action: () => router.push("/billing"),
    },
    {
      label: "New Product",
      icon: Package,
      action: () => router.push("/products/new"),
    },
    {
      label: "New Expense",
      icon: DollarSign,
      action: () => router.push("/expenses/new"),
    },
    {
      label: "New Order",
      icon: CalendarClock,
      action: () => router.push("/orders/new"),
    },
    {
      label: "New Customer",
      icon: Users,
      action: () => router.push("/customers/new"),
    },
    {
      label: "Generate Report",
      icon: BarChart3,
      action: () => router.push("/reports"),
    },
    {
      label: "Daily Closing",
      icon: ClipboardCheck,
      action: () => router.push("/closing"),
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
