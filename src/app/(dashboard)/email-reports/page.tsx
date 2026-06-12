"use client"

import { useState, useEffect, useCallback } from "react"
import { format, startOfMonth, endOfMonth } from "date-fns"
import {
  Mail,
  Send,
  Loader2,
  Eye,
  FileText,
  IndianRupee,
  TrendingUp,
  TrendingDown,
  Calendar,
  Copy,
  Check,
  History,
  Clock,
  ChevronRight,
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
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatCurrency, formatDate } from "@/lib/utils/format"

interface MonthStats {
  totalRevenue: number
  totalExpenses: number
  netIncome: number
  totalBills: number
  totalOrders: number
  cashTotal: number
  gpayTotal: number
}

const reportTypes = [
  { value: "month-end", label: "Month End Summary", description: "Complete monthly overview with revenue, expenses, top products" },
  { value: "revenue", label: "Revenue Summary", description: "Revenue breakdown by payment mode" },
  { value: "expense", label: "Expense Summary", description: "Expense breakdown by category" },
]

function EmailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
      </div>
      <Card><CardContent className="p-6"><Skeleton className="h-6 w-40 mb-4" />{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full mb-2" />)}</CardContent></Card>
    </div>
  )
}

export default function EmailReportsPage() {
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [monthStats, setMonthStats] = useState<MonthStats | null>(null)
  const [reportType, setReportType] = useState("month-end")
  const [recipient, setRecipient] = useState("")
  const [subject, setSubject] = useState("")
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewHtml, setPreviewHtml] = useState("")
  const [sentHistory, setSentHistory] = useState<{ type: string; recipient: string; date: Date }[]>([])

  const fetchMonthStats = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        type: "profit-loss",
        dateFrom: format(startOfMonth(new Date()), "yyyy-MM-dd"),
        dateTo: format(endOfMonth(new Date()), "yyyy-MM-dd"),
      })
      const res = await fetch(`/api/reports?${params}`)
      const data = await res.json()
      if (data.success) {
        setMonthStats({
          totalRevenue: Number(data.data.summary.totalRevenue),
          totalExpenses: Number(data.data.summary.totalExpenses),
          netIncome: Number(data.data.summary.netProfit),
          totalBills: 0,
          totalOrders: 0,
          cashTotal: 0,
          gpayTotal: 0,
        })
      }

      const salesRes = await fetch(`/api/reports?type=sales&dateFrom=${format(startOfMonth(new Date()), "yyyy-MM-dd")}&dateTo=${format(endOfMonth(new Date()), "yyyy-MM-dd")}`)
      const salesData = await salesRes.json()
      if (salesData.success) {
        setMonthStats((prev) => prev ? {
          ...prev,
          totalBills: Number(salesData.data.summary.totalBills),
          cashTotal: Number(salesData.data.summary.cashTotal),
          gpayTotal: Number(salesData.data.summary.gpayTotal),
        } : prev)
      }
    } catch {
      // Non-critical
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMonthStats()
  }, [fetchMonthStats])

  const handleSend = async () => {
    if (!recipient) {
      toast.error("Please enter a recipient email")
      return
    }

    setSending(true)
    try {
      const res = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: reportType,
          recipient,
          subject: subject || undefined,
        }),
      })
      const data = await res.json()
      if (!data.success) {
        toast.error(data.message)
        return
      }

      if (data.data.sent) {
        toast.success("Email report sent successfully")
        setSentHistory((prev) => [
          { type: reportType, recipient, date: new Date() },
          ...prev,
        ])
      } else if (data.data.preview) {
        setPreviewHtml(data.data.preview)
        toast.info("Report generated. Preview available.")
      }
    } catch {
      toast.error("Failed to send email report")
    } finally {
      setSending(false)
    }
  }

  const handlePreview = async () => {
    try {
      const res = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: reportType,
          recipient: recipient || "preview@example.com",
          subject: subject || undefined,
        }),
      })
      const data = await res.json()
      if (data.data?.preview) {
        setPreviewHtml(data.data.preview)
        setPreviewOpen(true)
      } else {
        toast.error("No preview available")
      }
    } catch {
      toast.error("Failed to generate preview")
    }
  }

  if (loading) return <EmailSkeleton />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Email Reports</h1>
          <p className="text-sm text-muted-foreground">
            Generate and send email reports for {format(new Date(), "MMMM yyyy")}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <IndianRupee className="size-4 text-emerald-500" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{formatCurrency(monthStats?.totalRevenue || 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <TrendingDown className="size-4 text-destructive" />
              Total Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{formatCurrency(monthStats?.totalExpenses || 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <TrendingUp className="size-4" />
              Net Income
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-xl font-bold ${(monthStats?.netIncome || 0) >= 0 ? "text-emerald-500" : "text-destructive"}`}>
              {formatCurrency(monthStats?.netIncome || 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <FileText className="size-4" />
              Total Bills
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{monthStats?.totalBills || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Mail className="size-4" />
                Send Report
              </CardTitle>
              <CardDescription>
                Choose a report type and enter recipient details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Report Type</Label>
                <div className="grid gap-3 sm:grid-cols-3">
                  {reportTypes.map((rt) => (
                    <button
                      key={rt.value}
                      onClick={() => setReportType(rt.value)}
                      className={`rounded-lg border p-3 text-left transition-colors hover:bg-muted/50 ${
                        reportType === rt.value ? "border-primary bg-primary/5 ring-1 ring-primary" : ""
                      }`}
                    >
                      <p className="text-sm font-medium">{rt.label}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{rt.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="recipient">Recipient Email</Label>
                <Input
                  id="recipient"
                  type="email"
                  placeholder="manager@rawtherbiryani.com"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject (optional)</Label>
                <Input
                  id="subject"
                  placeholder={`${reportTypes.find((rt) => rt.value === reportType)?.label || "Report"} - ${format(new Date(), "MMMM yyyy")}`}
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button onClick={handleSend} disabled={sending}>
                  {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                  {sending ? "Sending..." : "Send Report"}
                </Button>
                <Button variant="outline" onClick={handlePreview}>
                  <Eye className="size-4" />
                  Preview
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <History className="size-4" />
                Sent History
              </CardTitle>
              <CardDescription>Recently sent reports</CardDescription>
            </CardHeader>
            <CardContent>
              {sentHistory.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <Clock className="mb-2 size-8 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">No reports sent yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sentHistory.slice(0, 10).map((entry, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg border p-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {reportTypes.find((rt) => rt.value === entry.type)?.label || entry.type}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">{entry.recipient}</p>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatDate(entry.date)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
            <DialogDescription>
              Preview of the {reportTypes.find((rt) => rt.value === reportType)?.label} email
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto rounded-lg border">
            {previewHtml ? (
              <iframe
                srcDoc={previewHtml}
                className="h-[500px] w-full"
                title="Email Preview"
              />
            ) : (
              <div className="flex items-center justify-center p-12">
                <p className="text-sm text-muted-foreground">No preview available</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
