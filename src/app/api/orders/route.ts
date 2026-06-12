import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth"
import { prisma } from "@/lib/db/prisma"
import type { OrderStatus } from "@prisma/client"

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status") as OrderStatus | null
  const search = searchParams.get("search") || ""
  const dateFrom = searchParams.get("dateFrom")
  const dateTo = searchParams.get("dateTo")

  const where: Record<string, unknown> = {}

  if (status) {
    where.status = status
  }

  if (search) {
    where.OR = [
      { orderNo: { contains: search, mode: "insensitive" } },
      { customer: { name: { contains: search, mode: "insensitive" } } },
    ]
  }

  if (dateFrom) {
    where.orderDate = { ...(where.orderDate as object || {}), gte: new Date(dateFrom) }
  }
  if (dateTo) {
    where.orderDate = { ...(where.orderDate as object || {}), lte: new Date(dateTo) }
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      customer: true,
      payments: true,
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(orders)
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { customerId, customerName, customerPhone, orderDate, deliveryDate, totalAmount, advance, advanceMode, notes } = body

    let customer
    if (customerId) {
      customer = await prisma.customer.findUnique({ where: { id: customerId } })
      if (!customer) {
        return NextResponse.json({ error: "Customer not found" }, { status: 404 })
      }
    } else if (customerPhone) {
      customer = await prisma.customer.findUnique({ where: { phone: customerPhone } })
      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            name: customerName || "Unknown",
            phone: customerPhone,
          },
        })
      }
    } else {
      return NextResponse.json({ error: "Customer information required" }, { status: 400 })
    }

    const count = await prisma.order.count()
    const orderNo = `ORD-${String(count + 1).padStart(4, "0")}`

    const advanceAmount = advance ? Number.parseFloat(advance) : 0
    const total = Number.parseFloat(totalAmount)
    const balance = total - advanceAmount

    let status: OrderStatus = "UPCOMING"
    if (advanceAmount >= total) {
      status = "COMPLETED"
    } else if (advanceAmount > 0) {
      status = "PENDING_BALANCE"
    }

    const order = await prisma.order.create({
      data: {
        orderNo,
        customerId: customer.id,
        orderDate: new Date(orderDate),
        deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
        totalAmount: total,
        advance: advanceAmount,
        balance,
        status,
        notes: notes || null,
        userId: session.user.id,
        payments: advanceAmount > 0
          ? {
              create: {
                amount: advanceAmount,
                mode: advanceMode || "CASH",
                type: "ADVANCE",
              },
            }
          : undefined,
      },
      include: {
        customer: true,
        payments: true,
      },
    })

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error("Error creating order:", error)
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
  }
}
