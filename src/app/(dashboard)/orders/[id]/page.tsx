"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import {
  ArrowLeft,
  Loader2,
  Plus,
  Check,
  Ban,
  Pencil,
} from "lucide-react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
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
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"

type OrderStatus = "UPCOMING" | "COMPLETED" | "PENDING_BALANCE" | "CANCELLED"

interface Customer {
  id: string
  name: string
  phone: string
}

interface OrderPayment {
  id: string
  amount: number
  mode: string
  type: string
  createdAt: string
}

interface Order {
  id: string
  orderNo: string
  customer: Customer
  orderDate: string
  deliveryDate: string | null
  advance: number
  balance: number
  totalAmount: number
  status: OrderStatus
  notes: string | null
  payments: OrderPayment[]
}

const statusConfig: Record<OrderStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "ghost" | "link" }> = {
  UPCOMING: { label: "Upcoming", variant: "default" },
  COMPLETED: { label: "Completed", variant: "secondary" },
  PENDING_BALANCE: { label: "Pending Balance", variant: "outline" },
  CANCELLED: { label: "Cancelled", variant: "destructive" },
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount)
}

const paymentSchema = z.object({
  amount: z.string().min(1, "Amount is required"),
  mode: z.enum(["CASH", "GPAY"]),
  type: z.enum(["ADVANCE", "BALANCE"]),
})

type PaymentFormData = z.infer<typeof paymentSchema>

const editSchema = z.object({
  orderDate: z.string().min(1, "Order date is required"),
  deliveryDate: z.string().optional(),
  totalAmount: z.string().min(1, "Total amount is required"),
  notes: z.string().optional(),
})

type EditFormData = z.infer<typeof editSchema>

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [submittingPayment, setSubmittingPayment] = useState(false)
  const [submittingEdit, setSubmittingEdit] = useState(false)
  const [submittingStatus, setSubmittingStatus] = useState(false)

  const fetchOrder = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${id}`)
      if (res.ok) {
        const data = await res.json()
        setOrder(data)
      } else {
        toast.error("Order not found")
        router.push("/orders")
      }
    } catch {
      toast.error("Failed to fetch order")
    } finally {
      setLoading(false)
    }
  }, [id, router])

  useEffect(() => {
    fetchOrder()
  }, [fetchOrder])

  const {
    register: registerPayment,
    handleSubmit: handlePaymentSubmit,
    setValue: setPaymentValue,
    watch: watchPayment,
    reset: resetPayment,
    formState: { errors: paymentErrors },
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { amount: "", mode: "CASH", type: "BALANCE" },
  })

  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    reset: resetEdit,
    formState: { errors: editErrors },
  } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
  })

  const startEditing = useCallback(() => {
    if (!order) return
    resetEdit({
      orderDate: format(new Date(order.orderDate), "yyyy-MM-dd"),
      deliveryDate: order.deliveryDate
        ? format(new Date(order.deliveryDate), "yyyy-MM-dd")
        : "",
      totalAmount: String(order.totalAmount),
      notes: order.notes || "",
    })
    setEditing(true)
  }, [order, resetEdit])

  async function onAddPayment(data: PaymentFormData) {
    setSubmittingPayment(true)
    try {
      const res = await fetch(`/api/orders/${id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number.parseFloat(data.amount),
          mode: data.mode,
          type: data.type,
        }),
      })

      if (!res.ok) throw new Error("Failed to add payment")

      toast.success("Payment added successfully")
      resetPayment()
      await fetchOrder()
    } catch {
      toast.error("Failed to add payment")
    } finally {
      setSubmittingPayment(false)
    }
  }

  async function onEditOrder(data: EditFormData) {
    setSubmittingEdit(true)
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderDate: data.orderDate,
          deliveryDate: data.deliveryDate || null,
          totalAmount: data.totalAmount,
          notes: data.notes || null,
        }),
      })

      if (!res.ok) throw new Error("Failed to update order")

      toast.success("Order updated successfully")
      setEditing(false)
      await fetchOrder()
    } catch {
      toast.error("Failed to update order")
    } finally {
      setSubmittingEdit(false)
    }
  }

  async function updateStatus(status: OrderStatus) {
    setSubmittingStatus(true)
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update-status", status }),
      })

      if (!res.ok) throw new Error("Failed to update status")

      toast.success(`Order marked as ${statusConfig[status].label}`)
      await fetchOrder()
    } catch {
      toast.error("Failed to update status")
    } finally {
      setSubmittingStatus(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!order) return null

  const paidAmount = order.payments.reduce((sum, p) => sum + Number(p.amount), 0)
  const progressPercent = order.totalAmount > 0
    ? Math.min(100, (paidAmount / Number(order.totalAmount)) * 100)
    : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/orders")}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">
                {order.orderNo}
              </h1>
              <Badge variant={statusConfig[order.status].variant}>
                {statusConfig[order.status].label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {order.customer.name} — {order.customer.phone}
            </p>
          </div>
        </div>

        {order.status !== "CANCELLED" && order.status !== "COMPLETED" && (
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={submittingStatus}
              onClick={() => updateStatus("COMPLETED")}
            >
              {submittingStatus ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Check className="size-4" />
              )}
              Mark Completed
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={submittingStatus}
              onClick={() => updateStatus("CANCELLED")}
            >
              {submittingStatus ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Ban className="size-4" />
              )}
              Cancel Order
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Order Details</CardTitle>
              {!editing && (
                <Button variant="ghost" size="icon-sm" onClick={startEditing}>
                  <Pencil className="size-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {editing ? (
              <form onSubmit={handleEditSubmit(onEditOrder)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-orderDate">Order Date</Label>
                    <Input
                      id="edit-orderDate"
                      type="date"
                      {...registerEdit("orderDate")}
                      aria-invalid={!!editErrors.orderDate}
                    />
                    {editErrors.orderDate && (
                      <p className="text-xs text-destructive">{editErrors.orderDate.message}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-deliveryDate">Delivery Date</Label>
                    <Input
                      id="edit-deliveryDate"
                      type="date"
                      {...registerEdit("deliveryDate")}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-totalAmount">Total Amount (₹)</Label>
                  <Input
                    id="edit-totalAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    {...registerEdit("totalAmount")}
                    aria-invalid={!!editErrors.totalAmount}
                  />
                  {editErrors.totalAmount && (
                    <p className="text-xs text-destructive">{editErrors.totalAmount.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-notes">Notes</Label>
                  <Textarea id="edit-notes" {...registerEdit("notes")} />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setEditing(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submittingEdit}>
                    {submittingEdit ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Order Date</span>
                  <p className="font-medium">
                    {format(new Date(order.orderDate), "dd MMM yyyy")}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Delivery Date</span>
                  <p className="font-medium">
                    {order.deliveryDate
                      ? format(new Date(order.deliveryDate), "dd MMM yyyy")
                      : "Not set"}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Amount</span>
                  <p className="font-medium">
                    {formatCurrency(Number(order.totalAmount))}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Balance</span>
                  <p className="font-medium">
                    {formatCurrency(Number(order.balance))}
                  </p>
                </div>
                {order.notes && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Notes</span>
                    <p className="mt-0.5">{order.notes}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative pt-1">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Paid: {formatCurrency(paidAmount)}
                </span>
                <span className="text-sm font-medium">
                  {Math.round(progressPercent)}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <motion.div
                  className="h-full rounded-full bg-primary transition-all"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
                <span>Advance: {formatCurrency(Number(order.advance))}</span>
                <span>Balance: {formatCurrency(Number(order.balance))}</span>
              </div>
            </div>

            <div className="rounded-lg border p-3">
              <p className="mb-2 text-sm font-medium">Add Payment</p>
              <form onSubmit={handlePaymentSubmit(onAddPayment)} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="payment-amount">Amount (₹)</Label>
                  <Input
                    id="payment-amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...registerPayment("amount")}
                    aria-invalid={!!paymentErrors.amount}
                  />
                  {paymentErrors.amount && (
                    <p className="text-xs text-destructive">{paymentErrors.amount.message}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <Label>Mode</Label>
                    <Select
                      defaultValue="CASH"
                      onValueChange={(v) => setPaymentValue("mode", v as "CASH" | "GPAY")}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CASH">Cash</SelectItem>
                        <SelectItem value="GPAY">GPay</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Type</Label>
                    <Select
                      defaultValue="BALANCE"
                      onValueChange={(v) => setPaymentValue("type", v as "ADVANCE" | "BALANCE")}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BALANCE">Balance</SelectItem>
                        <SelectItem value="ADVANCE">Advance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={submittingPayment}>
                  {submittingPayment ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Plus className="size-4" />
                  )}
                  Add Payment
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>
            {order.payments.length} payment{order.payments.length !== 1 ? "s" : ""} recorded
          </CardDescription>
        </CardHeader>
        <CardContent>
          {order.payments.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No payments recorded yet
            </p>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        {format(new Date(payment.createdAt), "dd/MM/yyyy HH:mm")}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(Number(payment.amount))}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{payment.mode}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={payment.type === "ADVANCE" ? "default" : "secondary"}
                        >
                          {payment.type}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
