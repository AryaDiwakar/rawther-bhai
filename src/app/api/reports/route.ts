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
    const type = searchParams.get("type") || "sales"
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")
    const productId = searchParams.get("productId")
    const customerId = searchParams.get("customerId")
    const vendorId = searchParams.get("vendorId")
    const categoryId = searchParams.get("categoryId")

    const from = dateFrom ? startOfDay(parseISO(dateFrom)) : startOfDay(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
    const to = dateTo ? endOfDay(parseISO(dateTo)) : endOfDay(new Date())

    const baseDateFilter = {
      gte: from,
      lte: to,
    }

    switch (type) {
      case "sales": {
        const where: Record<string, unknown> = {
          createdAt: baseDateFilter,
          status: "ACTIVE",
        }
        if (customerId) where.customerId = customerId
        if (productId) {
          where.items = { some: { productId } }
        }

        const bills = await prisma.bill.findMany({
          where: where as any,
          include: {
            items: true,
            customer: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
        })

        const cashTotal = bills
          .filter((b) => b.paymentMode === "CASH")
          .reduce((s, b) => s + Number(b.total), 0)
        const gpayTotal = bills
          .filter((b) => b.paymentMode === "GPAY")
          .reduce((s, b) => s + Number(b.total), 0)
        const cardTotal = bills
          .filter((b) => b.paymentMode === "CARD")
          .reduce((s, b) => s + Number(b.total), 0)
        const splitTotal = bills
          .filter((b) => b.paymentMode === "SPLIT")
          .reduce((s, b) => s + Number(b.total), 0)
        const totalRevenue = bills.reduce((s, b) => s + Number(b.total), 0)
        const totalItems = bills.reduce((s, b) => s + b.items.reduce((si, i) => si + i.quantity, 0), 0)

        return apiSuccess({
          type: "sales",
          summary: {
            totalBills: bills.length,
            totalRevenue,
            totalItems,
            cashTotal,
            gpayTotal,
            cardTotal,
            splitTotal,
            averageBill: bills.length > 0 ? totalRevenue / bills.length : 0,
          },
          bills: bills.map((b) => ({
            id: b.id,
            billNo: b.billNo,
            customerName: b.customer?.name || "Walk-in",
            total: b.total,
            paymentMode: b.paymentMode,
            items: b.items.length,
            createdAt: b.createdAt,
          })),
          dateRange: { from, to },
        })
      }

      case "expense": {
        const where: Record<string, unknown> = {
          date: baseDateFilter,
        }
        if (vendorId) where.vendorId = vendorId
        if (categoryId) where.expenseCategoryId = categoryId

        const expenses = await prisma.expense.findMany({
          where: where as any,
          include: {
            category: { select: { id: true, name: true } },
            vendor: { select: { id: true, name: true } },
          },
          orderBy: { date: "desc" },
        })

        const categoryBreakdown = new Map<string, { category: string; total: number; count: number }>()
        for (const exp of expenses) {
          const cat = exp.category.name
          const entry = categoryBreakdown.get(cat) || { category: cat, total: 0, count: 0 }
          entry.total += Number(exp.amount)
          entry.count++
          categoryBreakdown.set(cat, entry)
        }

        const modeBreakdown = { CASH: 0, GPAY: 0, CARD: 0 }
        for (const exp of expenses) {
          const mode = exp.paymentMode as keyof typeof modeBreakdown
          if (mode in modeBreakdown) modeBreakdown[mode] += Number(exp.amount)
        }

        return apiSuccess({
          type: "expense",
          summary: {
            totalExpenses: expenses.reduce((s, e) => s + Number(e.amount), 0),
            totalCount: expenses.length,
            categoryBreakdown: Array.from(categoryBreakdown.values()),
            modeBreakdown,
          },
          expenses: expenses.map((e) => ({
            id: e.id,
            description: e.description,
            amount: e.amount,
            category: e.category.name,
            vendor: e.vendor?.name || null,
            paymentMode: e.paymentMode,
            date: e.date,
          })),
          dateRange: { from, to },
        })
      }

      case "collection": {
        const collections = await prisma.collection.findMany({
          where: { date: baseDateFilter },
          orderBy: { date: "desc" },
        })

        const totalCash = collections.reduce((s, c) => s + Number(c.cashAmount), 0)
        const totalGpay = collections.reduce((s, c) => s + Number(c.gpayAmount), 0)
        const totalAdvance = collections.reduce((s, c) => s + Number(c.advanceAmount), 0)
        const totalBalance = collections.reduce((s, c) => s + Number(c.balanceAmount), 0)

        return apiSuccess({
          type: "collection",
          summary: {
            totalCash,
            totalGpay,
            totalAdvance,
            totalBalance,
            grandTotal: totalCash + totalGpay + totalAdvance + totalBalance,
            totalEntries: collections.length,
          },
          collections: collections.map((c) => ({
            id: c.id,
            date: c.date,
            cashAmount: c.cashAmount,
            gpayAmount: c.gpayAmount,
            advanceAmount: c.advanceAmount,
            balanceAmount: c.balanceAmount,
            notes: c.notes,
          })),
          dateRange: { from, to },
        })
      }

      case "profit-loss": {
        const bills = await prisma.bill.findMany({
          where: {
            createdAt: baseDateFilter,
            status: "ACTIVE",
          },
          select: { total: true, paymentMode: true, createdAt: true },
        })

        const expenses = await prisma.expense.findMany({
          where: { date: baseDateFilter },
          select: { amount: true, date: true, category: { select: { name: true } } },
        })

        const totalRevenue = bills.reduce((s, b) => s + Number(b.total), 0)
        const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0)
        const netProfit = totalRevenue - totalExpenses

        const dailyMap = new Map<string, { revenue: number; expense: number }>()
        for (const bill of bills) {
          const day = bill.createdAt.toISOString().split("T")[0]
          const entry = dailyMap.get(day) || { revenue: 0, expense: 0 }
          entry.revenue += Number(bill.total)
          dailyMap.set(day, entry)
        }
        for (const exp of expenses) {
          const day = exp.date.toISOString().split("T")[0]
          const entry = dailyMap.get(day) || { revenue: 0, expense: 0 }
          entry.expense += Number(exp.amount)
          dailyMap.set(day, entry)
        }

        return apiSuccess({
          type: "profit-loss",
          summary: {
            totalRevenue,
            totalExpenses,
            netProfit,
            profitMargin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0,
          },
          dailyData: Array.from(dailyMap.entries())
            .map(([date, data]) => ({ date, ...data }))
            .sort((a, b) => a.date.localeCompare(b.date)),
          dateRange: { from, to },
        })
      }

      default:
        return apiError("Invalid report type")
    }
  } catch (error) {
    return handleApiError(error)
  }
}
