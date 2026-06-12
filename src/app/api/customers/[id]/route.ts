import { NextRequest } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { apiSuccess, apiError, handleApiError } from "@/lib/utils/api"
import { getCurrentUser } from "@/lib/auth/middleware"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) return apiError("Unauthorized", 401)

    const { id } = await params

    const customer = await prisma.customer.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        address: true,
        visitCount: true,
        totalSpent: true,
        createdAt: true,
        updatedAt: true,
        bills: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            billNo: true,
            total: true,
            paymentMode: true,
            createdAt: true,
            items: {
              select: {
                id: true,
                productName: true,
                quantity: true,
                total: true,
              },
            },
          },
        },
        orders: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            orderNo: true,
            orderDate: true,
            status: true,
            totalAmount: true,
            advance: true,
            balance: true,
          },
        },
      },
    })

    if (!customer) {
      return apiError("Customer not found", 404)
    }

    const lastVisit = customer.bills.length > 0
      ? customer.bills[0].createdAt
      : customer.orders.length > 0
        ? customer.orders[0].orderDate
        : null

    return apiSuccess({
      ...customer,
      lastVisit,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) return apiError("Unauthorized", 401)

    const { id } = await params
    const body = await request.json()
    const { name, phone, email, address } = body

    const existing = await prisma.customer.findUnique({ where: { id } })
    if (!existing) {
      return apiError("Customer not found", 404)
    }

    if (phone && phone !== existing.phone) {
      const phoneTaken = await prisma.customer.findUnique({
        where: { phone },
      })
      if (phoneTaken) {
        return apiError("Phone number already in use")
      }
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email: email || null }),
        ...(address !== undefined && { address: address || null }),
      },
    })

    return apiSuccess(customer, "Customer updated successfully")
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) return apiError("Unauthorized", 401)

    const { id } = await params

    const existing = await prisma.customer.findUnique({ where: { id } })
    if (!existing) {
      return apiError("Customer not found", 404)
    }

    await prisma.customer.delete({ where: { id } })

    return apiSuccess(null, "Customer deleted successfully")
  } catch (error) {
    return handleApiError(error)
  }
}
