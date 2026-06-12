import { NextRequest } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { Prisma } from "@prisma/client"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""
    const from = searchParams.get("from") || ""
    const to = searchParams.get("to") || ""
    const status = searchParams.get("status") || ""
    const skip = (page - 1) * limit

    const where: Prisma.BillWhereInput = {}

    if (search) {
      where.OR = [
        { billNo: { contains: search, mode: "insensitive" } },
        { customer: { name: { contains: search, mode: "insensitive" } } },
      ]
    }
    if (from) {
      where.createdAt = { ...(where.createdAt as any), gte: new Date(from) }
    }
    if (to) {
      where.createdAt = { ...(where.createdAt as any), lte: new Date(to) }
    }
    if (status) {
      where.status = status as any
    }

    const [bills, total] = await Promise.all([
      prisma.bill.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          items: true,
          user: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.bill.count({ where }),
    ])

    return Response.json({
      bills,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching bills:", error)
    return Response.json({ error: "Failed to fetch bills" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      customerId,
      items,
      subtotal,
      tax = 0,
      discount = 0,
      total,
      paymentMode,
      cashAmount = 0,
      gpayAmount = 0,
      userId,
    } = body

    if (!items || !items.length || subtotal === undefined || total === undefined || !paymentMode) {
      return Response.json(
        { error: "Items, subtotal, total, and payment mode are required" },
        { status: 400 }
      )
    }

    if (paymentMode === "SPLIT") {
      const cash = new Prisma.Decimal(cashAmount || 0)
      const gpay = new Prisma.Decimal(gpayAmount || 0)
      if (cash.plus(gpay).toString() !== new Prisma.Decimal(total).toString()) {
        return Response.json(
          { error: "Split amounts must equal the total" },
          { status: 400 }
        )
      }
    }

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "")
    const lastBill = await prisma.bill.findFirst({
      where: { billNo: { startsWith: `BILL-${dateStr}` } },
      orderBy: { billNo: "desc" },
    })

    let seq = 1
    if (lastBill) {
      const lastSeq = parseInt(lastBill.billNo.split("-").pop() || "0")
      seq = lastSeq + 1
    }
    const billNo = `BILL-${dateStr}-${String(seq).padStart(3, "0")}`

    const bill = await prisma.$transaction(async (tx) => {
      const created = await tx.bill.create({
        data: {
          billNo,
          customerId: customerId || null,
          subtotal: new Prisma.Decimal(subtotal),
          tax: new Prisma.Decimal(tax),
          discount: new Prisma.Decimal(discount),
          total: new Prisma.Decimal(total),
          paymentMode,
          cashAmount: new Prisma.Decimal(cashAmount || 0),
          gpayAmount: new Prisma.Decimal(gpayAmount || 0),
          userId: userId || null,
          items: {
            create: items.map((item: any) => ({
              productId: item.productId || null,
              productName: item.productName,
              quantity: item.quantity,
              unitPrice: new Prisma.Decimal(item.unitPrice),
              total: new Prisma.Decimal(item.total),
            })),
          },
        },
        include: {
          items: true,
          customer: true,
        },
      })

      if (customerId) {
        const totalSpent = new Prisma.Decimal(total)
        await tx.customer.update({
          where: { id: customerId },
          data: {
            visitCount: { increment: 1 },
            totalSpent: { increment: totalSpent },
          },
        })
      }

      return created
    })

    return Response.json(bill, { status: 201 })
  } catch (error) {
    console.error("Error creating bill:", error)
    return Response.json({ error: "Failed to create bill" }, { status: 500 })
  }
}
