"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { RefreshCw, AlertTriangle, BarChart3 } from "lucide-react"
import { StatsCards } from "./stats-cards"
import { RevenueChart } from "./revenue-chart"
import { ExpenseChart } from "./expense-chart"
import { SalesDistribution } from "./sales-distribution"
import { MonthlyComparison } from "./monthly-comparison"
import { CollectionBreakdown } from "./collection-breakdown"
import { RecentBills } from "./recent-bills"
import { RecentExpenses } from "./recent-expenses"
import { TopCustomers } from "./top-customers"
import { TopProducts } from "./top-products"
import { UpcomingOrders } from "./upcoming-orders"
import { PendingVendors } from "./pending-vendors"
import { Skeleton } from "@/components/ui/skeleton"

interface DashboardData {
  todayStats: {
    sales: number
    expenses: number
    cash: number
    gpay: number
  }
  monthlyStats: {
    sales: number
    expenses: number
    cashCollections: number
    gpayCollections: number
  }
  revenueTrend: { date: string; revenue: number }[]
  expenseTrend: { date: string; expense: number }[]
  productSales: { name: string; value: number }[]
  monthlyComparison: { label: string; revenue: number; expense: number }[]
  collectionBreakdown: { name: string; value: number; percentage: number }[]
  recentBills: {
    id: string
    billNo: string
    customer: string | null
    total: number
    paymentMode: string
    date: string
    status: string
  }[]
  recentExpenses: {
    id: string
    description: string
    amount: number
    category: string
    date: string
    paymentMode: string
  }[]
  topCustomers: {
    id: string
    name: string
    visitCount: number
    totalSpent: number
  }[]
  topProducts: {
    id: string
    name: string
    category: string
    totalRevenue: number
    quantitySold: number
  }[]
  upcomingOrders: {
    id: string
    orderNo: string
    customer: string
    deliveryDate: string | null
    advance: number
    balance: number
    status: string
  }[]
  pendingVendors: {
    id: string
    name: string
    outstanding: number
  }[]
}

type FetchState = "loading" | "error" | "empty" | "success"

export function DashboardShell() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [state, setState] = useState<FetchState>("loading")
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setState("loading")
    setError(null)
    try {
      const res = await fetch("/api/dashboard")
      if (!res.ok) {
        throw new Error("Failed to fetch dashboard data")
      }
      const json: DashboardData = await res.json()

      const hasData =
        json.todayStats.sales > 0 ||
        json.todayStats.expenses > 0 ||
        json.monthlyStats.sales > 0 ||
        json.recentBills.length > 0 ||
        json.recentExpenses.length > 0 ||
        json.topCustomers.length > 0

      if (!hasData) {
        setState("empty")
      } else {
        setState("success")
      }
      setData(json)
    } catch (err) {
      setState("error")
      setError(err instanceof Error ? err.message : "An error occurred")
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (state === "loading") {
    return <DashboardSkeleton />
  }

  if (state === "error") {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-destructive/20 bg-destructive/5 p-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">Failed to load dashboard</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {error ?? "Something went wrong. Please try again."}
        </p>
        <button
          onClick={fetchData}
          className="mt-4 inline-flex items-center gap-2 rounded-lg border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      </div>
    )
  }

  if (state === "empty") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <BarChart3 className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">No data yet</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Start by creating bills and recording expenses. Your dashboard will
          populate with insights and metrics once you have data.
        </p>
      </motion.div>
    )
  }

  if (!data) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Overview of your business performance
          </p>
        </div>
        <button
          onClick={fetchData}
          className="inline-flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-xs font-medium transition-colors hover:bg-muted"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      <StatsCards
        todaySales={data.todayStats.sales}
        todayExpenses={data.todayStats.expenses}
        cashCollections={data.todayStats.cash}
        gpayCollections={data.todayStats.gpay}
        totalSales={data.monthlyStats.sales}
      />

      <div className="grid gap-6 lg:grid-cols-7">
        <div className="lg:col-span-4">
          <RevenueChart data={data.revenueTrend} />
        </div>
        <div className="lg:col-span-3">
          <ExpenseChart data={data.expenseTrend} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <MonthlyComparison data={data.monthlyComparison} />
        </div>
        <div className="space-y-6 lg:col-span-2">
          <SalesDistribution data={data.productSales} />
          <CollectionBreakdown data={data.collectionBreakdown} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
        <RecentBills bills={data.recentBills} />
        <RecentExpenses expenses={data.recentExpenses} />
        <TopProducts products={data.topProducts} />
        <TopCustomers customers={data.topCustomers} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <UpcomingOrders orders={data.upcomingOrders} />
        <PendingVendors vendors={data.pendingVendors} />
      </div>
    </motion.div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-36" />
          <Skeleton className="mt-1 h-4 w-52" />
        </div>
        <Skeleton className="h-9 w-24 rounded-lg" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border bg-card p-4 ring-1 ring-foreground/10"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            <Skeleton className="mt-3 h-7 w-20" />
            <Skeleton className="mt-1 h-3 w-16" />
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <div className="lg:col-span-4">
          <div className="rounded-xl border bg-card p-5 ring-1 ring-foreground/10">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="mt-4 h-[280px] w-full" />
          </div>
        </div>
        <div className="lg:col-span-3">
          <div className="rounded-xl border bg-card p-5 ring-1 ring-foreground/10">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="mt-4 h-[280px] w-full" />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="rounded-xl border bg-card p-5 ring-1 ring-foreground/10">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="mt-4 h-[260px] w-full" />
          </div>
        </div>
        <div className="space-y-6 lg:col-span-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border bg-card p-5 ring-1 ring-foreground/10"
            >
              <Skeleton className="h-5 w-28" />
              <Skeleton className="mt-4 h-[120px] w-full" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border bg-card p-5 ring-1 ring-foreground/10"
          >
            <Skeleton className="h-5 w-28" />
            <Skeleton className="mt-4 h-[180px] w-full" />
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border bg-card p-5 ring-1 ring-foreground/10"
          >
            <Skeleton className="h-5 w-36" />
            <Skeleton className="mt-4 h-[140px] w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
