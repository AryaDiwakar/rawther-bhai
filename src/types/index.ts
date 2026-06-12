export enum Role {
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  STAFF = "STAFF",
}

export enum ProductStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  DISCONTINUED = "DISCONTINUED",
}

export enum PaymentMode {
  CASH = "CASH",
  CARD = "CARD",
  UPI = "UPI",
  CREDIT = "CREDIT",
  BANK_TRANSFER = "BANK_TRANSFER",
  OTHER = "OTHER",
}

export enum BillStatus {
  PAID = "PAID",
  UNPAID = "UNPAID",
  PARTIALLY_PAID = "PARTIALLY_PAID",
  CANCELLED = "CANCELLED",
  REFUNDED = "REFUNDED",
}

export enum OrderStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  PREPARING = "PREPARING",
  READY = "READY",
  DELIVERED = "DELIVERED",
  CANCELLED = "CANCELLED",
}

export enum PaymentType {
  INCOME = "INCOME",
  EXPENSE = "EXPENSE",
}

export enum AdjustmentType {
  ADDITION = "ADDITION",
  DEDUCTION = "DEDUCTION",
}

export interface DashboardStats {
  totalRevenue: number
  totalExpenses: number
  netIncome: number
  pendingOrders: number
  activeBills: number
  totalCustomers: number
  revenueGrowth: number
  expenseGrowth: number
  incomeGrowth: number
}

export interface ChartDataPoint {
  date: string
  value: number
  label?: string
}

export interface RevenueExpenseChartData {
  date: string
  revenue: number
  expense: number
}

export interface CategoryChartData {
  name: string
  value: number
  percentage: number
}

export interface TableFilters {
  search: string
  dateFrom?: string
  dateTo?: string
  status?: string
  sortBy?: string
  sortOrder?: "asc" | "desc"
}

export interface Pagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: Pagination
}
