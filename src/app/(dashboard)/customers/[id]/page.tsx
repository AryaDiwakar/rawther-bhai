"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ChevronLeft,
  Phone,
  Mail,
  MapPin,
  Edit3,
  Loader2,
  Receipt,
  CalendarClock,
  ShoppingBag,
  IndianRupee,
  User,
  Save,
  X,
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
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { formatCurrency, formatDate, formatDateTime, getInitials } from "@/lib/utils/format"

interface BillItem {
  id: string
  productName: string
  quantity: number
  total: number
}

interface Bill {
  id: string
  billNo: string
  total: number
  paymentMode: string
  createdAt: string
  items: BillItem[]
}

interface Order {
  id: string
  orderNo: string
  orderDate: string
  status: string
  totalAmount: number
  advance: number
  balance: number
}

interface CustomerDetail {
  id: string
  name: string
  phone: string
  email: string | null
  address: string | null
  visitCount: number
  totalSpent: number
  lastVisit: string | null
  createdAt: string
  updatedAt: string
  bills: Bill[]
  orders: Order[]
}

const statusColors: Record<string, string> = {
  UPCOMING: "bg-blue-500/10 text-blue-500",
  COMPLETED: "bg-emerald-500/10 text-emerald-500",
  PENDING_BALANCE: "bg-amber-500/10 text-amber-500",
  CANCELLED: "bg-destructive/10 text-destructive",
}

const paymentModeLabels: Record<string, string> = {
  CASH: "Cash",
  GPAY: "GPay",
  SPLIT: "Split",
  CARD: "Card",
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="size-10 rounded-full" />
        <div><Skeleton className="h-6 w-48" /><Skeleton className="h-4 w-32 mt-1" /></div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}><CardContent className="p-6"><Skeleton className="h-4 w-24 mb-2" /><Skeleton className="h-8 w-28" /></CardContent></Card>
        ))}
      </div>
      <Card><CardContent className="p-6"><Skeleton className="h-6 w-40 mb-4" />{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full mb-2" />)}</CardContent></Card>
    </div>
  )
}

export default function CustomerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [customer, setCustomer] = useState<CustomerDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState({ name: "", phone: "", email: "", address: "" })

  const fetchCustomer = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`/api/customers/${params.id}`)
      const data = await res.json()
      if (!data.success) throw new Error(data.message)
      setCustomer(data.data)
      setEditForm({
        name: data.data.name,
        phone: data.data.phone,
        email: data.data.email || "",
        address: data.data.address || "",
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load customer")
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    fetchCustomer()
  }, [fetchCustomer])

  const handleEdit = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/customers/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      })
      const data = await res.json()
      if (!data.success) {
        toast.error(data.message)
        return
      }
      toast.success("Customer updated")
      setEditOpen(false)
      fetchCustomer()
    } catch {
      toast.error("Failed to update customer")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this customer?")) return
    try {
      const res = await fetch(`/api/customers/${params.id}`, { method: "DELETE" })
      const data = await res.json()
      if (!data.success) {
        toast.error(data.message)
        return
      }
      toast.success("Customer deleted")
      router.push("/customers")
    } catch {
      toast.error("Failed to delete customer")
    }
  }

  if (loading) return <DetailSkeleton />
  if (error || !customer) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-destructive/10">
          <User className="size-8 text-destructive" />
        </div>
        <h3 className="mb-1 text-lg font-semibold">Customer not found</h3>
        <p className="mb-6 text-sm text-muted-foreground">{error || "The customer could not be found."}</p>
        <Button variant="outline" onClick={() => router.push("/customers")}>Back to Customers</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/customers">
            <Button variant="ghost" size="icon-sm"><ChevronLeft className="size-4" /></Button>
          </Link>
          <Avatar size="lg">
            <AvatarFallback className="text-base">{getInitials(customer.name)}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-xl font-semibold">{customer.name}</h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Phone className="size-3" />{customer.phone}</span>
              {customer.email && <span className="flex items-center gap-1"><Mail className="size-3" />{customer.email}</span>}
              {customer.address && <span className="flex items-center gap-1"><MapPin className="size-3" />{customer.address}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Edit3 className="size-4" />
            Edit
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Visit Count</CardTitle>
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
              <ShoppingBag className="size-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customer.visitCount}</div>
            <p className="text-xs text-muted-foreground">Total visits</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10">
              <IndianRupee className="size-4 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(Number(customer.totalSpent))}</div>
            <p className="text-xs text-muted-foreground">Lifetime value</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Last Visit</CardTitle>
            <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10">
              <CalendarClock className="size-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customer.lastVisit ? formatDate(new Date(customer.lastVisit)) : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">
              {customer.lastVisit
                ? `Joined ${formatDate(new Date(customer.createdAt))}`
                : "No visits yet"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Receipt className="size-4" />
              Purchase History
            </CardTitle>
            <CardDescription>
              {customer.bills.length} bill{customer.bills.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {customer.bills.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <Receipt className="mb-2 size-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No purchase history</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bill No</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Payment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customer.bills.map((bill) => (
                    <TableRow key={bill.id}>
                      <TableCell className="font-mono text-xs font-medium">{bill.billNo}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDateTime(new Date(bill.createdAt))}
                      </TableCell>
                      <TableCell>{bill.items.length}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(Number(bill.total))}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-[10px]">
                          {paymentModeLabels[bill.paymentMode] || bill.paymentMode}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarClock className="size-4" />
              Orders
            </CardTitle>
            <CardDescription>
              {customer.orders.length} order{customer.orders.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {customer.orders.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <CalendarClock className="mb-2 size-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No orders yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order No</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customer.orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs font-medium">{order.orderNo}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(new Date(order.orderDate))}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] ${statusColors[order.status] || ""}`}>
                          {order.status.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{formatCurrency(Number(order.totalAmount))}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
            <DialogDescription>Update customer information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                value={editForm.phone}
                onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                value={editForm.email}
                onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-address">Address</Label>
              <Textarea
                id="edit-address"
                rows={2}
                value={editForm.address}
                onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              <X className="size-4" />
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              <Save className="size-4" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
