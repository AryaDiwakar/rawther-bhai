import { NextRequest } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { apiSuccess, apiError, handleApiError } from "@/lib/utils/api"
import { getCurrentUser } from "@/lib/auth/middleware"
import { startOfDay, endOfDay, parseISO } from "date-fns"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return apiError("Unauthorized", 401)

    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get("date")
    const summaryOnly = searchParams.get("summary") === "true"
    const listAll = searchParams.get("list") === "true"

    if (listAll) {
      const closings = await prisma.dailyClosing.findMany({
        orderBy: { date: "desc" },
        select: {
          id: true,
          date: true,
          totalSales: true,
          totalExpenses: true,
          cashCollection: true,
          gpayCollection: true,
          excess: true,
          shortage: true,
          closedBy: true,
          createdAt: true,
        },
      })
      return apiSuccess(closings)
    }

    const targetDate = dateParam ? parseISO(dateParam) : new Date()
    const dayStart = startOfDay(targetDate)
    const dayEnd = endOfDay(targetDate)

    const existingClosing = await prisma.dailyClosing.findFirst({
      where: {
        date: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
    })

    if (existingClosing && !summaryOnly) {
      return apiSuccess({
        closing: existingClosing,
        hasClosing: true,
      })
    }

    const [bills, orders, collections, expenses] = await Promise.all([
      prisma.bill.findMany({
        where: {
          createdAt: { gte: dayStart, lte: dayEnd },
          status: "ACTIVE",
        },
        include: {
          items: true,
        },
      }),
      prisma.order.findMany({
        where: {
          createdAt: { gte: dayStart, lte: dayEnd },
        },
        include: {
          payments: true,
        },
      }),
      prisma.collection.findFirst({
        where: {
          date: { gte: dayStart, lte: dayEnd },
        },
      }),
      prisma.expense.findMany({
        where: {
          date: { gte: dayStart, lte: dayEnd },
        },
        include: {
          category: {
            select: { id: true, name: true },
          },
        },
      }),
    ])

    const productSummaryMap = new Map<string, { productName: string; quantity: number; total: number }>()
    for (const bill of bills) {
      for (const item of bill.items) {
        const key = item.productName
        const existing = productSummaryMap.get(key) || { productName: key, quantity: 0, total: 0 }
        existing.quantity += item.quantity
        existing.total += Number(item.total)
        productSummaryMap.set(key, existing)
      }
    }

    const totalSales = bills.reduce((sum, b) => sum + Number(b.total), 0)
    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0)
    const cashCollection = bills
      .filter((b) => b.paymentMode === "CASH")
      .reduce((sum, b) => sum + Number(b.total), 0)
    const gpayCollection = bills
      .filter((b) => b.paymentMode === "GPAY")
      .reduce((sum, b) => sum + Number(b.total), 0)

    const collectionCash = collections ? Number(collections.cashAmount) : 0
    const collectionGpay = collections ? Number(collections.gpayAmount) : 0
    const collectionAdvance = collections ? Number(collections.advanceAmount) : 0
    const collectionBalance = collections ? Number(collections.balanceAmount) : 0

    const expenseCategoryMap = new Map<string, { category: string; total: number; count: number }>()
    for (const expense of expenses) {
      const cat = expense.category.name
      const existing = expenseCategoryMap.get(cat) || { category: cat, total: 0, count: 0 }
      existing.total += Number(expense.amount)
      existing.count++
      expenseCategoryMap.set(cat, existing)
    }

    const summary = {
      totalSales,
      totalExpenses,
      cashCollection,
      gpayCollection,
      collectionCash,
      collectionGpay,
      collectionAdvance,
      collectionBalance,
      productSummary: Array.from(productSummaryMap.values()),
      orderSummary: {
        total: orders.length,
        totalValue: orders.reduce((sum, o) => sum + Number(o.totalAmount), 0),
        orders: orders.map((o) => ({
          id: o.id,
          orderNo: o.orderNo,
          status: o.status,
          totalAmount: o.totalAmount,
        })),
      },
      collectionSummary: {
        cash: collectionCash,
        gpay: collectionGpay,
        advance: collectionAdvance,
        balance: collectionBalance,
      },
      expenseSummary: {
        total: totalExpenses,
        categories: Array.from(expenseCategoryMap.values()),
      },
    }

    if (existingClosing) {
      return apiSuccess({ closing: existingClosing, hasClosing: true })
    }

    return apiSuccess({ summary, hasClosing: false })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return apiError("Unauthorized", 401)

    const body = await request.json()
    const {
      date,
      totalSales,
      totalExpenses,
      cashCollection,
      gpayCollection,
      productSummary,
      orderSummary,
      collectionSummary,
      expenseSummary,
      excess,
      shortage,
      remarks,
    } = body

    if (totalSales === undefined || totalExpenses === undefined) {
      return apiError("Total sales and total expenses are required")
    }

    const targetDate = date ? startOfDay(parseISO(date)) : startOfDay(new Date())

    const existingClosing = await prisma.dailyClosing.findFirst({
      where: {
        date: targetDate,
      },
    })

    if (existingClosing) {
      const updated = await prisma.dailyClosing.update({
        where: { id: existingClosing.id },
        data: {
          totalSales,
          totalExpenses,
          cashCollection: cashCollection ?? 0,
          gpayCollection: gpayCollection ?? 0,
          productSummary: productSummary ?? [],
          orderSummary: orderSummary ?? {},
          collectionSummary: collectionSummary ?? {},
          expenseSummary: expenseSummary ?? {},
          excess: excess ?? 0,
          shortage: shortage ?? 0,
          remarks: remarks ?? null,
          closedBy: user.id,
        },
      })
      return apiSuccess(updated, "Daily closing updated successfully")
    }

    const closing = await prisma.dailyClosing.create({
      data: {
        date: targetDate,
        totalSales,
        totalExpenses,
        cashCollection: cashCollection ?? 0,
        gpayCollection: gpayCollection ?? 0,
        productSummary: productSummary ?? [],
        orderSummary: orderSummary ?? {},
        collectionSummary: collectionSummary ?? {},
        expenseSummary: expenseSummary ?? {},
        excess: excess ?? 0,
        shortage: shortage ?? 0,
        remarks: remarks ?? null,
        closedBy: user.id,
      },
    })

    return apiSuccess(closing, "Daily closing saved successfully")
  } catch (error) {
    return handleApiError(error)
  }
}
