"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Users,
  Plus,
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  IndianRupee,
  UserCheck,
  MoreHorizontal,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  Trophy,
  Award,
  Medal,
} from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency, formatDate, getInitials } from "@/lib/utils/format"

interface Customer {
  id: string
  name: string
  phone: string
  email: string | null
  visitCount: number
  totalSpent: number
  lastVisit: string | null
  createdAt: string
}

interface TopCustomer {
  id: string
  name: string
  phone: string
  visitCount: number
  totalSpent: number
}

const rankIcons = [Trophy, Award, Medal]

function CustomerSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-8 w-full mb-4" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full mb-2" />
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-muted">
        <Users className="size-8 text-muted-foreground" />
      </div>
      <h3 className="mb-1 text-lg font-semibold">No customers yet</h3>
      <p className="mb-6 max-w-sm text-sm text-muted-foreground">
        Start adding customers to track their purchases, visits, and preferences.
      </p>
                      <Link href="/customers/new">
                        <Button>
                          <Plus className="size-4" />
                          Add Customer
                        </Button>
                      </Link>
    </div>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-destructive/10">
        <Users className="size-8 text-destructive" />
      </div>
      <h3 className="mb-1 text-lg font-semibold">Failed to load customers</h3>
      <p className="mb-6 max-w-sm text-sm text-muted-foreground">{message}</p>
      <Button variant="outline" onClick={onRetry}>
        Try Again
      </Button>
    </div>
  )
}

export default function CustomersPage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState("visitCount")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams({
        search,
        sortBy,
        sortOrder,
        page: String(page),
        pageSize: "10",
      })
      const res = await fetch(`/api/customers?${params}`)
      const data = await res.json()
      if (!data.success) throw new Error(data.message)
      setCustomers(data.data.customers)
      setTotalPages(data.data.pagination.totalPages)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load customers")
    } finally {
      setLoading(false)
    }
  }, [search, sortBy, sortOrder, page])

  const fetchTopCustomers = useCallback(async () => {
    try {
      const res = await fetch("/api/customers?top=true")
      const data = await res.json()
      if (data.success) {
        setTopCustomers(data.data)
      }
    } catch {
      // Non-critical
    }
  }, [])

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  useEffect(() => {
    fetchTopCustomers()
  }, [fetchTopCustomers])

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))
    } else {
      setSortBy(field)
      setSortOrder("desc")
    }
    setPage(1)
  }

  const totalCustomers = useMemo(
    () => topCustomers.reduce((sum, c) => Math.max(sum, c.visitCount), 0),
    [topCustomers]
  )
  const totalRevenue = useMemo(
    () => customers.reduce((sum, c) => sum + Number(c.totalSpent), 0),
    [customers]
  )
  const averageSpend = useMemo(
    () => (customers.length > 0 ? totalRevenue / customers.length : 0),
    [customers, totalRevenue]
  )

  if (loading && customers.length === 0) return <CustomerSkeleton />
  if (error && customers.length === 0) return <ErrorState message={error} onRetry={fetchCustomers} />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
          <p className="text-sm text-muted-foreground">Manage and view customer information</p>
        </div>
        <Link href="/customers/new">
          <Button>
            <Plus className="size-4" />
            Add Customer
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
              <Users className="size-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Skeleton className="h-8 w-20" /> : customers.length + (totalPages > 1 ? "..." : "")}
            </div>
            <p className="text-xs text-muted-foreground">Registered customers</p>
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
            <div className="text-2xl font-bold">
              {loading ? <Skeleton className="h-8 w-28" /> : formatCurrency(totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">From all customers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Average Spend</CardTitle>
            <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10">
              <TrendingUp className="size-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Skeleton className="h-8 w-28" /> : formatCurrency(averageSpend)}
            </div>
            <p className="text-xs text-muted-foreground">Per customer average</p>
          </CardContent>
        </Card>
      </div>

      {topCustomers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Sparkles className="size-4 text-amber-500" />
              Top Customers
            </CardTitle>
            <CardDescription>Highest spending customers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {topCustomers.slice(0, 5).map((customer, index) => {
                const RankIcon = rankIcons[index] || Medal
                const colors = [
                  "text-amber-500",
                  "text-slate-400",
                  "text-orange-700",
                  "text-muted-foreground",
                  "text-muted-foreground",
                ]
                return (
                  <Link
                    key={customer.id}
                    href={`/customers/${customer.id}`}
                    className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex size-8 items-center justify-center rounded-full bg-muted">
                      <RankIcon className={`size-4 ${colors[index]}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{customer.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(Number(customer.totalSpent))}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
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
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {customers.length === 0 && !loading ? (
            <EmptyState />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>
                    <button
                      onClick={() => toggleSort("visitCount")}
                      className="inline-flex items-center gap-1 hover:text-foreground"
                    >
                      Visits
                      <ArrowUpDown className="size-3" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      onClick={() => toggleSort("totalSpent")}
                      className="inline-flex items-center gap-1 hover:text-foreground"
                    >
                      Total Spent
                      <ArrowUpDown className="size-3" />
                    </button>
                  </TableHead>
                  <TableHead>Last Visit</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-8" /></TableCell>
                    </TableRow>
                  ))
                ) : (
                  customers.map((customer) => (
                    <TableRow
                      key={customer.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/customers/${customer.id}`)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar size="sm">
                            <AvatarFallback>{getInitials(customer.name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{customer.name}</p>
                            {customer.email && (
                              <p className="text-xs text-muted-foreground">{customer.email}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Phone className="size-3" />
                          {customer.phone}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-mono">
                          {customer.visitCount}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(Number(customer.totalSpent))}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {customer.lastVisit ? formatDate(new Date(customer.lastVisit)) : "N/A"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/customers/${customer.id}`)
                          }}
                        >
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="size-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
