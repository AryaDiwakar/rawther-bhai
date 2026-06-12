"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  ArrowLeft,
  Loader2,
  Pencil,
  Trash2,
  Eye,
  Calendar,
  Building2,
  CreditCard,
  IndianRupee,
  ExternalLink,
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
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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

const expenseSchema = z.object({
  amount: z.string().min(1, "Amount is required").refine(
    (v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0,
    "Amount must be greater than 0"
  ),
  description: z.string().min(1, "Description is required").max(500),
  expenseCategoryId: z.string().min(1, "Category is required"),
  vendorId: z.string().optional(),
  paymentMode: z.string().min(1, "Payment mode is required"),
  date: z.string().min(1, "Date is required"),
})

type ExpenseFormData = z.infer<typeof expenseSchema>

interface ExpenseCategory {
  id: string
  name: string
}

interface Vendor {
  id: string
  name: string
}

interface Expense {
  id: string
  amount: number
  description: string
  expenseCategoryId: string
  vendorId: string | null
  paymentMode: string
  date: string
  createdAt: string
  updatedAt: string
  category: { id: string; name: string }
  vendor: { id: string; name: string } | null
}

const PAYMENT_MODE_LABELS: Record<string, string> = {
  CASH: "Cash",
  GPAY: "GPay",
  CARD: "Card",
}

function formatINR(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value)
}

export default function ExpenseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [id, setId] = useState<string | null>(null)

  useEffect(() => {
    params.then((p) => setId(p.id))
  }, [params])

  const [expense, setExpense] = useState<Expense | null>(null)
  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [editMode, setEditMode] = useState(searchParams.get("edit") === "true")

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
  })

  useEffect(() => {
    if (!id) return

    async function loadData() {
      setLoading(true)
      try {
        const [expRes, catRes, venRes] = await Promise.all([
          fetch(`/api/expenses/${id}`),
          fetch("/api/expense-categories"),
          fetch("/api/vendors?pageSize=100"),
        ])

        if (!expRes.ok) {
          toast.error("Expense not found")
          router.push("/expenses")
          return
        }

        const exp: Expense = await expRes.json()
        setExpense(exp)

        if (catRes.ok) setCategories(await catRes.json())
        if (venRes.ok) {
          const d = await venRes.json()
          setVendors(d.data || [])
        }

        reset({
          amount: String(exp.amount),
          description: exp.description,
          expenseCategoryId: exp.expenseCategoryId,
          vendorId: exp.vendorId || "",
          paymentMode: exp.paymentMode,
          date: new Date(exp.date).toISOString().split("T")[0],
        })
      } catch {
        toast.error("Failed to load expense")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [id, router, reset])

  const onSubmit = async (data: ExpenseFormData) => {
    if (!id) return
    setSaving(true)
    try {
      const res = await fetch(`/api/expenses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          vendorId: data.vendorId || null,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to update expense")
      }
      const updated = await res.json()
      setExpense(updated)
      toast.success("Expense updated successfully")
      setEditMode(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update expense")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!id) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
      toast.success("Expense deleted")
      router.push("/expenses")
      router.refresh()
    } catch {
      toast.error("Failed to delete expense")
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="size-8 rounded-lg" />
          <div>
            <Skeleton className="h-7 w-48" />
            <Skeleton className="mt-1 h-4 w-32" />
          </div>
        </div>
        <Card>
          <CardContent className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!expense) return null

  const selectedCategoryId = watch("expenseCategoryId")
  const selectedPaymentMode = watch("paymentMode")

  if (!editMode) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mx-auto max-w-2xl space-y-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/expenses">
              <Button variant="ghost" size="icon-sm">
                <ArrowLeft className="size-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Expense Details</h1>
              <p className="text-sm text-muted-foreground">
                Created {format(new Date(expense.createdAt), "dd MMM yyyy, h:mm a")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>
              <Pencil className="size-3.5" />
              Edit
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setDeleteDialog(true)}>
              <Trash2 className="size-3.5" />
              Delete
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between pb-6">
              <div>
                <p className="text-sm text-muted-foreground">Amount</p>
                <p className="text-3xl font-bold tabular-nums">
                  {formatINR(Number(expense.amount))}
                </p>
              </div>
              <div className="rounded-full bg-primary/10 p-3 text-primary">
                <IndianRupee className="size-6" />
              </div>
            </div>

            <Separator className="mb-6" />

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Date</p>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="size-3.5 text-muted-foreground" />
                  {format(new Date(expense.date), "dd MMM yyyy")}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Payment Mode</p>
                <Badge variant="outline">
                  {PAYMENT_MODE_LABELS[expense.paymentMode] || expense.paymentMode}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Category</p>
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="size-3.5 text-muted-foreground" />
                  {expense.category.name}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Vendor</p>
                <div className="flex items-center gap-2 text-sm">
                  {expense.vendor ? (
                    <>
                      <ExternalLink className="size-3.5 text-muted-foreground" />
                      <Link
                        href={`/vendors/${expense.vendor.id}`}
                        className="text-primary hover:underline"
                      >
                        {expense.vendor.name}
                      </Link>
                    </>
                  ) : (
                    <span className="text-muted-foreground">Not assigned</span>
                  )}
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            <div>
              <p className="text-xs text-muted-foreground mb-1">Description</p>
              <p className="text-sm">{expense.description}</p>
            </div>
          </CardContent>
        </Card>

        <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Expense</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this expense? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialog(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                {deleting && <Loader2 className="size-4 animate-spin" />}
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mx-auto max-w-2xl space-y-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon-sm" onClick={() => setEditMode(false)}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Edit Expense</h1>
            <p className="text-sm text-muted-foreground">
              Update the expense details
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => setEditMode(false)}>
          <Eye className="size-3.5" />
          View Mode
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Expense Details</CardTitle>
          <CardDescription>Modify the expense information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  aria-invalid={!!errors.amount}
                  {...register("amount")}
                />
                {errors.amount && (
                  <p className="text-xs text-destructive">{errors.amount.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  aria-invalid={!!errors.date}
                  {...register("date")}
                />
                {errors.date && (
                  <p className="text-xs text-destructive">{errors.date.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="What was this expense for?"
                rows={3}
                aria-invalid={!!errors.description}
                {...register("description")}
              />
              {errors.description && (
                <p className="text-xs text-destructive">{errors.description.message}</p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={selectedCategoryId}
                  onValueChange={(v) => v && setValue("expenseCategoryId", v, { shouldValidate: true })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.expenseCategoryId && (
                  <p className="text-xs text-destructive">{errors.expenseCategoryId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Payment Mode</Label>
                <Select
                  value={selectedPaymentMode}
                  onValueChange={(v) => v && setValue("paymentMode", v, { shouldValidate: true })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="GPAY">GPay</SelectItem>
                    <SelectItem value="CARD">Card</SelectItem>
                  </SelectContent>
                </Select>
                {errors.paymentMode && (
                  <p className="text-xs text-destructive">{errors.paymentMode.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Vendor (Optional)</Label>
              <Select
                value={watch("vendorId") || ""}
                onValueChange={(v) => setValue("vendorId", v || "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select vendor (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {vendors.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setEditMode(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => setDeleteDialog(true)}
                className="ml-auto"
              >
                <Trash2 className="size-3.5" />
                Delete
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Expense</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this expense? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="size-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
