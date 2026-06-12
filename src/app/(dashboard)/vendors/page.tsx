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
  Phone,
  Mail,
  MapPin,
  IndianRupee,
  Truck,
  Wallet,
  CheckCircle2,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  AlertTriangle,
  Loader2,
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

interface Vendor {
  id: string
  name: string
  phone: string
  email: string | null
  address: string | null
  outstandingBalance: number
  lastSettlementDate: string | null
}

interface Pagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

interface Summary {
  totalVendors: number
  totalOutstanding: number
  totalSettled: number
}

function formatINR(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value)
}

export default function VendorsPage() {
  const router = useRouter()
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [summary, setSummary] = useState<Summary>({
    totalVendors: 0,
    totalOutstanding: 0,
    totalSettled: 0,
  })
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [outstandingFilter, setOutstandingFilter] = useState("")
  const [sorting, setSorting] = useState<SortingState>([])
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [page, setPage] = useState(1)

  const fetchVendors = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("page", page.toString())
      params.set("pageSize", "10")
      if (search) params.set("search", search)
      if (outstandingFilter) params.set("outstanding", outstandingFilter)

      const res = await fetch(`/api/vendors?${params}`)
      if (!res.ok) throw new Error("Failed to fetch")
      const data = await res.json()
      setVendors(data.data)
      setPagination(data.pagination)
      setSummary(data.summary)
    } catch {
      toast.error("Failed to load vendors")
    } finally {
      setLoading(false)
    }
  }, [page, search, outstandingFilter])

  useEffect(() => {
    fetchVendors()
  }, [fetchVendors])

  const clearFilters = () => {
    setSearch("")
    setOutstandingFilter("")
    setPage(1)
  }

  const handleDelete = async (id: string) => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/vendors/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
      toast.success("Vendor deleted successfully")
      setDeleteDialog(null)
      fetchVendors()
    } catch {
      toast.error("Failed to delete vendor")
    } finally {
      setDeleting(false)
    }
  }

  const columns = useMemo<ColumnDef<Vendor>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <button className="flex items-center gap-1" onClick={() => column.toggleSorting()}>
            Name
            <ArrowUpDown className="size-3" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
              {row.original.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-medium">{row.original.name}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Phone className="size-3" />
                {row.original.phone}
              </p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "outstandingBalance",
        header: ({ column }) => (
          <button className="flex items-center gap-1" onClick={() => column.toggleSorting()}>
            Outstanding
            <ArrowUpDown className="size-3" />
          </button>
        ),
        cell: ({ row }) => {
          const balance = Number(row.original.outstandingBalance)
          return (
            <span
              className={`font-medium tabular-nums ${
                balance > 0 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"
              }`}
            >
              {formatINR(balance)}
            </span>
          )
        },
      },
      {
        accessorKey: "totalSettled",
        header: "Total Settled",
        cell: ({ row }) => (
          <span className="tabular-nums text-muted-foreground">
            {formatINR(0)}
          </span>
        ),
      },
      {
        id: "lastSettlement",
        header: "Last Settlement",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.lastSettlementDate
              ? format(new Date(row.original.lastSettlementDate), "dd MMM yyyy")
              : "—"}
          </span>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => {
          const balance = Number(row.original.outstandingBalance)
          return balance > 0 ? (
            <Badge variant="outline" className="border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400">
              <AlertTriangle className="size-3 mr-1" />
              Outstanding
            </Badge>
          ) : (
            <Badge variant="outline" className="border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="size-3 mr-1" />
              Settled
            </Badge>
          )
        },
      },
      {
        id: "actions",
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-lg size-7 hover:bg-muted hover:text-foreground transition-colors">
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/vendors/${row.original.id}`)}>
                <Eye className="size-3.5" />
                View
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
    data: vendors,
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

  const hasFilters = search || outstandingFilter

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Vendors</h1>
          <p className="text-sm text-muted-foreground">
            Manage your vendors and track outstanding balances
          </p>
        </div>
        <Link href="/vendors/new">
          <Button>
            <Plus className="size-4" />
            Add Vendor
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Vendors</CardTitle>
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <Truck className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              {loading ? <Skeleton className="h-7 w-16" /> : summary.totalVendors}
            </div>
            <p className="text-xs text-muted-foreground">Registered vendors</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
            <div className="rounded-lg bg-amber-500/10 p-2 text-amber-600">
              <IndianRupee className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-400">
              {loading ? (
                <Skeleton className="h-7 w-28" />
              ) : (
                formatINR(summary.totalOutstanding)
              )}
            </div>
            <p className="text-xs text-muted-foreground">Across all vendors</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Settled</CardTitle>
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-600">
              <Wallet className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              {loading ? (
                <Skeleton className="h-7 w-28" />
              ) : (
                formatINR(summary.totalSettled)
              )}
            </div>
            <p className="text-xs text-muted-foreground">Total settled amount</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Vendors</CardTitle>
            <CardDescription>
              {pagination.total > 0
                ? `${pagination.total} vendor${pagination.total !== 1 ? "s" : ""} found`
                : ""}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or phone..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="pl-8"
              />
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={outstandingFilter}
                onValueChange={(v) => {
                  if (v) {
                    setOutstandingFilter(v)
                    setPage(1)
                  }
                }}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="All vendors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All vendors</SelectItem>
                  <SelectItem value="yes">With Outstanding</SelectItem>
                  <SelectItem value="no">Settled</SelectItem>
                </SelectContent>
              </Select>
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="size-3.5" />
                  Clear
                </Button>
              )}
            </div>
          </div>

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
                      {Array.from({ length: 6 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-[80%]" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : vendors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="rounded-full bg-muted p-4">
                          <Truck className="size-8 text-muted-foreground" />
                        </div>
                        <p className="font-medium">No vendors yet</p>
                        <p className="text-sm text-muted-foreground">
                          {hasFilters
                            ? "Try adjusting your filters"
                            : "Add your first vendor to get started"}
                        </p>
                        {!hasFilters && (
                          <Link href="/vendors/new">
                            <Button variant="outline" size="sm" className="mt-2">
                              <Plus className="size-3.5" />
                              Add Vendor
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
                      onClick={() => router.push(`/vendors/${row.original.id}`)}
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
            <DialogTitle>Delete Vendor</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this vendor? This action cannot be undone.
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
