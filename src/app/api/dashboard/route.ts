import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { auth } from "@/lib/auth/auth"
import {
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  subDays,
  subMonths,
  format,
} from "date-fns"

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()
  const todayStart = startOfDay(now)
  const todayEnd = endOfDay(now)
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  try {
    const [
      todayBills,
      todayExpenses,
      monthBills,
      monthExpenses,
      recentBillsData,
      recentExpensesData,
      topCustomersData,
      productItems,
      upcomingOrdersData,
      pendingVendorsData,
      bills14,
      expenses14,
      comparisonBills,
      comparisonExpenses,
    ] = await Promise.all([
      prisma.bill.findMany({
        where: {
          createdAt: { gte: todayStart, lte: todayEnd },
          status: "ACTIVE",
        },
        select: { total: true, cashAmount: true, gpayAmount: true, paymentMode: true },
      }),

      prisma.expense.findMany({
        where: { date: { gte: todayStart, lte: todayEnd } },
        select: { amount: true },
      }),

      prisma.bill.findMany({
        where: {
          createdAt: { gte: monthStart, lte: monthEnd },
          status: "ACTIVE",
        },
        select: { total: true, cashAmount: true, gpayAmount: true },
      }),

      prisma.expense.findMany({
        where: { date: { gte: monthStart, lte: monthEnd } },
        select: { amount: true },
      }),

      prisma.bill.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        where: { status: { not: "CANCELLED" } },
        select: {
          id: true,
          billNo: true,
          total: true,
          paymentMode: true,
          createdAt: true,
          status: true,
          customer: { select: { name: true } },
        },
      }),

      prisma.expense.findMany({
        take: 5,
        orderBy: { date: "desc" },
        select: {
          id: true,
          description: true,
          amount: true,
          date: true,
          paymentMode: true,
          category: { select: { name: true } },
        },
      }),

      prisma.customer.findMany({
        take: 5,
        orderBy: { totalSpent: "desc" },
        where: { totalSpent: { gt: 0 } },
        select: { id: true, name: true, visitCount: true, totalSpent: true },
      }),

      prisma.billItem.findMany({
        select: {
          productName: true,
          quantity: true,
          total: true,
          product: { select: { category: { select: { name: true } } } },
        },
      }),

      prisma.order.findMany({
        take: 5,
        orderBy: { deliveryDate: "asc" },
        where: { status: "UPCOMING" },
        select: {
          id: true,
          orderNo: true,
          deliveryDate: true,
          advance: true,
          balance: true,
          status: true,
          customer: { select: { name: true } },
        },
      }),

      prisma.vendor.findMany({
        take: 5,
        orderBy: { outstandingBalance: "desc" },
        where: { outstandingBalance: { gt: 0 } },
        select: { id: true, name: true, outstandingBalance: true },
      }),

      prisma.bill.findMany({
        where: {
          createdAt: { gte: startOfDay(subDays(now, 13)) },
          status: "ACTIVE",
        },
        select: { total: true, createdAt: true },
      }),

      prisma.expense.findMany({
        where: { date: { gte: startOfDay(subDays(now, 13)) } },
        select: { amount: true, date: true },
      }),

      prisma.bill.findMany({
        where: {
          createdAt: { gte: startOfMonth(subMonths(now, 5)) },
          status: "ACTIVE",
        },
        select: { total: true, createdAt: true },
      }),

      prisma.expense.findMany({
        where: { date: { gte: startOfMonth(subMonths(now, 5)) } },
        select: { amount: true, date: true },
      }),
    ])

    const todaySales = todayBills.reduce((sum, b) => sum + Number(b.total), 0)
    const todayExpensesTotal = todayExpenses.reduce((sum, e) => sum + Number(e.amount), 0)
    const todayCash = todayBills
      .filter((b) => b.paymentMode === "CASH" || b.paymentMode === "SPLIT")
      .reduce((sum, b) => sum + Number(b.cashAmount), 0)
    const todayGpay = todayBills
      .filter((b) => b.paymentMode === "GPAY" || b.paymentMode === "SPLIT")
      .reduce((sum, b) => sum + Number(b.gpayAmount), 0)

    const monthSales = monthBills.reduce((sum, b) => sum + Number(b.total), 0)
    const monthExpensesTotal = monthExpenses.reduce((sum, e) => sum + Number(e.amount), 0)
    const monthCash = monthBills.reduce((sum, b) => sum + Number(b.cashAmount), 0)
    const monthGpay = monthBills.reduce((sum, b) => sum + Number(b.gpayAmount), 0)

    const last14Days = Array.from({ length: 14 }, (_, i) => {
      const d = subDays(now, 13 - i)
      return format(d, "MMM dd")
    })

    const revenueTrend = last14Days.map((label) => {
      const dayBills = bills14.filter((b) => {
        const bd = format(new Date(b.createdAt), "MMM dd")
        return bd === label
      })
      const revenue = dayBills.reduce((s, b) => s + Number(b.total), 0)
      return { date: label, revenue: Math.round(revenue * 100) / 100 }
    })

    const expenseTrend = last14Days.map((label) => {
      const dayExpenses = expenses14.filter((e) => {
        const ed = format(new Date(e.date), "MMM dd")
        return ed === label
      })
      const expense = dayExpenses.reduce((s, e) => s + Number(e.amount), 0)
      return { date: label, expense: Math.round(expense * 100) / 100 }
    })

    const productMap = new Map<
      string,
      { name: string; category: string; total: number; quantity: number }
    >()
    for (const item of productItems) {
      const key = item.productName
      const existing = productMap.get(key)
      const catName = item.product?.category?.name ?? "Uncategorized"
      if (existing) {
        existing.total += Number(item.total)
        existing.quantity += item.quantity
      } else {
        productMap.set(key, {
          name: item.productName,
          category: catName,
          total: Number(item.total),
          quantity: item.quantity,
        })
      }
    }
    const topProductsData = Array.from(productMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)

    const productSales = topProductsData.map((p) => ({
      name: p.name,
      value: Math.round(p.total * 100) / 100,
    }))

    const sixMonths: { label: string; revenue: number; expense: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(now, i)
      const label = format(d, "MMM yyyy")
      const ms = startOfMonth(d)
      const me = endOfMonth(d)

      const revBills = comparisonBills.filter((b) => {
        const bc = new Date(b.createdAt)
        return bc >= ms && bc <= me
      })
      const rev = revBills.reduce((s, b) => s + Number(b.total), 0)

      const expBills = comparisonExpenses.filter((e) => {
        const ed = new Date(e.date)
        return ed >= ms && ed <= me
      })
      const exp = expBills.reduce((s, e) => s + Number(e.amount), 0)

      sixMonths.push({
        label,
        revenue: Math.round(rev * 100) / 100,
        expense: Math.round(exp * 100) / 100,
      })
    }

    const totalCash = todayCash
    const totalGpay = todayGpay
    const totalCollection = totalCash + totalGpay
    const collectionBreakdown = [
      {
        name: "Cash",
        value: totalCash,
        percentage: totalCollection > 0 ? Math.round((totalCash / totalCollection) * 10000) / 100 : 0,
      },
      {
        name: "GPay",
        value: totalGpay,
        percentage: totalCollection > 0 ? Math.round((totalGpay / totalCollection) * 10000) / 100 : 0,
      },
    ]

    const recentBills = recentBillsData.map((b) => ({
      id: b.id,
      billNo: b.billNo,
      customer: b.customer?.name ?? null,
      total: Number(b.total),
      paymentMode: b.paymentMode,
      date: format(new Date(b.createdAt), "dd MMM yyyy, h:mm a"),
      status: b.status,
    }))

    const recentExpenses = recentExpensesData.map((e) => ({
      id: e.id,
      description: e.description,
      amount: Number(e.amount),
      category: e.category.name,
      date: format(new Date(e.date), "dd MMM yyyy"),
      paymentMode: e.paymentMode,
    }))

    const topCustomers = topCustomersData.map((c) => ({
      id: c.id,
      name: c.name,
      visitCount: c.visitCount,
      totalSpent: Number(c.totalSpent),
    }))

    const topProducts = topProductsData.map((p) => ({
      id: p.name,
      name: p.name,
      category: p.category,
      totalRevenue: Math.round(p.total * 100) / 100,
      quantitySold: p.quantity,
    }))

    const upcomingOrders = upcomingOrdersData.map((o) => ({
      id: o.id,
      orderNo: o.orderNo,
      customer: o.customer.name,
      deliveryDate: o.deliveryDate ? format(new Date(o.deliveryDate), "dd MMM yyyy") : null,
      advance: Number(o.advance),
      balance: Number(o.balance),
      status: o.status,
    }))

    const pendingVendors = pendingVendorsData.map((v) => ({
      id: v.id,
      name: v.name,
      outstanding: Number(v.outstandingBalance),
    }))

    return NextResponse.json({
      todayStats: {
        sales: todaySales,
        expenses: todayExpensesTotal,
        cash: todayCash,
        gpay: todayGpay,
      },
      monthlyStats: {
        sales: monthSales,
        expenses: monthExpensesTotal,
        cashCollections: monthCash,
        gpayCollections: monthGpay,
      },
      revenueTrend,
      expenseTrend,
      productSales,
      monthlyComparison: sixMonths,
      collectionBreakdown,
      recentBills,
      recentExpenses,
      topCustomers,
      topProducts,
      upcomingOrders,
      pendingVendors,
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    )
  }
}
