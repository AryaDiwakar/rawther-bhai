"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import {
  ArrowLeft,
  Loader2,
  Search,
  UserPlus,
  Check,
} from "lucide-react"
import { motion } from "framer-motion"
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

interface Customer {
  id: string
  name: string
  phone: string
}

const orderSchema = z.object({
  customerId: z.string().optional(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  orderDate: z.string().min(1, "Order date is required"),
  deliveryDate: z.string().optional(),
  totalAmount: z.string().min(1, "Total amount is required"),
  advance: z.string().optional(),
  advanceMode: z.enum(["CASH", "GPAY"]).optional(),
  notes: z.string().optional(),
})

type OrderFormData = z.infer<typeof orderSchema>

export default function NewOrderPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [customers, setCustomers] = useState<Customer[]>([])
  const [showCustomerSearch, setShowCustomerSearch] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [creatingNew, setCreatingNew] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      orderDate: format(new Date(), "yyyy-MM-dd"),
      advance: "0",
      advanceMode: "CASH",
      totalAmount: "",
      notes: "",
      customerName: "",
      customerPhone: "",
    },
  })

  const totalAmount = watch("totalAmount")
  const advance = watch("advance")
  const advanceAmount = Number.parseFloat(advance || "0")
  const total = Number.parseFloat(totalAmount || "0")
  const balance = Math.max(0, total - advanceAmount)

  useEffect(() => {
    if (searchTerm.length < 1) {
      setCustomers([])
      return
    }
    const debounce = setTimeout(async () => {
      try {
        const res = await fetch(`/api/customers?search=${encodeURIComponent(searchTerm)}`)
        if (res.ok) {
          const data = await res.json()
          const list = data.customers || (Array.isArray(data) ? data : [])
          setCustomers(list)
        }
      } catch {
        setCustomers([])
      }
    }, 300)
    return () => clearTimeout(debounce)
  }, [searchTerm])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowCustomerSearch(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer)
    setValue("customerId", customer.id)
    setValue("customerName", customer.name)
    setValue("customerPhone", customer.phone)
    setShowCustomerSearch(false)
    setSearchTerm("")
    setCreatingNew(false)
  }

  const handleCreateNew = () => {
    setSelectedCustomer(null)
    setValue("customerId", "")
    setShowCustomerSearch(false)
    setCreatingNew(true)
  }

  async function onSubmit(data: OrderFormData) {
    if (!data.customerId && !data.customerPhone) {
      toast.error("Please select or create a customer")
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        customerId: data.customerId || undefined,
        customerName: data.customerName || undefined,
        customerPhone: data.customerPhone || undefined,
        orderDate: data.orderDate,
        deliveryDate: data.deliveryDate || undefined,
        totalAmount: data.totalAmount,
        advance: data.advance || "0",
        advanceMode: data.advanceMode || "CASH",
        notes: data.notes || undefined,
      }

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to create order")
      }

      toast.success("Order created successfully")
      router.push("/orders")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create order")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 max-w-2xl"
    >
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/orders")}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New Order</h1>
          <p className="text-sm text-muted-foreground">
            Create a new customer order
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Customer Details</CardTitle>
            <CardDescription>
              Search for an existing customer or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!creatingNew && !selectedCustomer && (
              <div ref={searchRef} className="relative">
                <Label>Search Customer</Label>
                <div className="relative mt-1.5">
                  <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or phone..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value)
                      setShowCustomerSearch(true)
                    }}
                    onFocus={() => setShowCustomerSearch(true)}
                    className="pl-8"
                  />
                </div>
                {showCustomerSearch && customers.length > 0 && (
                  <div className="absolute z-50 mt-1 w-full rounded-lg border bg-popover p-1 shadow-md">
                    {customers.map((customer) => (
                      <button
                        key={customer.id}
                        type="button"
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                        onClick={() => handleCustomerSelect(customer)}
                      >
                        <div className="flex flex-1 flex-col text-left">
                          <span className="font-medium">{customer.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {customer.phone}
                          </span>
                        </div>
                        <Check className="size-4 shrink-0 opacity-0 group-hover:opacity-100" />
                      </button>
                    ))}
                    <div className="border-t pt-1 mt-1">
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                        onClick={handleCreateNew}
                      >
                        <UserPlus className="size-4" />
                        <span>Create new customer</span>
                      </button>
                    </div>
                  </div>
                )}
                {showCustomerSearch && searchTerm && customers.length === 0 && (
                  <div className="absolute z-50 mt-1 w-full rounded-lg border bg-popover p-2 shadow-md">
                    <p className="text-sm text-muted-foreground mb-2">
                      No customers found
                    </p>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                      onClick={handleCreateNew}
                    >
                      <UserPlus className="size-4" />
                      <span>Create new customer</span>
                    </button>
                  </div>
                )}
                {!searchTerm && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Type to search for a customer
                  </p>
                )}
              </div>
            )}

            {selectedCustomer && !creatingNew && (
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium">{selectedCustomer.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedCustomer.phone}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedCustomer(null)
                    setValue("customerId", "")
                    setValue("customerName", "")
                    setValue("customerPhone", "")
                  }}
                >
                  Change
                </Button>
              </div>
            )}

            {creatingNew && (
              <div className="space-y-3 rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">New Customer</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setCreatingNew(false)
                      setSelectedCustomer(null)
                      setValue("customerId", "")
                      setValue("customerName", "")
                      setValue("customerPhone", "")
                    }}
                  >
                    Cancel
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="customerName">Name</Label>
                    <Input
                      id="customerName"
                      placeholder="Customer name"
                      {...register("customerName")}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="customerPhone">Phone *</Label>
                    <Input
                      id="customerPhone"
                      placeholder="Phone number"
                      {...register("customerPhone")}
                      aria-invalid={!!errors.customerPhone}
                    />
                    {errors.customerPhone && (
                      <p className="text-xs text-destructive">
                        {errors.customerPhone.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="orderDate">Order Date *</Label>
                <Input
                  id="orderDate"
                  type="date"
                  {...register("orderDate")}
                  aria-invalid={!!errors.orderDate}
                />
                {errors.orderDate && (
                  <p className="text-xs text-destructive">
                    {errors.orderDate.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="deliveryDate">Delivery Date</Label>
                <Input
                  id="deliveryDate"
                  type="date"
                  {...register("deliveryDate")}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="totalAmount">Total Amount (₹) *</Label>
              <Input
                id="totalAmount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                {...register("totalAmount")}
                aria-invalid={!!errors.totalAmount}
              />
              {errors.totalAmount && (
                <p className="text-xs text-destructive">
                  {errors.totalAmount.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="advance">Advance Payment (₹)</Label>
                <Input
                  id="advance"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  {...register("advance")}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="advanceMode">Payment Mode</Label>
                <Select
                  defaultValue="CASH"
                  onValueChange={(v) => setValue("advanceMode", v as "CASH" | "GPAY")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="GPAY">GPay</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {totalAmount && (
              <div className="rounded-lg bg-muted p-3">
                <div className="flex items-center justify-between text-sm">
                  <span>Total Amount</span>
                  <span className="font-medium">
                    ₹{total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Advance</span>
                  <span>-₹{advanceAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="mt-1 flex items-center justify-between border-t pt-1 text-sm font-medium">
                  <span>Balance Due</span>
                  <span>₹{balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any notes about this order..."
                {...register("notes")}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/orders")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Order"
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </motion.div>
  )
}
