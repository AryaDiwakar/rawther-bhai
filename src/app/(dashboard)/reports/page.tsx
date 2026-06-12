"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  Calendar,
  IndianRupee,
  TrendingUp,
  TrendingDown,
  PieChart as PieChartIcon,
  Search,
  X,
} from "lucide-react"
import { format, subDays, startOfMonth } from "date-fns"
import { toast } from "sonner"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatCurrency, formatDate } from "@/lib/utils/format"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts"

interface ReportData {
  type: string
  summary: Record<string, number | string>
  bills?: Record<string, unknown>[]
  expenses?: Record<string, unknown>[]
  collections?: Record<string, unknown>[]
  dailyData?: { date: string; revenue: number; expense: number }[]
  dateRange: { from: string; to: string }
}

const CHART_COLORS = ["#059669", "#0284c7", "#d97706", "#dc2626", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"]

const reportTypes = [
  { value: "sales", label: "Sales Report" },
  { value: "expense", label: "Expense Report" },
  { value: "collection", label: "Collection Report" },
  { value: "profit-loss", label: "Profit & Loss" },
]

function ReportsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <Card><CardContent className="p-6"><Skeleton className="h-10 w-full mb-4" />{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-full mb-2" />)}</CardContent></Card>
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
      </div>
      <Skeleton className="h-64" />
    </div>
  )
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(false)
  const [reportType, setReportType] = useState("sales")
  const [dateFrom, setDateFrom] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"))
  const [dateTo, setDateTo] = useState(format(new Date(), "yyyy-MM-dd"))
  const [productId, setProductId] = useState("")
  const [customerId, setCustomerId] = useState("")
  const [vendorId, setVendorId] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [exporting, setExporting] = useState(false)

  const fetchReport = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        type: reportType,
        dateFrom,
        dateTo,
      })
      if (productId) params.set("productId", productId)
      if (customerId) params.set("customerId", customerId)
      if (vendorId) params.set("vendorId", vendorId)
      if (categoryId) params.set("categoryId", categoryId)

      const res = await fetch(`/api/reports?${params}`)
      const data = await res.json()
      if (!data.success) throw new Error(data.message)
      setReportData(data.data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load report")
    } finally {
      setLoading(false)
    }
  }, [reportType, dateFrom, dateTo, productId, customerId, vendorId, categoryId])

  useEffect(() => {
    fetchReport()
  }, [fetchReport])

  const handleExport = async (format: string) => {
    setExporting(true)
    try {
      const params = new URLSearchParams({
        type: reportType,
        dateFrom,
        dateTo,
        format,
      })
      const res = await fetch(`/api/reports/export?${params}`)
      if (!res.ok) throw new Error("Export failed")

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${reportType}-report-${dateFrom}-${dateTo}.${format === "excel" ? "xlsx" : format === "csv" ? "csv" : "html"}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success("Report exported successfully")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed")
    } finally {
      setExporting(false)
    }
  }

  const quickFilters = [
    { label: "Today", days: 0 },
    { label: "This Week", days: 7 },
    { label: "This Month", days: 30 },
    { label: "Last 3 Months", days: 90 },
  ]

  const setQuickDate = (days: number) => {
    setDateTo(format(new Date(), "yyyy-MM-dd"))
    setDateFrom(format(days === 0 ? new Date() : subDays(new Date(), days), "yyyy-MM-dd"))
  }

  if (loading && !reportData) return <ReportsSkeleton />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
          <p className="text-sm text-muted-foreground">Advanced reporting and analytics</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("csv")}
            disabled={exporting || !reportData}
          >
            {exporting ? <Loader2 className="size-4 animate-spin" /> : <FileText className="size-4" />}
            CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("excel")}
            disabled={exporting || !reportData}
          >
            {exporting ? <Loader2 className="size-4 animate-spin" /> : <FileSpreadsheet className="size-4" />}
            Excel
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("pdf")}
            disabled={exporting || !reportData}
          >
            {exporting ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
            PDF
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label className="text-xs">Report Type</Label>
              <Select value={reportType} onValueChange={(v) => v && setReportType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map((rt) => (
                    <SelectItem key={rt.value} value={rt.value}>{rt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Date Range</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="flex-1"
                />
                <span className="text-muted-foreground">-</span>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Quick Filters</Label>
              <div className="flex flex-wrap gap-1">
                {quickFilters.map((qf) => (
                  <Button
                    key={qf.label}
                    variant="outline"
                    size="xs"
                    onClick={() => setQuickDate(qf.days)}
                  >
                    {qf.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex items-end">
              <Button onClick={fetchReport} disabled={loading} className="w-full">
                {loading && <Loader2 className="size-4 animate-spin" />}
                Generate
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {reportData && (
        <div className="space-y-6">
          {reportType === "sales" && reportData.summary && (
            <>
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Revenue</CardTitle></CardHeader>
                  <CardContent><div className="text-2xl font-bold">{formatCurrency(Number(reportData.summary.totalRevenue))}</div></CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Bills</CardTitle></CardHeader>
                  <CardContent><div className="text-2xl font-bold">{reportData.summary.totalBills as number}</div></CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Items Sold</CardTitle></CardHeader>
                  <CardContent><div className="text-2xl font-bold">{reportData.summary.totalItems as number}</div></CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Avg. Bill</CardTitle></CardHeader>
                  <CardContent><div className="text-2xl font-bold">{formatCurrency(Number(reportData.summary.averageBill))}</div></CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <PieChartIcon className="size-4" />
                    Payment Mode Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: "Cash", value: Number(reportData.summary.cashTotal) },
                            { name: "GPay", value: Number(reportData.summary.gpayTotal) },
                            { name: "Card", value: Number(reportData.summary.cardTotal) },
                            { name: "Split", value: Number(reportData.summary.splitTotal) },
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={4}
                          dataKey="value"
                          label
                        >
                          {CHART_COLORS.slice(0, 4).map((_color, i) => (
                            <Cell key={i} fill={CHART_COLORS[i]} />
                          ))}
                        </Pie>
                        <Legend iconType="circle" />
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Sales Details</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Bill No</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.bills?.length ? (
                        reportData.bills.map((bill: Record<string, unknown>) => (
                          <TableRow key={bill.id as string}>
                            <TableCell className="font-mono text-xs">{(bill.billNo) as string}</TableCell>
                            <TableCell>{bill.customerName as string}</TableCell>
                            <TableCell>{bill.items as number}</TableCell>
                            <TableCell className="font-medium">{formatCurrency(Number(bill.total))}</TableCell>
                            <TableCell><Badge variant="secondary" className="text-[10px]">{bill.paymentMode as string}</Badge></TableCell>
                            <TableCell className="text-xs text-muted-foreground">{formatDate(new Date(bill.createdAt as string))}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No sales data</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}

          {reportType === "expense" && reportData.summary && (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Expenses</CardTitle></CardHeader>
                  <CardContent><div className="text-2xl font-bold text-destructive">{formatCurrency(Number(reportData.summary.totalExpenses))}</div></CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Entries</CardTitle></CardHeader>
                  <CardContent><div className="text-2xl font-bold">{reportData.summary.totalCount as number}</div></CardContent>
                </Card>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <PieChartIcon className="size-4" />
                      Category Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={(reportData.summary.categoryBreakdown as unknown as { category: string; total: number }[]) || []}
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            dataKey="total"
                            nameKey="category"
                            label
                          >
                            {(reportData.summary.categoryBreakdown as unknown as { category: string; total: number }[])?.map((_entry: unknown, i: number) => (
                              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Expense Details</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Description</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.expenses?.length ? (
                          reportData.expenses.map((exp: Record<string, unknown>) => (
                            <TableRow key={exp.id as string}>
                              <TableCell className="max-w-[200px] truncate">{exp.description as string}</TableCell>
                              <TableCell><Badge variant="outline" className="text-[10px]">{exp.category as string}</Badge></TableCell>
                              <TableCell className="text-right font-medium text-destructive">{formatCurrency(Number(exp.amount))}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow><TableCell colSpan={3} className="py-8 text-center text-muted-foreground">No expenses</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {reportType === "collection" && reportData.summary && (
            <>
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Cash</CardTitle></CardHeader>
                  <CardContent><div className="text-2xl font-bold">{formatCurrency(Number(reportData.summary.totalCash))}</div></CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total GPay</CardTitle></CardHeader>
                  <CardContent><div className="text-2xl font-bold">{formatCurrency(Number(reportData.summary.totalGpay))}</div></CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Advance</CardTitle></CardHeader>
                  <CardContent><div className="text-2xl font-bold">{formatCurrency(Number(reportData.summary.totalAdvance))}</div></CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Balance</CardTitle></CardHeader>
                  <CardContent><div className="text-2xl font-bold">{formatCurrency(Number(reportData.summary.totalBalance))}</div></CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <BarChart3 className="size-4" />
                    Collection Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { name: "Cash", amount: Number(reportData.summary.totalCash) },
                          { name: "GPay", amount: Number(reportData.summary.totalGpay) },
                          { name: "Advance", amount: Number(reportData.summary.totalAdvance) },
                          { name: "Balance", amount: Number(reportData.summary.totalBalance) },
                        ]}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="name" className="text-xs" />
                        <YAxis className="text-xs" tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                          {CHART_COLORS.slice(0, 4).map((_color, i) => (
                            <Cell key={i} fill={CHART_COLORS[i]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-sm">Collection Details</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Cash</TableHead>
                        <TableHead className="text-right">GPay</TableHead>
                        <TableHead className="text-right">Advance</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.collections?.length ? (
                        reportData.collections.map((col: Record<string, unknown>) => (
                          <TableRow key={col.id as string}>
                            <TableCell className="text-xs text-muted-foreground">{formatDate(new Date(col.date as string))}</TableCell>
                            <TableCell className="text-right">{formatCurrency(Number(col.cashAmount))}</TableCell>
                            <TableCell className="text-right">{formatCurrency(Number(col.gpayAmount))}</TableCell>
                            <TableCell className="text-right">{formatCurrency(Number(col.advanceAmount))}</TableCell>
                            <TableCell className="text-right">{formatCurrency(Number(col.balanceAmount))}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No collections</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}

          {reportType === "profit-loss" && reportData.summary && (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Revenue</CardTitle></CardHeader>
                  <CardContent><div className="text-2xl font-bold text-emerald-600">{formatCurrency(Number(reportData.summary.totalRevenue))}</div></CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Expenses</CardTitle></CardHeader>
                  <CardContent><div className="text-2xl font-bold text-destructive">{formatCurrency(Number(reportData.summary.totalExpenses))}</div></CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Net Profit</CardTitle></CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${Number(reportData.summary.netProfit) >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                      {formatCurrency(Number(reportData.summary.netProfit))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Margin: {Number(reportData.summary.profitMargin).toFixed(1)}%
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <TrendingUp className="size-4" />
                    Revenue vs Expenses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={reportData.dailyData || []}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="date" className="text-xs" tickFormatter={(v) => format(new Date(v), "MMM d")} />
                        <YAxis className="text-xs" tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                        <Tooltip
                          formatter={(value) => formatCurrency(Number(value))}
                          labelFormatter={(label: unknown) => formatDate(new Date(label as string))}
                        />
                        <Bar dataKey="revenue" name="Revenue" fill="#059669" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="expense" name="Expense" fill="#dc2626" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}
    </div>
  )
}
