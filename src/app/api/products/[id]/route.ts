import { NextRequest } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { Prisma } from "@prisma/client"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true } },
      },
    })

    if (!product) {
      return Response.json({ error: "Product not found" }, { status: 404 })
    }

    const analytics = await prisma.billItem.aggregate({
      where: { productId: id },
      _sum: { quantity: true, total: true },
    })

    return Response.json({
      ...product,
      analytics: {
        totalSold: analytics._sum.quantity || 0,
        totalRevenue: analytics._sum.total || 0,
      },
    })
  } catch (error) {
    console.error("Error fetching product:", error)
    return Response.json({ error: "Failed to fetch product" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { name, categoryId, price, status } = body

    const existing = await prisma.product.findUnique({ where: { id } })
    if (!existing) {
      return Response.json({ error: "Product not found" }, { status: 404 })
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(categoryId !== undefined && { categoryId }),
        ...(price !== undefined && { price: new Prisma.Decimal(price) }),
        ...(status !== undefined && { status }),
      },
      include: {
        category: { select: { id: true, name: true } },
      },
    })

    return Response.json(product)
  } catch (error) {
    console.error("Error updating product:", error)
    return Response.json({ error: "Failed to update product" }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const existing = await prisma.product.findUnique({ where: { id } })
    if (!existing) {
      return Response.json({ error: "Product not found" }, { status: 404 })
    }

    const billUsage = await prisma.billItem.findFirst({
      where: { productId: id },
    })

    if (billUsage) {
      return Response.json(
        { error: "Cannot delete product that has been used in bills" },
        { status: 409 }
      )
    }

    await prisma.product.delete({ where: { id } })

    return Response.json({ message: "Product deleted successfully" })
  } catch (error) {
    console.error("Error deleting product:", error)
    return Response.json({ error: "Failed to delete product" }, { status: 500 })
  }
}
