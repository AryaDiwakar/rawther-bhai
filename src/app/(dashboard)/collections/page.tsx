"use client"

import { useState, useEffect, useCallback } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns"
import {
  IndianRupee,
  Wallet,
  Banknote,
  TrendingUp,
  TrendingDown,
  Plus,
  Loader2,
  RefreshCw,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"

interface Collection {
  id: string
  date: string
  cashAmount: number
  gpayAmount: number
  advanceAmount: number
  balanceAmount: number
  notes: string | null
  createdAt: string
}

interface CollectionTotals {
  totalCash: number
  totalGpay: number
  totalAdvance: number
  totalBalance: number
  totalCollection: number
}

interface CollectionsResponse {
  collections: Collection[]
  totals: CollectionTotals
  period: { start: string; end: string }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount)
}

const PIE_COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))"]

const collectionSchema = z.object({
  date: z.string().min(1, "Date is required"),
  cashAmount: z.string().optional(),
  gpayAmount: z.string().optional(),
  advanceAmount: z.string().optional(),
  balanceAmount: z.string().optional(),
  notes: z.string().optional(),
})

type CollectionFormData = z.infer<typeof collectionSchema>

const periodTabs = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
]

function SummarySkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-28" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [totals, setTotals] = useState<CollectionTotals | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState("daily")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CollectionFormData>({
    resolver: zodResolver(collectionSchema),
    defaultValues: {
      date: format(new Date(), "yyyy-MM-dd"),
      cashAmount: "0",
      gpayAmount: "0",
      advanceAmount: "0",
      balanceAmount: "0",
      notes: "",
    },
  })

  const fetchCollections = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/collections?period=${period}`)
      if (res.ok) {
        const data: CollectionsResponse = await res.json()
        setCollections(data.collections)
        setTotals(data.totals)
      }
    } catch {
      toast.error("Failed to fetch collections")
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    fetchCollections()
  }, [fetchCollections])

  async function onSubmit(data: CollectionFormData) {
    setSubmitting(true)
    try {
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: data.date,
          cashAmount: Number.parseFloat(data.cashAmount || "0"),
          gpayAmount: Number.parseFloat(data.gpayAmount || "0"),
          advanceAmount: Number.parseFloat(data.advanceAmount || "0"),
          balanceAmount: Number.parseFloat(data.balanceAmount || "0"),
          notes: data.notes || undefined,
        }),
      })

      if (!res.ok) throw new Error("Failed to create collection")

      toast.success("Collection entry added")
      setDialogOpen(false)
      reset({
        date: format(new Date(), "yyyy-MM-dd"),
        cashAmount: "0",
        gpayAmount: "0",
        advanceAmount: "0",
        balanceAmount: "0",
        notes: "",
      })
      await fetchCollections()
    } catch {
      toast.error("Failed to create collection")
    } finally {
      setSubmitting(false)
    }
  }

  const pieData = [
    { name: "Cash", value: totals?.totalCash || 0 },
    { name: "GPay", value: totals?.totalGpay || 0 },
  ]

  const trendData = collections
    .slice()
    .reverse()
    .map((c) => ({
      date: format(new Date(c.date), "dd/MM"),
      cash: Number(c.cashAmount),
      gpay: Number(c.gpayAmount),
      total: Number(c.cashAmount) + Number(c.gpayAmount),
    }))

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Collections</h1>
          <p className="text-sm text-muted-foreground">
            Track daily collections and payment breakdowns
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={fetchCollections}>
            <RefreshCw className="size-4" />
          </Button>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="size-4" />
            Add Collection
          </Button>
        </div>
      </div>

      {loading ? (
        <SummarySkeleton />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Cash</CardTitle>
                <Banknote className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {totals ? formatCurrency(totals.totalCash) : "₹0.00"}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total GPay</CardTitle>
                <Wallet className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {totals ? formatCurrency(totals.totalGpay) : "₹0.00"}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Advance Collections</CardTitle>
                <TrendingUp className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {totals ? formatCurrency(totals.totalAdvance) : "₹0.00"}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Balance Collections</CardTitle>
                <TrendingDown className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {totals ? formatCurrency(totals.totalBalance) : "₹0.00"}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      <Tabs value={period} onValueChange={setPeriod}>
        <div className="flex items-center justify-between">
          <TabsList>
            {periodTabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          <motion.div
            key={`pie-${period}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Payment Breakdown</CardTitle>
                <CardDescription>Cash vs GPay distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={4}
                        dataKey="value"
                        animationBegin={0}
                        animationDuration={800}
                      >
                        {pieData.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={PIE_COLORS[index]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => formatCurrency(Number(value ?? 0))}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            key={`trend-${period}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Collection Trend</CardTitle>
                <CardDescription>Daily collection amounts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="date"
                        className="text-xs text-muted-foreground"
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis
                        className="text-xs text-muted-foreground"
                        tick={{ fontSize: 11 }}
                        tickFormatter={(v) => `₹${(Number(v ?? 0) / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        formatter={(value) => formatCurrency(Number(value ?? 0))}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="cash"
                        stroke="hsl(var(--chart-1))"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        name="Cash"
                      />
                      <Line
                        type="monotone"
                        dataKey="gpay"
                        stroke="hsl(var(--chart-2))"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        name="GPay"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </Tabs>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Collection Entries</CardTitle>
            <CardDescription>
              {collections.length} entr{collections.length !== 1 ? "ies" : "y"} in this period
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-48 w-full" />
            ) : collections.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <IndianRupee className="mb-2 size-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No collections recorded for this period
                </p>
                <Button variant="link" onClick={() => setDialogOpen(true)}>
                  Add your first collection entry
                </Button>
              </div>
            ) : (
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Cash Amount</TableHead>
                      <TableHead>GPay Amount</TableHead>
                      <TableHead>Advance</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Total</TableHead>
                      {collections.some((c) => c.notes) && <TableHead>Notes</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {collections.map((collection) => (
                      <TableRow key={collection.id}>
                        <TableCell>
                          {format(new Date(collection.date), "dd MMM yyyy")}
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(Number(collection.cashAmount))}
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(Number(collection.gpayAmount))}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(Number(collection.advanceAmount))}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(Number(collection.balanceAmount))}
                        </TableCell>
                        <TableCell className="font-bold">
                          {formatCurrency(
                            Number(collection.cashAmount) + Number(collection.gpayAmount)
                          )}
                        </TableCell>
                        {collections.some((c) => c.notes) && (
                          <TableCell className="max-w-[200px] truncate text-muted-foreground">
                            {collection.notes || "—"}
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
          {totals && collections.length > 0 && (
            <CardFooter className="border-t">
              <div className="flex w-full items-center justify-between text-sm font-medium">
                <span>Period Total</span>
                <span>{formatCurrency(totals.totalCollection)}</span>
              </div>
            </CardFooter>
          )}
        </Card>
      </motion.div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Collection Entry</DialogTitle>
            <DialogDescription>
              Record daily cash and GPay collections
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="collection-date">Date</Label>
                <Input
                  id="collection-date"
                  type="date"
                  {...register("date")}
                  aria-invalid={!!errors.date}
                />
                {errors.date && (
                  <p className="text-xs text-destructive">{errors.date.message}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="cashAmount">Cash Amount (₹)</Label>
                  <Input
                    id="cashAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...register("cashAmount")}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="gpayAmount">GPay Amount (₹)</Label>
                  <Input
                    id="gpayAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...register("gpayAmount")}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="advanceAmount">Advance (₹)</Label>
                  <Input
                    id="advanceAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...register("advanceAmount")}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="balanceAmount">Balance (₹)</Label>
                  <Input
                    id="balanceAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...register("balanceAmount")}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Optional notes..."
                  {...register("notes")}
                />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Entry"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
