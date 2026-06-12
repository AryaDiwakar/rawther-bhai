"use client"

import { useMemo } from "react"
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "#f97316",
  "#8b5cf6",
  "#06b6d4",
  "#84cc16",
  "#ec4899",
  "#14b8a6",
  "#eab308",
]

const CUSTOM_TOOLTIP_STYLE = {
  borderRadius: "8px",
  border: "1px solid var(--border)",
  background: "var(--popover)",
  color: "var(--popover-foreground)",
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
}

interface CategoryData {
  categoryName: string
  total: number
  count: number
}

interface MonthlyData {
  month: string
  total: number
}

interface ExpenseChartsProps {
  categoryWise: CategoryData[]
  monthlyTrend: MonthlyData[]
  loading?: boolean
}

function formatINR(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value)
}

export function ExpenseCategoryChart({ data, loading }: { data: CategoryData[]; loading?: boolean }) {
  const total = useMemo(() => data.reduce((s, d) => s + d.total, 0), [data])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Category Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[280px] w-full rounded-lg" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Category Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
          <div className="h-[280px] w-full shrink-0 lg:w-1/2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="total"
                  nameKey="categoryName"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                >
                  {data.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={CUSTOM_TOOLTIP_STYLE}
                  formatter={(value) => typeof value === "number" ? formatINR(value) : value}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col gap-2 lg:w-1/2">
            {data.map((item, idx) => (
              <div key={item.categoryName} className="flex items-center gap-2 text-sm">
                <span
                  className="size-3 shrink-0 rounded-full"
                  style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                />
                <span className="flex-1 truncate">{item.categoryName}</span>
                <span className="font-medium">{formatINR(item.total)}</span>
                <span className="text-xs text-muted-foreground">
                  ({total > 0 ? ((item.total / total) * 100).toFixed(1) : 0}%)
                </span>
              </div>
            ))}
            {data.length === 0 && (
              <p className="text-sm text-muted-foreground">No data for this period</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function ExpenseTrendChart({ data, loading }: { data: MonthlyData[]; loading?: boolean }) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Monthly Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[280px] w-full rounded-lg" />
        </CardContent>
      </Card>
    )
  }

  const labels: Record<string, string> = {}
  data.forEach((d) => {
    const [y, m] = d.month.split("-")
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    labels[d.month] = `${months[parseInt(m) - 1]} ${y}`
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Trend (Last 6 Months)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="month"
                tickFormatter={(m) => {
                  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
                  const [y, mon] = m.split("-")
                  return `${months[parseInt(mon) - 1]}`
                }}
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={CUSTOM_TOOLTIP_STYLE}
                formatter={(value) => typeof value === "number" ? formatINR(value) : value}
              />
              <Bar dataKey="total" radius={[6, 6, 0, 0]} fill="var(--chart-1)">
                {data.map((_, idx) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} opacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

export function ExpenseCharts({
  categoryWise,
  monthlyTrend,
  loading,
}: ExpenseChartsProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ExpenseCategoryChart data={categoryWise} loading={loading} />
      <ExpenseTrendChart data={monthlyTrend} loading={loading} />
    </div>
  )
}
