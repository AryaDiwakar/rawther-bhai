"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, Loader2, Plus } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { motion } from "framer-motion"

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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

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

export default function NewExpensePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [showNewVendor, setShowNewVendor] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newVendorName, setNewVendorName] = useState("")
  const [newVendorPhone, setNewVendorPhone] = useState("")
  const [creatingCategory, setCreatingCategory] = useState(false)
  const [creatingVendor, setCreatingVendor] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      paymentMode: "",
      expenseCategoryId: "",
      vendorId: "",
      amount: "",
      description: "",
    },
  })

  const selectedCategoryId = watch("expenseCategoryId")
  const selectedVendorId = watch("vendorId")

  useEffect(() => {
    fetch("/api/expense-categories")
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => toast.error("Failed to load categories"))
    fetch("/api/vendors?pageSize=100")
      .then((r) => r.json())
      .then((d) => setVendors(d.data || []))
      .catch(() => toast.error("Failed to load vendors"))
  }, [])

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return
    setCreatingCategory(true)
    try {
      const res = await fetch("/api/expense-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to create category")
      }
      const cat = await res.json()
      setCategories((prev) => [...prev, cat].sort((a, b) => a.name.localeCompare(b.name)))
      setValue("expenseCategoryId", cat.id)
      setNewCategoryName("")
      setShowNewCategory(false)
      toast.success("Category created")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create category")
    } finally {
      setCreatingCategory(false)
    }
  }

  const handleCreateVendor = async () => {
    if (!newVendorName.trim() || !newVendorPhone.trim()) return
    setCreatingVendor(true)
    try {
      const res = await fetch("/api/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newVendorName.trim(), phone: newVendorPhone.trim() }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to create vendor")
      }
      const ven = await res.json()
      setVendors((prev) => [...prev, ven].sort((a, b) => a.name.localeCompare(b.name)))
      setValue("vendorId", ven.id)
      setNewVendorName("")
      setNewVendorPhone("")
      setShowNewVendor(false)
      toast.success("Vendor created")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create vendor")
    } finally {
      setCreatingVendor(false)
    }
  }

  const onSubmit = async (data: ExpenseFormData) => {
    setLoading(true)
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          vendorId: data.vendorId || null,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to create expense")
      }
      toast.success("Expense created successfully")
      router.push("/expenses")
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create expense")
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mx-auto max-w-2xl space-y-6"
    >
      <div className="flex items-center gap-4">
        <Link href="/expenses">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Add Expense</h1>
          <p className="text-sm text-muted-foreground">Record a new business expense</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Expense Details</CardTitle>
          <CardDescription>Fill in the details of your expense</CardDescription>
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
                <div className="flex gap-2">
                  <Select
                    value={selectedCategoryId}
                    onValueChange={(v) => v && setValue("expenseCategoryId", v, { shouldValidate: true })}
                  >
                    <SelectTrigger className="flex-1">
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
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    onClick={() => setShowNewCategory(true)}
                  >
                    <Plus className="size-3.5" />
                  </Button>
                </div>
                {errors.expenseCategoryId && (
                  <p className="text-xs text-destructive">{errors.expenseCategoryId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Payment Mode</Label>
                <Select
                  value={watch("paymentMode")}
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
              <div className="flex gap-2">
                <Select
                  value={selectedVendorId || ""}
                  onValueChange={(v) => setValue("vendorId", v || "")}
                >
                  <SelectTrigger className="flex-1">
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
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  onClick={() => setShowNewVendor(true)}
                >
                  <Plus className="size-3.5" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <Link href="/expenses">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Expense"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Dialog open={showNewCategory} onOpenChange={setShowNewCategory}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Category</DialogTitle>
            <DialogDescription>Create a new expense category</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Category Name</Label>
              <Input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="e.g., Groceries"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewCategory(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCategory} disabled={creatingCategory || !newCategoryName.trim()}>
              {creatingCategory && <Loader2 className="size-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showNewVendor} onOpenChange={setShowNewVendor}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Vendor</DialogTitle>
            <DialogDescription>Create a new vendor</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Vendor Name</Label>
              <Input
                value={newVendorName}
                onChange={(e) => setNewVendorName(e.target.value)}
                placeholder="e.g., ABC Supplies"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={newVendorPhone}
                onChange={(e) => setNewVendorPhone(e.target.value)}
                placeholder="e.g., 9876543210"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewVendor(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateVendor}
              disabled={creatingVendor || !newVendorName.trim() || !newVendorPhone.trim()}
            >
              {creatingVendor && <Loader2 className="size-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
