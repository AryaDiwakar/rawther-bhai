import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth"
import { prisma } from "@/lib/db/prisma"
import type { OrderStatus, OrderPaymentMode, OrderPaymentType } from "@prisma/client"

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await context.params

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      customer: true,
      payments: { orderBy: { createdAt: "desc" } },
    },
  })

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 })
  }

  return NextResponse.json(order)
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await context.params

  try {
    const body = await request.json()
    const { orderDate, deliveryDate, totalAmount, notes } = body

    const existing = await prisma.order.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    const total = totalAmount !== undefined ? Number.parseFloat(totalAmount) : Number(existing.totalAmount)
    const advance = Number(existing.advance)
    const balance = total - advance

    let status: OrderStatus = existing.status
    if (advance >= total && existing.status !== "CANCELLED") {
      status = "COMPLETED"
    } else if (advance > 0 && advance < total && existing.status !== "CANCELLED") {
      status = "PENDING_BALANCE"
    } else if (advance === 0 && existing.status !== "CANCELLED") {
      status = "UPCOMING"
    }

    const order = await prisma.order.update({
      where: { id },
      data: {
        orderDate: orderDate ? new Date(orderDate) : undefined,
        deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
        totalAmount: total,
        balance,
        status,
        notes: notes !== undefined ? notes : undefined,
      },
      include: {
        customer: true,
        payments: { orderBy: { createdAt: "desc" } },
      },
    })

    return NextResponse.json(order)
  } catch (error) {
    console.error("Error updating order:", error)
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await context.params

  try {
    const body = await request.json()
    const { action } = body

    const existing = await prisma.order.findUnique({
      where: { id },
      include: { payments: true },
    })

    if (!existing) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    if (action === "add-payment") {
      const { amount, mode, type } = body as {
        amount: number
        mode: OrderPaymentMode
        type: OrderPaymentType
      }

      const paymentAmount = Number.parseFloat(String(amount))

      const [payment] = await prisma.$transaction([
        prisma.orderPayment.create({
          data: {
            orderId: id,
            amount: paymentAmount,
            mode,
            type,
          },
        }),
      ])

      const allPayments = await prisma.orderPayment.findMany({ where: { orderId: id } })
      const totalAdvance = allPayments
        .filter((p) => p.type === "ADVANCE")
        .reduce((sum, p) => sum + Number(p.amount), 0)
      const totalPaid = allPayments.reduce((sum, p) => sum + Number(p.amount), 0)
      const totalAmount = Number(existing.totalAmount)
      const newBalance = totalAmount - totalPaid

      let newStatus: OrderStatus = existing.status
      if (totalPaid >= totalAmount) {
        newStatus = "COMPLETED"
      } else if (totalPaid > 0) {
        newStatus = "PENDING_BALANCE"
      }

      await prisma.order.update({
        where: { id },
        data: {
          advance: totalAdvance,
          balance: Math.max(0, newBalance),
          status: newStatus,
        },
      })

      const updated = await prisma.order.findUnique({
        where: { id },
        include: {
          customer: true,
          payments: { orderBy: { createdAt: "desc" } },
        },
      })

      return NextResponse.json(updated)
    }

    if (action === "update-status") {
      const { status } = body as { status: OrderStatus }

      const order = await prisma.order.update({
        where: { id },
        data: { status },
        include: {
          customer: true,
          payments: { orderBy: { createdAt: "desc" } },
        },
      })

      return NextResponse.json(order)
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Error processing order action:", error)
    return NextResponse.json({ error: "Failed to process action" }, { status: 500 })
  }
}
