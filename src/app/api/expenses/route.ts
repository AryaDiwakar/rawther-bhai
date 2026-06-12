import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const pageSize = parseInt(searchParams.get("pageSize") || "10")
    const search = searchParams.get("search") || ""
    const categoryId = searchParams.get("categoryId") || ""
    const vendorId = searchParams.get("vendorId") || ""
    const paymentMode = searchParams.get("paymentMode") || ""
    const dateFrom = searchParams.get("dateFrom") || ""
    const dateTo = searchParams.get("dateTo") || ""
    const type = searchParams.get("type") || "list"

    if (type === "analytics") {
      return handleAnalytics(searchParams)
    }

    const where: Record<string, unknown> = {}

    if (search) {
      where.description = { contains: search, mode: "insensitive" }
    }

    if (categoryId) {
      where.expenseCategoryId = categoryId
    }

    if (vendorId) {
      where.vendorId = vendorId
    }

    if (paymentMode) {
      where.paymentMode = paymentMode
    }

    const dateFilter: Record<string, Date> = {}
    if (dateFrom) dateFilter.gte = new Date(dateFrom)
    if (dateTo) dateFilter.lte = new Date(dateTo)
    if (dateFrom || dateTo) {
      where.date = dateFilter
    }

    const skip = (page - 1) * pageSize

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: {
          category: true,
          vendor: true,
        },
        orderBy: { date: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.expense.count({ where }),
    ])

    return NextResponse.json({
      data: expenses,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    })
  } catch (error) {
    console.error("Error fetching expenses:", error)
    return NextResponse.json(
      { error: "Failed to fetch expenses" },
      { status: 500 }
    )
  }
}

async function handleAnalytics(searchParams: URLSearchParams) {
  const dateFrom = searchParams.get("dateFrom") || ""
  const dateTo = searchParams.get("dateTo") || ""

  const where: Record<string, unknown> = {}

  const dateFilter: Record<string, Date> = {}
  if (dateFrom) dateFilter.gte = new Date(dateFrom)
  if (dateTo) dateFilter.lte = new Date(dateTo)
  if (dateFrom || dateTo) {
    where.date = dateFilter
  }

  // Category-wise totals
  const categoryTotals = await prisma.expense.groupBy({
    by: ["expenseCategoryId"],
    where,
    _sum: { amount: true },
    _count: { id: true },
  })

  const categoryIds = categoryTotals.map((c) => c.expenseCategoryId)
  const categories = await prisma.expenseCategory.findMany({
    where: { id: { in: categoryIds } },
  })

  const categoryMap = new Map(categories.map((c) => [c.id, c.name]))

  const categoryWise = categoryTotals.map((c) => ({
    categoryId: c.expenseCategoryId,
    categoryName: categoryMap.get(c.expenseCategoryId) || "Unknown",
    total: Number(c._sum.amount) || 0,
    count: c._count.id,
  }))

  // Monthly trends (last 6 months)
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const monthlyExpenses = await prisma.expense.findMany({
    where: {
      date: { gte: sixMonthsAgo },
    },
    select: {
      amount: true,
      date: true,
    },
    orderBy: { date: "asc" },
  })

  const monthlyMap = new Map<string, number>()

  for (let i = 0; i < 6; i++) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    monthlyMap.set(key, 0)
  }

  for (const exp of monthlyExpenses) {
    const d = exp.date as Date
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    if (monthlyMap.has(key)) {
      monthlyMap.set(key, monthlyMap.get(key)! + Number(exp.amount))
    }
  }

  const monthlyTrend = Array.from(monthlyMap.entries())
    .map(([month, total]) => ({ month, total }))
    .sort((a, b) => a.month.localeCompare(b.month))

  // Current month total
  const now = new Date()
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const currentMonthTotal = await prisma.expense.aggregate({
    where: {
      date: { gte: currentMonthStart },
    },
    _sum: { amount: true },
  })

  return NextResponse.json({
    categoryWise,
    monthlyTrend,
    currentMonthTotal: Number(currentMonthTotal._sum.amount) || 0,
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { amount, description, expenseCategoryId, vendorId, paymentMode, date } = body

    if (!amount || !description || !expenseCategoryId || !paymentMode || !date) {
      return NextResponse.json(
        { error: "Amount, description, category, payment mode, and date are required" },
        { status: 400 }
      )
    }

    const expense = await prisma.expense.create({
      data: {
        amount: parseFloat(amount),
        description,
        expenseCategoryId,
        vendorId: vendorId || null,
        paymentMode,
        date: new Date(date),
      },
      include: {
        category: true,
        vendor: true,
      },
    })

    return NextResponse.json(expense, { status: 201 })
  } catch (error) {
    console.error("Error creating expense:", error)
    return NextResponse.json(
      { error: "Failed to create expense" },
      { status: 500 }
    )
  }
}
