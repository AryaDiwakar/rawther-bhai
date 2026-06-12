"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { signOut } from "next-auth/react"
import Image from "next/image"
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
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
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

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()

  return (
    <TooltipProvider delay={0}>
      <motion.aside
        layout
        className={cn(
          "relative flex flex-col border-r bg-sidebar text-sidebar-foreground",
          "h-screen shrink-0"
        )}
        animate={{ width: collapsed ? 64 : 240 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
      >
        <div className="flex h-14 items-center gap-3 px-3">
          <div className="flex size-8 shrink-0 items-center justify-center">
            <Image src="/logo.jpg" alt="Logo" width={32} height={32} className="rounded-lg object-cover" />
          </div>
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
                className="truncate text-sm font-semibold"
              >
                Rawther Biryani
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <Separator />

        <ScrollArea className="flex-1 px-2 py-3">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href))
              const Icon = item.icon

              const link = (
                <Link
                  href={item.href}
                  className={cn(
                    "flex h-9 items-center gap-3 rounded-lg px-2 text-sm font-medium transition-colors",
                    "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70"
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <AnimatePresence mode="wait">
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.15 }}
                        className="overflow-hidden whitespace-nowrap"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              )

              if (collapsed) {
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger className="w-full">{link}</TooltipTrigger>
                    <TooltipContent side="right" sideOffset={8} className="z-50">
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                )
              }

              return <div key={item.href}>{link}</div>
            })}
          </nav>
        </ScrollArea>

        <Separator />

        <div className="p-3">
          {collapsed ? (
            <div className="flex flex-col items-center gap-2">
              <Avatar size="sm">
                <AvatarFallback>RB</AvatarFallback>
              </Avatar>
              <Tooltip>
                <TooltipTrigger className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors" onClick={() => signOut({ callbackUrl: "/login" })}>
                  <LogOut className="size-4" />
                </TooltipTrigger>
                <TooltipContent side="right">Sign Out</TooltipContent>
              </Tooltip>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Avatar size="sm">
                <AvatarFallback>RB</AvatarFallback>
              </Avatar>
              <div className="flex flex-1 flex-col overflow-hidden">
                <span className="truncate text-sm font-medium">Admin</span>
                <span className="truncate text-xs text-muted-foreground">
                  admin@rawther.com
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                <LogOut className="size-4" />
              </Button>
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon-sm"
          className="absolute -right-3 top-20 z-10 size-6 rounded-full border bg-background shadow-sm"
          onClick={onToggle}
        >
          {collapsed ? (
            <ChevronRight className="size-3" />
          ) : (
            <ChevronLeft className="size-3" />
          )}
        </Button>
      </motion.aside>
    </TooltipProvider>
  )
}
