"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { format } from "date-fns"
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Printer,
  X,
  Loader2,
  Receipt,
  ShoppingCart,
  User,
  ChevronDown,
  IndianRupee,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

interface Product {
  id: string
  name: string
  price: string
  category: { id: string; name: string }
  status: string
}

interface CartItem {
  productId: string
  productName: string
  unitPrice: number
  quantity: number
  total: number
}

interface Customer {
  id: string
  name: string
  phone: string
}

function formatINR(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount)
}

const TAX_RATE = 0.05

function generateBillHTML(bill: any, items: CartItem[], tax: number, discount: number, subtotal: number, total: number) {
  return `
    <html>
      <head>
        <style>
          body { font-family: 'Courier New', monospace; font-size: 12px; width: 80mm; margin: 0; padding: 10px; }
          h1 { text-align: center; font-size: 16px; margin-bottom: 4px; }
          .header { text-align: center; margin-bottom: 8px; font-size: 10px; }
          .bill-no { text-align: center; font-weight: bold; margin: 4px 0; }
          .divider { border-top: 1px dashed #000; margin: 8px 0; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 4px 2px; text-align: left; font-size: 11px; }
          th { border-bottom: 1px solid #000; }
          .amount { text-align: right; }
          .total-row td { font-weight: bold; border-top: 1px solid #000; padding-top: 4px; }
          .summary { margin-top: 8px; }
          .summary-row { display: flex; justify-content: space-between; padding: 2px 0; }
          .footer { text-align: center; margin-top: 12px; font-size: 10px; }
        </style>
      </head>
      <body>
        <h1>RAWTHER BIRYANI</h1>
        <div class="header">Hotel Management System<br/>${format(new Date(), "dd MMM yyyy, hh:mm a")}</div>
        <div class="bill-no">Bill #${bill.billNo}</div>
        ${bill.customer ? `<div class="header">Customer: ${bill.customer.name} (${bill.customer.phone})</div>` : ""}
        <div class="divider"></div>
        <table>
          <tr><th>Item</th><th>Qty</th><th class="amount">Price</th><th class="amount">Total</th></tr>
          ${items.map((item) => `
            <tr>
              <td>${item.productName}</td>
              <td>${item.quantity}</td>
              <td class="amount">${formatINR(item.unitPrice)}</td>
              <td class="amount">${formatINR(item.total)}</td>
            </tr>
          `).join("")}
        </table>
        <div class="divider"></div>
        <div class="summary">
          <div class="summary-row"><span>Subtotal</span><span>${formatINR(subtotal)}</span></div>
          ${tax > 0 ? `<div class="summary-row"><span>Tax (${(TAX_RATE * 100).toFixed(0)}%)</span><span>${formatINR(tax)}</span></div>` : ""}
          ${discount > 0 ? `<div class="summary-row"><span>Discount</span><span>-${formatINR(discount)}</span></div>` : ""}
          <div class="summary-row" style="font-weight: bold; font-size: 14px;">
            <span>TOTAL</span><span>${formatINR(total)}</span>
          </div>
          <div class="summary-row" style="margin-top: 4px;">
            <span>Payment: ${bill.paymentMode}</span>
          </div>
          ${bill.paymentMode === "SPLIT" ? `
            <div class="summary-row"><span>Cash: ${formatINR(Number(bill.cashAmount))}</span></div>
            <div class="summary-row"><span>GPay: ${formatINR(Number(bill.gpayAmount))}</span></div>
          ` : ""}
        </div>
        <div class="divider"></div>
        <div class="footer">
          Thank you! Visit again!<br/>
          Powered by Rawther Biryani
        </div>
      </body>
    </html>
  `
}

export default function BillingPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [productSearch, setProductSearch] = useState("")
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [paymentMode, setPaymentMode] = useState("CASH")
  const [cashAmount, setCashAmount] = useState("")
  const [gpayAmount, setGpayAmount] = useState("")
  const [taxPercent, setTaxPercent] = useState(5)
  const [discount, setDiscount] = useState(0)
  const [customerOpen, setCustomerOpen] = useState(false)
  const [customerSearch, setCustomerSearch] = useState("")
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [generatedBill, setGeneratedBill] = useState<any>(null)
  const [cancelDialog, setCancelDialog] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const [prodRes, catRes, custRes] = await Promise.all([
          fetch("/api/products?limit=200"),
          fetch("/api/categories"),
          fetch("/api/customers?pageSize=200"),
        ])
        const prodData = await prodRes.json()
        const catData = await catRes.json()
        const custData = await custRes.json()

        setProducts(
          (prodData.products || []).filter((p: Product) => p.status === "ACTIVE")
        )
        setCategories(catData || [])
        setCustomers(custData.data?.customers || custData || [])
      } catch (error) {
        toast.error("Failed to load data")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(productSearch.toLowerCase())
    const matchesCategory = selectedCategory === "all" || p.category.id === selectedCategory
    return matchesSearch && matchesCategory
  })

  const addToCart = useCallback((product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id)
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                total: (item.quantity + 1) * item.unitPrice,
              }
            : item
        )
      }
      const price = parseFloat(product.price)
      return [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          unitPrice: price,
          quantity: 1,
          total: price,
        },
      ]
    })
  }, [])

  const updateQuantity = useCallback((productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.productId === productId
            ? {
                ...item,
                quantity: Math.max(1, item.quantity + delta),
                total: Math.max(1, item.quantity + delta) * item.unitPrice,
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    )
  }, [])

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId))
  }, [])

  const subtotal = cart.reduce((sum, item) => sum + item.total, 0)
  const taxAmount = subtotal * (taxPercent / 100)
  const discountAmount = subtotal * (discount / 100)
  const total = subtotal + taxAmount - discountAmount

  const clearCart = useCallback(() => {
    setCart([])
    setPaymentMode("CASH")
    setCashAmount("")
    setGpayAmount("")
    setDiscount(0)
    setSelectedCustomer(null)
    setGeneratedBill(null)
  }, [])

  const splitError =
    paymentMode === "SPLIT"
      ? Math.abs((parseFloat(cashAmount || "0") + parseFloat(gpayAmount || "0")) - total) > 0.01
      : false

  async function handleGenerateBill() {
    if (cart.length === 0) {
      toast.error("Cart is empty")
      return
    }
    if (paymentMode === "SPLIT" && splitError) {
      toast.error("Split amounts must equal the total")
      return
    }

    setSubmitting(true)
    try {
      const payload: any = {
        items: cart.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
        })),
        subtotal,
        tax: taxAmount,
        discount: discountAmount,
        total,
        paymentMode,
        cashAmount: paymentMode === "CASH" ? total : paymentMode === "SPLIT" ? parseFloat(cashAmount || "0") : 0,
        gpayAmount: paymentMode === "GPAY" ? total : paymentMode === "SPLIT" ? parseFloat(gpayAmount || "0") : 0,
      }

      if (selectedCustomer) {
        payload.customerId = selectedCustomer.id
      }

      const res = await fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to generate bill")
      }

      const bill = await res.json()
      setGeneratedBill(bill)
      toast.success("Bill generated successfully")
    } catch (error: any) {
      toast.error(error.message || "Failed to generate bill")
    } finally {
      setSubmitting(false)
    }
  }

  function handlePrint() {
    if (!generatedBill) return
    const win = window.open("", "_blank")
    if (!win) {
      toast.error("Pop-up blocked. Please allow pop-ups for printing.")
      return
    }
    win.document.write(
      generateBillHTML(generatedBill, cart, taxAmount, discountAmount, subtotal, total)
    )
    win.document.close()
    win.focus()
    win.print()
  }

  async function handleCancelBill() {
    if (!generatedBill) return
    try {
      const res = await fetch(`/api/bills/${generatedBill.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      })
      if (!res.ok) throw new Error("Failed to cancel bill")
      toast.success("Bill cancelled")
      clearCart()
      setCancelDialog(false)
    } catch (error: any) {
      toast.error(error.message || "Failed to cancel bill")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col lg:flex-row overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden border-r">
        <div className="p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedCategory} onValueChange={(v) => v && setSelectedCategory(v)}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Items</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <ScrollArea className="flex-1 p-4">
          <AnimatePresence mode="popLayout">
            {filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold">No products found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Try a different search term or category
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
                {filteredProducts.map((product, i) => (
                  <motion.button
                    key={product.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.15, delay: i * 0.01 }}
                    onClick={() => addToCart(product)}
                    className="group relative flex flex-col items-center justify-center p-4 rounded-xl border bg-card hover:bg-accent hover:border-primary/50 hover:shadow-md transition-all cursor-pointer text-center"
                  >
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2 group-hover:bg-primary/20 transition-colors">
                      <IndianRupee className="h-5 w-5 text-primary" />
                    </div>
                    <p className="text-sm font-medium leading-tight line-clamp-2">
                      {product.name}
                    </p>
                    <p className="text-sm font-bold text-primary mt-1">
                      {formatINR(parseFloat(product.price))}
                    </p>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Badge variant="secondary" className="h-6 w-6 p-0 flex items-center justify-center rounded-full">
                        <Plus className="h-3 w-3" />
                      </Badge>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </AnimatePresence>
        </ScrollArea>
      </div>

      <div className="w-full lg:w-[420px] xl:w-[480px] flex flex-col bg-background border-t lg:border-t-0">
        <div className="p-4 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">
                {generatedBill ? `Bill #${generatedBill.billNo}` : "New Bill"}
              </h2>
            </div>
            {!generatedBill && cart.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearCart}>
                <X className="h-4 w-4 mr-1" /> Clear
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {format(new Date(), "dd MMM yyyy, hh:mm a")}
          </p>
        </div>

        {generatedBill ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
            >
              <div className="rounded-full bg-emerald-100 dark:bg-emerald-950 p-4 mb-4">
                <Receipt className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
              </div>
            </motion.div>
            <h3 className="text-xl font-bold">Bill Generated</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Bill #{generatedBill.billNo}
            </p>
            <p className="text-3xl font-bold mt-4">{formatINR(total)}</p>
            <div className="flex gap-3 mt-6 w-full max-w-xs">
              <Button className="flex-1" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" /> Print
              </Button>
              <Button variant="outline" className="flex-1" onClick={clearCart}>
                New Bill
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="mt-4 text-destructive"
              onClick={() => setCancelDialog(true)}
            >
              <X className="h-4 w-4 mr-1" /> Cancel Bill
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12 px-4">
                  <div className="rounded-full bg-muted p-4 mb-4">
                    <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold">Cart is empty</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Click on products to add them
                  </p>
                </div>
              ) : (
                <div className="p-4 space-y-2">
                  {cart.map((item) => (
                    <motion.div
                      key={item.productId}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {item.productName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatINR(item.unitPrice)} ea
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.productId, -1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm font-medium tabular-nums">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.productId, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-sm font-semibold w-20 text-right tabular-nums">
                        {formatINR(item.total)}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => removeFromCart(item.productId)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </motion.div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {cart.length > 0 && (
              <div className="border-t p-4 space-y-4 bg-muted/20">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="tabular-nums">{formatINR(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={taxPercent}
                        onChange={(e) => setTaxPercent(parseInt(e.target.value) || 0)}
                        className="h-7 w-16 text-xs text-right"
                      />
                      <span className="text-xs text-muted-foreground">%</span>
                      <span className="tabular-nums w-20 text-right">
                        {formatINR(taxAmount)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Discount</span>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={discount}
                        onChange={(e) => setDiscount(parseInt(e.target.value) || 0)}
                        className="h-7 w-16 text-xs text-right"
                      />
                      <span className="text-xs text-muted-foreground">%</span>
                      <span className="tabular-nums w-20 text-right text-destructive">
                        -{formatINR(discountAmount)}
                      </span>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-base font-bold">
                    <span>Total</span>
                    <span className="tabular-nums">{formatINR(total)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Payment Mode</Label>
                  <Select value={paymentMode} onValueChange={(v) => v && setPaymentMode(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="GPAY">GPay</SelectItem>
                      <SelectItem value="SPLIT">Split</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {paymentMode === "SPLIT" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Cash Amount</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0"
                        value={cashAmount}
                        onChange={(e) => setCashAmount(e.target.value)}
                        className={cn(splitError && "border-destructive")}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">GPay Amount</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0"
                        value={gpayAmount}
                        onChange={(e) => setGpayAmount(e.target.value)}
                        className={cn(splitError && "border-destructive")}
                      />
                    </div>
                    {splitError && (
                      <p className="text-xs text-destructive col-span-2">
                        Split amounts must equal {formatINR(total)}
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Customer (optional)</Label>
                  <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
                    <PopoverTrigger className="w-full justify-between flex items-center gap-2 rounded-lg border border-input bg-transparent px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors">
                      {selectedCustomer
                        ? `${selectedCustomer.name} (${selectedCustomer.phone})`
                        : "Select customer..."}
                      <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                      <Command>
                        <CommandInput
                          placeholder="Search customer..."
                          value={customerSearch}
                          onValueChange={setCustomerSearch}
                        />
                        <CommandList>
                          <CommandEmpty>No customer found</CommandEmpty>
                          <CommandGroup>
                            {customers
                              .filter(
                                (c) =>
                                  c.name
                                    .toLowerCase()
                                    .includes(customerSearch.toLowerCase()) ||
                                  c.phone.includes(customerSearch)
                              )
                              .map((customer) => (
                                <CommandItem
                                  key={customer.id}
                                  value={customer.id}
                                  onSelect={() => {
                                    setSelectedCustomer(customer)
                                    setCustomerOpen(false)
                                  }}
                                >
                                  <User className="h-4 w-4 mr-2" />
                                  <div>
                                    <p>{customer.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {customer.phone}
                                    </p>
                                  </div>
                                </CommandItem>
                              ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {selectedCustomer && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={() => setSelectedCustomer(null)}
                    >
                      <X className="h-3 w-3 mr-1" /> Clear
                    </Button>
                  )}
                </div>

                <Button
                  className="w-full h-12 text-base font-semibold"
                  onClick={handleGenerateBill}
                  disabled={submitting || cart.length === 0}
                >
                  {submitting && <Loader2 className="h-5 w-5 mr-2 animate-spin" />}
                  <Receipt className="h-5 w-5 mr-2" />
                  Generate Bill
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <Dialog open={cancelDialog} onOpenChange={setCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Bill</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel bill #{generatedBill?.billNo}?
              This will mark the bill as cancelled.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialog(false)}>
              Keep Bill
            </Button>
            <Button variant="destructive" onClick={handleCancelBill}>
              Cancel Bill
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
