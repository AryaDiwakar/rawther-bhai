"use client"

import { useState, useEffect, useCallback } from "react"
import { format, parseISO } from "date-fns"
import {
  ClipboardCheck,
  Save,
  Calendar,
  Package,
  ShoppingCart,
  Wallet,
  TrendingDown,
  AlertTriangle,
  Plus,
  Minus,
  IndianRupee,
  FileText,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatCurrency, formatDate } from "@/lib/utils/format"

interface ProductSummaryItem {
  productName: string
  quantity: number
  total: number
}

interface OrderSummaryItem {
  id: string
  orderNo: string
  status: string
  totalAmount: number
}

interface ClosingData {
  id: string
  date: string
  totalSales: number
  totalExpenses: number
  cashCollection: number
  gpayCollection: number
  productSummary: unknown
  orderSummary: unknown
  collectionSummary: unknown
  expenseSummary: unknown
  excess: number
  shortage: number
  remarks: string | null
  closedBy: string
  createdAt: string
}

interface ClosingSummary {
  totalSales: number
  totalExpenses: number
  cashCollection: number
  gpayCollection: number
  collectionCash: number
  collectionGpay: number
  collectionAdvance: number
  collectionBalance: number
  productSummary: ProductSummaryItem[]
  orderSummary: {
    total: number
    totalValue: number
    orders: OrderSummaryItem[]
  }
  collectionSummary: {
    cash: number
    gpay: number
    advance: number
    balance: number
  }
  expenseSummary: {
    total: number
    categories: { category: string; total: number; count: number }[]
  }
}

function ClosingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}><CardContent className="p-6"><Skeleton className="h-4 w-24 mb-2" /><Skeleton className="h-8 w-32" /></CardContent></Card>
        ))}
      </div>
      <Card><CardContent className="p-6"><Skeleton className="h-6 w-40 mb-4" />{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full mb-2" />)}</CardContent></Card>
    </div>
  )
}

export default function DailyClosingPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasClosing, setHasClosing] = useState(false)
  const [closingData, setClosingData] = useState<ClosingData | null>(null)
  const [summary, setSummary] = useState<ClosingSummary | null>(null)
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [excess, setExcess] = useState(0)
  const [shortage, setShortage] = useState(0)
  const [remarks, setRemarks] = useState("")

  const fetchClosing = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/closing?date=${selectedDate}`)
      const data = await res.json()
      if (!data.success) throw new Error(data.message)

      if (data.data.hasClosing) {
        setHasClosing(true)
        setClosingData(data.data.closing as ClosingData)
        setExcess(Number(data.data.closing.excess || 0))
        setShortage(Number(data.data.closing.shortage || 0))
        setRemarks((data.data.closing.remarks as string) || "")
      } else {
        setHasClosing(false)
        setClosingData(null)
        setSummary(data.data.summary)
        setExcess(0)
        setShortage(0)
        setRemarks("")
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load closing data")
    } finally {
      setLoading(false)
    }
  }, [selectedDate])

  useEffect(() => {
    fetchClosing()
  }, [fetchClosing])

  const handleSave = async () => {
    if (!summary) return
    setSaving(true)
    try {
      const body = {
        date: selectedDate,
        totalSales: summary.totalSales,
        totalExpenses: summary.totalExpenses,
        cashCollection: summary.cashCollection,
        gpayCollection: summary.gpayCollection,
        productSummary: summary.productSummary,
        orderSummary: summary.orderSummary,
        collectionSummary: summary.collectionSummary,
        expenseSummary: summary.expenseSummary,
        excess,
        shortage,
        remarks,
      }

      const res = await fetch("/api/closing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!data.success) {
        toast.error(data.message)
        return
      }
      toast.success("Daily closing saved successfully")
      fetchClosing()
    } catch {
      toast.error("Failed to save closing")
    } finally {
      setSaving(false)
    }
  }

  const today = format(new Date(), "yyyy-MM-dd")
  const isToday = selectedDate === today

  if (loading) return <ClosingSkeleton />

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Daily Closing</h1>
          <p className="text-sm text-muted-foreground">
            {isToday ? "Today's" : "Viewing"} closing for <strong>{format(parseISO(selectedDate), "MMMM d, yyyy")}</strong>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const d = new Date(selectedDate)
              d.setDate(d.getDate() - 1)
              setSelectedDate(format(d, "yyyy-MM-dd"))
            }}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-40"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const d = new Date(selectedDate)
              d.setDate(d.getDate() + 1)
              setSelectedDate(format(d, "yyyy-MM-dd"))
            }}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {hasClosing && closingData ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                <IndianRupee className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(Number(closingData.totalSales))}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                <TrendingDown className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(Number(closingData.totalExpenses))}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Cash Collection</CardTitle>
                <Wallet className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(Number(closingData.cashCollection))}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">GPay Collection</CardTitle>
                <Wallet className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(Number(closingData.gpayCollection))}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Excess</CardTitle>
                <Plus className="size-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-500">{formatCurrency(Number(closingData.excess))}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Shortage</CardTitle>
                <Minus className="size-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{formatCurrency(Number(closingData.shortage))}</div>
              </CardContent>
            </Card>
          </div>

          {closingData.remarks && (
            <Card>
              <CardHeader><CardTitle className="text-sm font-medium">Remarks</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-muted-foreground">{closingData.remarks}</p></CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ClipboardCheck className="size-4" />
                Closing Saved
              </CardTitle>
              <CardDescription>
                This day has been closed. Use the date picker to view or edit previous closings.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="size-4 text-amber-500" />
                Closing Required
              </CardTitle>
              <CardDescription>
                Today's closing has not been done yet. Review the summary below and save.
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                <IndianRupee className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(summary?.totalSales || 0)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                <TrendingDown className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(summary?.totalExpenses || 0)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Cash Sales</CardTitle>
                <Wallet className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(summary?.cashCollection || 0)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">GPay Sales</CardTitle>
                <Wallet className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(summary?.gpayCollection || 0)}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Package className="size-4" />
                  Product Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {summary?.productSummary && summary.productSummary.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {summary.productSummary.map((item) => (
                        <TableRow key={item.productName}>
                          <TableCell>{item.productName}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(item.total)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex flex-col items-center py-8 text-center">
                    <Package className="mb-2 size-8 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">No products sold today</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <ShoppingCart className="size-4" />
                  Orders Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {summary?.orderSummary && summary.orderSummary.total > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order No</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {summary.orderSummary.orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-mono text-xs">{order.orderNo}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px]">
                              {order.status.replace(/_/g, " ")}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(Number(order.totalAmount))}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex flex-col items-center py-8 text-center">
                    <ShoppingCart className="mb-2 size-8 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">No orders today</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Wallet className="size-4" />
                  Collection Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                {summary?.collectionSummary ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                      <span className="text-sm">Cash</span>
                      <span className="font-medium">{formatCurrency(summary.collectionSummary.cash)}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                      <span className="text-sm">GPay</span>
                      <span className="font-medium">{formatCurrency(summary.collectionSummary.gpay)}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                      <span className="text-sm">Advance</span>
                      <span className="font-medium">{formatCurrency(summary.collectionSummary.advance)}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                      <span className="text-sm">Balance</span>
                      <span className="font-medium">{formatCurrency(summary.collectionSummary.balance)}</span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between px-3 py-1">
                      <span className="text-sm font-medium">Total</span>
                      <span className="font-bold">
                        {formatCurrency(
                          summary.collectionSummary.cash +
                            summary.collectionSummary.gpay +
                            summary.collectionSummary.advance +
                            summary.collectionSummary.balance
                        )}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No collections today</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <TrendingDown className="size-4" />
                  Expense Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                {summary?.expenseSummary && summary.expenseSummary.categories.length > 0 ? (
                  <div className="space-y-3">
                    {summary.expenseSummary.categories.map((cat) => (
                      <div
                        key={cat.category}
                        className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2"
                      >
                        <span className="text-sm">{cat.category}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">({cat.count}x)</span>
                          <span className="font-medium">{formatCurrency(cat.total)}</span>
                        </div>
                      </div>
                    ))}
                    <Separator />
                    <div className="flex items-center justify-between px-3 py-1">
                      <span className="text-sm font-medium">Total</span>
                      <span className="font-bold">
                        {formatCurrency(summary.expenseSummary.total)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No expenses today</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <AlertTriangle className="size-4" />
                Difference Entry
              </CardTitle>
              <CardDescription>
                Record any excess or shortage for the day
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="excess">Excess (Positive Difference)</Label>
                  <div className="relative">
                    <IndianRupee className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="excess"
                      type="number"
                      step="0.01"
                      min="0"
                      value={excess}
                      onChange={(e) => setExcess(Number(e.target.value))}
                      className="pl-8"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shortage">Shortage (Negative Difference)</Label>
                  <div className="relative">
                    <IndianRupee className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="shortage"
                      type="number"
                      step="0.01"
                      min="0"
                      value={shortage}
                      onChange={(e) => setShortage(Number(e.target.value))}
                      className="pl-8"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <Label htmlFor="remarks">Remarks</Label>
                <Textarea
                  id="remarks"
                  placeholder="Any notes about today's closing..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={3}
                />
              </div>
              <Button className="mt-4" onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="size-4 animate-spin" />}
                <Save className="size-4" />
                {saving ? "Saving..." : "Save Closing"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
