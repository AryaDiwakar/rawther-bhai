"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  ArrowLeft,
  Loader2,
  Phone,
  Mail,
  MapPin,
  IndianRupee,
  Plus,
  Wallet,
  Scale,
  TrendingUp,
  TrendingDown,
  Calendar,
  Landmark,
  Receipt,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { motion } from "framer-motion"
import { format } from "date-fns"

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
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"

interface ExpenseForLedger {
  id: string
  description: string
  amount: number
  date: string
  category: { id: string; name: string } | null
}

interface Vendor {
  id: string
  name: string
  phone: string
  email: string | null
  address: string | null
  outstandingBalance: number
  createdAt: string
  settlements: Settlement[]
  adjustments: Adjustment[]
  expenses: ExpenseForLedger[]
}

interface Settlement {
  id: string
  vendorId: string
  amount: number
  mode: string
  date: string
  notes: string | null
  createdAt: string
}

interface Adjustment {
  id: string
  vendorId: string
  amount: number
  type: string
  reason: string
  date: string
  createdAt: string
}

const settlementSchema = z.object({
  amount: z.string().min(1, "Amount is required").refine(
    (v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0,
    "Amount must be greater than 0"
  ),
  mode: z.string().min(1, "Mode is required"),
  date: z.string().min(1, "Date is required"),
  notes: z.string().optional(),
})

const adjustmentSchema = z.object({
  amount: z.string().min(1, "Amount is required").refine(
    (v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0,
    "Amount must be greater than 0"
  ),
  type: z.string().min(1, "Type is required"),
  reason: z.string().min(1, "Reason is required"),
  date: z.string().min(1, "Date is required"),
})

type SettlementFormData = z.infer<typeof settlementSchema>
type AdjustmentFormData = z.infer<typeof adjustmentSchema>

function formatINR(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value)
}

export default function VendorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [id, setId] = useState<string | null>(null)
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [loading, setLoading] = useState(true)
  const [settlementDialog, setSettlementDialog] = useState(false)
  const [adjustmentDialog, setAdjustmentDialog] = useState(false)
  const [settlementLoading, setSettlementLoading] = useState(false)
  const [adjustmentLoading, setAdjustmentLoading] = useState(false)
  const [tab, setTab] = useState("ledger")

  useEffect(() => {
    params.then((p) => setId(p.id))
  }, [params])

  useEffect(() => {
    if (!id) return

    async function load() {
      setLoading(true)
      try {
        const res = await fetch(`/api/vendors/${id}`)
        if (!res.ok) {
          toast.error("Vendor not found")
          router.push("/vendors")
          return
        }
        setVendor(await res.json())
      } catch {
        toast.error("Failed to load vendor")
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [id, router])

  const settleForm = useForm<SettlementFormData>({
    resolver: zodResolver(settlementSchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      mode: "",
      amount: "",
      notes: "",
    },
  })

  const adjForm = useForm<AdjustmentFormData>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      type: "",
      amount: "",
      reason: "",
    },
  })

  const handleSettlement = async (data: SettlementFormData) => {
    if (!id) return
    setSettlementLoading(true)
    try {
      const res = await fetch(`/api/vendors/${id}/settlements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to create settlement")
      }
      toast.success("Settlement recorded")
      setSettlementDialog(false)
      settleForm.reset()
      // Reload vendor data
      const updated = await fetch(`/api/vendors/${id}`)
      setVendor(await updated.json())
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create settlement")
    } finally {
      setSettlementLoading(false)
    }
  }

  const handleAdjustment = async (data: AdjustmentFormData) => {
    if (!id) return
    setAdjustmentLoading(true)
    try {
      const res = await fetch(`/api/vendors/${id}/adjustments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to create adjustment")
      }
      toast.success("Adjustment recorded")
      setAdjustmentDialog(false)
      adjForm.reset()
      const updated = await fetch(`/api/vendors/${id}`)
      setVendor(await updated.json())
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create adjustment")
    } finally {
      setAdjustmentLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="size-8 rounded-lg" />
          <div>
            <Skeleton className="h-7 w-48" />
            <Skeleton className="mt-1 h-4 w-32" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    )
  }

  if (!vendor) return null

  const totalSettled = vendor.settlements.reduce((s, st) => s + Number(st.amount), 0)
  const totalCredit = vendor.adjustments
    .filter((a) => a.type === "CREDIT")
    .reduce((s, a) => s + Number(a.amount), 0)
  const totalDebit = vendor.adjustments
    .filter((a) => a.type === "DEBIT")
    .reduce((s, a) => s + Number(a.amount), 0)

  // Build ledger: combine expenses, settlements, adjustments sorted by date
  const ledgerEntries = [
    ...(vendor.expenses || []).map((e) => ({
      id: e.id,
      date: new Date(e.date),
      description: `Expense: ${e.description}`,
      category: e.category?.name || "",
      type: "expense" as const,
      amount: Number(e.amount),
      balance: 0,
    })),
    ...vendor.settlements.map((s) => ({
      id: s.id,
      date: new Date(s.date),
      description: `Settlement via ${s.mode}${s.notes ? ` - ${s.notes}` : ""}`,
      category: "",
      type: "settlement" as const,
      amount: -Number(s.amount),
      balance: 0,
    })),
    ...vendor.adjustments.map((a) => ({
      id: a.id,
      date: new Date(a.date),
      description: `Adjustment (${a.type}): ${a.reason}`,
      category: "",
      type: "adjustment" as const,
      amount: a.type === "CREDIT" ? Number(a.amount) : -Number(a.amount),
      balance: 0,
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime())

  let runningBalance = vendor.outstandingBalance
  // Calculate running balance from oldest to newest
  const ledgerWithBalance = [...ledgerEntries].reverse().map((entry) => {
    runningBalance += entry.type === "expense" ? entry.amount : entry.amount
    return { ...entry, balance: runningBalance }
  }).reverse()

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mx-auto max-w-4xl space-y-6"
    >
      <div className="flex items-center gap-4">
        <Link href="/vendors">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{vendor.name}</h1>
          <p className="text-sm text-muted-foreground">
            Vendor since {format(new Date(vendor.createdAt), "dd MMM yyyy")}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
                {vendor.name.charAt(0).toUpperCase()}
              </div>
              <div className="space-y-2">
                <h3 className="font-medium">{vendor.name}</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="size-3.5" />
                    {vendor.phone}
                  </div>
                  {vendor.email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="size-3.5" />
                      {vendor.email}
                    </div>
                  )}
                  {vendor.address && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="size-3.5" />
                      {vendor.address}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Outstanding Balance</p>
                <p className={`text-2xl font-bold tabular-nums mt-1 ${
                  vendor.outstandingBalance > 0
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-emerald-600 dark:text-emerald-400"
                }`}>
                  {formatINR(vendor.outstandingBalance)}
                </p>
              </div>
              <div className={`rounded-full p-3 ${
                vendor.outstandingBalance > 0
                  ? "bg-amber-500/10 text-amber-600"
                  : "bg-emerald-500/10 text-emerald-600"
              }`}>
                <IndianRupee className="size-6" />
              </div>
            </div>
            <Separator className="my-4" />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Total Settled</p>
                <p className="font-medium tabular-nums">{formatINR(totalSettled)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Adjusted</p>
                <p className="font-medium tabular-nums">{formatINR(totalCredit + totalDebit)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <Tabs value={tab} onValueChange={setTab}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="ledger">
                  <Receipt className="size-3.5" />
                  Ledger
                </TabsTrigger>
                <TabsTrigger value="settlements">
                  <Wallet className="size-3.5" />
                  Settlements
                </TabsTrigger>
                <TabsTrigger value="adjustments">
                  <Scale className="size-3.5" />
                  Adjustments
                </TabsTrigger>
              </TabsList>
              <div className="flex items-center gap-2">
                {tab === "settlements" && (
                  <Button size="sm" onClick={() => setSettlementDialog(true)}>
                    <Plus className="size-3.5" />
                    Add Settlement
                  </Button>
                )}
                {tab === "adjustments" && (
                  <Button size="sm" onClick={() => setAdjustmentDialog(true)}>
                    <Plus className="size-3.5" />
                    Add Adjustment
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <TabsContent value="ledger" className="mt-0">
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Running Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ledgerWithBalance.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                          No transactions yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      ledgerWithBalance.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell className="text-sm">
                            {format(entry.date, "dd MMM yyyy")}
                          </TableCell>
                          <TableCell className="max-w-[250px] truncate">
                            {entry.description}
                          </TableCell>
                          <TableCell>
                            {entry.category && (
                              <Badge variant="outline" className="font-normal">
                                {entry.category}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            <span
                              className={
                                entry.amount > 0
                                  ? "text-red-600 dark:text-red-400"
                                  : entry.amount < 0
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : ""
                              }
                            >
                              {entry.amount > 0 ? "+" : ""}
                              {formatINR(Math.abs(entry.amount))}
                            </span>
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-medium">
                            {formatINR(entry.balance)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="settlements" className="mt-0">
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Mode</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendor.settlements.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                          No settlements yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      vendor.settlements.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell>{format(new Date(s.date), "dd MMM yyyy")}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-normal">
                              {s.mode}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-medium text-emerald-600 dark:text-emerald-400">
                            -{formatINR(Number(s.amount))}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {s.notes || "—"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-4 flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3 text-sm">
                <span className="text-muted-foreground">Total Settled</span>
                <span className="font-medium tabular-nums">{formatINR(totalSettled)}</span>
              </div>
            </TabsContent>

            <TabsContent value="adjustments" className="mt-0">
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendor.adjustments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                          No adjustments yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      vendor.adjustments.map((a) => (
                        <TableRow key={a.id}>
                          <TableCell>{format(new Date(a.date), "dd MMM yyyy")}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                a.type === "CREDIT"
                                  ? "border-red-300 text-red-700 dark:border-red-700 dark:text-red-400"
                                  : "border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-400"
                              }
                            >
                              {a.type === "CREDIT" ? (
                                <TrendingUp className="size-3 mr-1" />
                              ) : (
                                <TrendingDown className="size-3 mr-1" />
                              )}
                              {a.type}
                            </Badge>
                          </TableCell>
                          <TableCell
                            className={`text-right tabular-nums font-medium ${
                              a.type === "CREDIT"
                                ? "text-red-600 dark:text-red-400"
                                : "text-emerald-600 dark:text-emerald-400"
                            }`}
                          >
                            {a.type === "CREDIT" ? "+" : "-"}
                            {formatINR(Number(a.amount))}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {a.reason}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between rounded-lg bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm">
                  <span className="text-muted-foreground">Total Credit</span>
                  <span className="font-medium tabular-nums text-red-600 dark:text-red-400">
                    {formatINR(totalCredit)}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-emerald-50 dark:bg-emerald-950/30 px-4 py-3 text-sm">
                  <span className="text-muted-foreground">Total Debit</span>
                  <span className="font-medium tabular-nums text-emerald-600 dark:text-emerald-400">
                    {formatINR(totalDebit)}
                  </span>
                </div>
              </div>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>

      <Dialog open={settlementDialog} onOpenChange={setSettlementDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Settlement</DialogTitle>
            <DialogDescription>Record a payment made to this vendor</DialogDescription>
          </DialogHeader>
          <form onSubmit={settleForm.handleSubmit(handleSettlement)} className="space-y-4">
            <div className="space-y-2">
              <Label>Amount (₹)</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                {...settleForm.register("amount")}
              />
              {settleForm.formState.errors.amount && (
                <p className="text-xs text-destructive">{settleForm.formState.errors.amount.message}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Mode</Label>
                <Select
                  value={settleForm.watch("mode")}
                  onValueChange={(v) => v && settleForm.setValue("mode", v, { shouldValidate: true })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="GPAY">GPay</SelectItem>
                  </SelectContent>
                </Select>
                {settleForm.formState.errors.mode && (
                  <p className="text-xs text-destructive">{settleForm.formState.errors.mode.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" {...settleForm.register("date")} />
                {settleForm.formState.errors.date && (
                  <p className="text-xs text-destructive">{settleForm.formState.errors.date.message}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Input placeholder="Any notes..." {...settleForm.register("notes")} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSettlementDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={settlementLoading}>
                {settlementLoading && <Loader2 className="size-4 animate-spin" />}
                Record Settlement
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={adjustmentDialog} onOpenChange={setAdjustmentDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Adjustment</DialogTitle>
            <DialogDescription>Adjust the vendor&apos;s outstanding balance</DialogDescription>
          </DialogHeader>
          <form onSubmit={adjForm.handleSubmit(handleAdjustment)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Amount (₹)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  {...adjForm.register("amount")}
                />
                {adjForm.formState.errors.amount && (
                  <p className="text-xs text-destructive">{adjForm.formState.errors.amount.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={adjForm.watch("type")}
                  onValueChange={(v) => v && adjForm.setValue("type", v, { shouldValidate: true })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CREDIT">
                      <span className="flex items-center gap-2">
                        <TrendingUp className="size-3.5 text-red-500" />
                        Credit (Increase)
                      </span>
                    </SelectItem>
                    <SelectItem value="DEBIT">
                      <span className="flex items-center gap-2">
                        <TrendingDown className="size-3.5 text-emerald-500" />
                        Debit (Decrease)
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {adjForm.formState.errors.type && (
                  <p className="text-xs text-destructive">{adjForm.formState.errors.type.message}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" {...adjForm.register("date")} />
              {adjForm.formState.errors.date && (
                <p className="text-xs text-destructive">{adjForm.formState.errors.date.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Textarea
                placeholder="Why is this adjustment being made?"
                rows={2}
                {...adjForm.register("reason")}
              />
              {adjForm.formState.errors.reason && (
                <p className="text-xs text-destructive">{adjForm.formState.errors.reason.message}</p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAdjustmentDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={adjustmentLoading}>
                {adjustmentLoading && <Loader2 className="size-4 animate-spin" />}
                Record Adjustment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
