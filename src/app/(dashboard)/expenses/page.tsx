"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table"
import {
  Plus,
  Search,
  ArrowUpDown,
  Eye,
  Pencil,
  Trash2,
  Receipt,
  IndianRupee,
  TrendingUp,
  Filter,
  X,
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MoreHorizontal,
} from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import { motion } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ExpenseCharts } from "./_components/expense-charts"

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
  category: { id: string; name: string }
  vendor: { id: string; name: string } | null
}

interface Pagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

interface CategoryWiseData {
  categoryId: string
  categoryName: string
  total: number
  count: number
}

interface MonthlyTrendData {
  month: string
  total: number
}

function formatINR(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value)
}

const PAYMENT_MODE_LABELS: Record<string, string> = {
  CASH: "Cash",
  GPAY: "GPay",
  CARD: "Card",
}

const PAYMENT_MODE_COLORS: Record<string, string> = {
  CASH: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  GPAY: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  CARD: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
}

export default function ExpensesPage() {
  const router = useRouter()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [vendorId, setVendorId] = useState("")
  const [paymentMode, setPaymentMode] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [sorting, setSorting] = useState<SortingState>([])
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [analytics, setAnalytics] = useState<{
    categoryWise: CategoryWiseData[]
    monthlyTrend: MonthlyTrendData[]
    currentMonthTotal: number
  } | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [page, setPage] = useState(1)

  const fetchExpenses = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("page", page.toString())
      params.set("pageSize", "10")
      if (search) params.set("search", search)
      if (categoryId) params.set("categoryId", categoryId)
      if (vendorId) params.set("vendorId", vendorId)
      if (paymentMode) params.set("paymentMode", paymentMode)
      if (dateFrom) params.set("dateFrom", dateFrom)
      if (dateTo) params.set("dateTo", dateTo)

      const res = await fetch(`/api/expenses?${params}`)
      if (!res.ok) throw new Error("Failed to fetch")
      const data = await res.json()
      setExpenses(data.data)
      setPagination(data.pagination)
    } catch {
      toast.error("Failed to load expenses")
    } finally {
      setLoading(false)
    }
  }, [page, search, categoryId, vendorId, paymentMode, dateFrom, dateTo])

  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("type", "analytics")
      if (dateFrom) params.set("dateFrom", dateFrom)
      if (dateTo) params.set("dateTo", dateTo)

      const res = await fetch(`/api/expenses?${params}`)
      if (!res.ok) throw new Error("Failed to fetch analytics")
      const data = await res.json()
      setAnalytics(data)
    } catch {
      // silent fail for analytics
    } finally {
      setAnalyticsLoading(false)
    }
  }, [dateFrom, dateTo])

  const fetchFilters = useCallback(async () => {
    try {
      const [catRes, venRes] = await Promise.all([
        fetch("/api/expense-categories"),
        fetch("/api/vendors?pageSize=100"),
      ])
      if (catRes.ok) setCategories(await catRes.json())
      if (venRes.ok) {
        const venData = await venRes.json()
        setVendors(venData.data)
      }
    } catch {
      // silent
    }
  }, [])

  useEffect(() => {
    fetchFilters()
  }, [fetchFilters])

  useEffect(() => {
    fetchExpenses()
  }, [fetchExpenses])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  const clearFilters = () => {
    setSearch("")
    setCategoryId("")
    setVendorId("")
    setPaymentMode("")
    setDateFrom("")
    setDateTo("")
    setPage(1)
  }

  const handleDelete = async (id: string) => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
      toast.success("Expense deleted successfully")
      setDeleteDialog(null)
      fetchExpenses()
      fetchAnalytics()
    } catch {
      toast.error("Failed to delete expense")
    } finally {
      setDeleting(false)
    }
  }

  const columns = useMemo<ColumnDef<Expense>[]>(
    () => [
      {
        accessorKey: "date",
        header: ({ column }) => (
          <button
            className="flex items-center gap-1"
            onClick={() => column.toggleSorting()}
          >
            Date
            <ArrowUpDown className="size-3" />
          </button>
        ),
        cell: ({ row }) => format(new Date(row.original.date), "dd MMM yyyy"),
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) => (
          <span className="max-w-[200px] truncate block">
            {row.original.description}
          </span>
        ),
      },
      {
        accessorKey: "category.name",
        header: "Category",
        cell: ({ row }) => (
          <Badge variant="outline" className="font-normal">
            {row.original.category.name}
          </Badge>
        ),
      },
      {
        accessorKey: "amount",
        header: ({ column }) => (
          <button
            className="flex items-center gap-1"
            onClick={() => column.toggleSorting()}
          >
            Amount
            <ArrowUpDown className="size-3" />
          </button>
        ),
        cell: ({ row }) => (
          <span className="font-medium tabular-nums">
            {formatINR(Number(row.original.amount))}
          </span>
        ),
      },
      {
        accessorKey: "paymentMode",
        header: "Payment Mode",
        cell: ({ row }) => {
          const mode = row.original.paymentMode
          return (
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                PAYMENT_MODE_COLORS[mode] || ""
              }`}
            >
              {PAYMENT_MODE_LABELS[mode] || mode}
            </span>
          )
        },
      },
      {
        accessorKey: "vendor.name",
        header: "Vendor",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.vendor?.name || "—"}
          </span>
        ),
      },
      {
        id: "actions",
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/expenses/${row.original.id}`)}>
                <Eye className="size-3.5" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/expenses/${row.original.id}?edit=true`)}>
                <Pencil className="size-3.5" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setDeleteDialog(row.original.id)}
              >
                <Trash2 className="size-3.5" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [router]
  )

  const table = useReactTable({
    data: expenses,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    pageCount: pagination.totalPages,
  })

  const hasFilters = search || categoryId || vendorId || paymentMode || dateFrom || dateTo

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Expenses</h1>
          <p className="text-sm text-muted-foreground">
            Track and manage your business expenses
          </p>
        </div>
        <Link href="/expenses/new">
          <Button>
            <Plus className="size-4" />
            Add Expense
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <IndianRupee className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              {analyticsLoading ? (
                <Skeleton className="h-7 w-28" />
              ) : (
                formatINR(analytics?.currentMonthTotal || 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground">Current month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <div className="rounded-lg bg-chart-1/10 p-2 text-chart-1">
              <Filter className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              {analyticsLoading ? (
                <Skeleton className="h-7 w-16" />
              ) : (
                categories.length
              )}
            </div>
            <p className="text-xs text-muted-foreground">Active categories</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <div className="rounded-lg bg-chart-2/10 p-2 text-chart-2">
              <Receipt className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              {loading ? <Skeleton className="h-7 w-16" /> : pagination.total}
            </div>
            <p className="text-xs text-muted-foreground">All time expenses</p>
          </CardContent>
        </Card>
      </div>

      <ExpenseCharts
        categoryWise={analytics?.categoryWise || []}
        monthlyTrend={analytics?.monthlyTrend || []}
        loading={analyticsLoading}
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Expenses</CardTitle>
            <CardDescription>
              {pagination.total > 0
                ? `${pagination.total} expense${pagination.total !== 1 ? "s" : ""} found`
                : ""}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search expenses..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="pl-8"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={hasFilters ? "default" : "outline"}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="size-3.5" />
                Filters
                {hasFilters && (
                  <span className="ml-1 rounded-full bg-primary-foreground/20 px-1.5 text-[10px]">
                    {(!!search ? 1 : 0) + (!!categoryId ? 1 : 0) + (!!vendorId ? 1 : 0) + (!!paymentMode ? 1 : 0) + (!!dateFrom || !!dateTo ? 1 : 0)}
                  </span>
                )}
              </Button>
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="size-3.5" />
                  Clear
                </Button>
              )}
            </div>
          </div>

          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-wrap gap-3 rounded-lg border bg-muted/30 p-3"
            >
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-muted-foreground">Category</label>
                <Select value={categoryId} onValueChange={(v) => { if (v) { setCategoryId(v); setPage(1) } }}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-muted-foreground">Vendor</label>
                <Select value={vendorId} onValueChange={(v) => { if (v) { setVendorId(v); setPage(1) } }}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="All vendors" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All vendors</SelectItem>
                    {vendors.map((v) => (
                      <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-muted-foreground">Payment Mode</label>
                <Select value={paymentMode} onValueChange={(v) => { if (v) { setPaymentMode(v); setPage(1) } }}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="All modes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All modes</SelectItem>
                    {Object.entries(PAYMENT_MODE_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-muted-foreground">From</label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
                  className="w-[140px]"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-muted-foreground">To</label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
                  className="w-[140px]"
                />
              </div>
            </motion.div>
          )}

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((hg) => (
                  <TableRow key={hg.id}>
                    {hg.headers.map((h) => (
                      <TableHead key={h.id}>
                        {h.column.columnDef.header as React.ReactNode}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-[80%]" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : expenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="rounded-full bg-muted p-4">
                          <Receipt className="size-8 text-muted-foreground" />
                        </div>
                        <p className="font-medium">No expenses yet</p>
                        <p className="text-sm text-muted-foreground">
                          {hasFilters
                            ? "Try adjusting your filters"
                            : "Add your first expense to get started"}
                        </p>
                        {!hasFilters && (
                          <Link href="/expenses/new">
                            <Button variant="outline" size="sm" className="mt-2">
                              <Plus className="size-3.5" />
                              Add Expense
                            </Button>
                          </Link>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/expenses/${row.original.id}`)}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {cell.column.columnDef.cell
                            ? (cell.column.columnDef.cell as Function)({
                                row: cell.row,
                                column: cell.column,
                                getValue: cell.getValue,
                              })
                            : cell.renderValue() as React.ReactNode}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {page} of {pagination.totalPages} ({pagination.total} total)
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="size-3.5" />
                </Button>
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum: number
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1
                  } else if (page <= 3) {
                    pageNum = i + 1
                  } else if (page >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i
                  } else {
                    pageNum = page - 2 + i
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === page ? "default" : "outline"}
                      size="sm"
                      className="min-w-[32px]"
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  )
                })}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
                  disabled={page >= pagination.totalPages}
                >
                  <ChevronRight className="size-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Expense</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this expense? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteDialog && handleDelete(deleteDialog)}
              disabled={deleting}
            >
              {deleting && <Loader2 className="size-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
