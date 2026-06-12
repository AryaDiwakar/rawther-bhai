"use client"

import { motion } from "framer-motion"
import {
  IndianRupee,
  TrendingUp,
  TrendingDown,
  Wallet,
  Smartphone,
  ShoppingCart,
} from "lucide-react"

interface StatsCardsProps {
  todaySales: number
  todayExpenses: number
  cashCollections: number
  gpayCollections: number
  totalSales: number
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 80, damping: 15 },
  },
}

function formatINR(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value)
}

const cards = [
  {
    key: "todaySales",
    label: "Today's Sales",
    icon: ShoppingCart,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/50",
    trend: null as number | null,
  },
  {
    key: "todayExpenses",
    label: "Today's Expenses",
    icon: Wallet,
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/50",
    trend: null as number | null,
  },
  {
    key: "cashCollections",
    label: "Cash Collections",
    icon: IndianRupee,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/50",
    trend: null as number | null,
  },
  {
    key: "gpayCollections",
    label: "GPay Collections",
    icon: Smartphone,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/50",
    trend: null as number | null,
  },
  {
    key: "totalSales",
    label: "Total Sales (Month)",
    icon: TrendingUp,
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-950/50",
    trend: null as number | null,
  },
]

export function StatsCards({
  todaySales,
  todayExpenses,
  cashCollections,
  gpayCollections,
  totalSales,
}: StatsCardsProps) {
  const values: Record<string, number> = {
    todaySales,
    todayExpenses,
    cashCollections,
    gpayCollections,
    totalSales,
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
    >
      {cards.map((card) => {
        const Icon = card.icon
        const val = values[card.key]
        return (
          <motion.div
            key={card.key}
            variants={item}
            className="group relative overflow-hidden rounded-xl border bg-card p-4 ring-1 ring-foreground/10 transition-all hover:shadow-md hover:ring-foreground/20"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                {card.label}
              </span>
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-lg ${card.bg}`}
              >
                <Icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-2xl font-semibold tracking-tight">
                {formatINR(val)}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-1">
              {card.key === "todaySales" && todaySales > 0 ? (
                <span className="flex items-center gap-0.5 text-xs text-emerald-600 dark:text-emerald-400">
                  <TrendingUp className="h-3 w-3" />
                  Active
                </span>
              ) : card.key === "todayExpenses" && todayExpenses > 0 ? (
                <span className="flex items-center gap-0.5 text-xs text-red-600 dark:text-red-400">
                  <TrendingDown className="h-3 w-3" />
                  Active
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">No data</span>
              )}
            </div>
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-foreground/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          </motion.div>
        )
      })}
    </motion.div>
  )
}
