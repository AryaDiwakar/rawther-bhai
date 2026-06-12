import { NextRequest } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { Prisma } from "@prisma/client"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""
    const categoryId = searchParams.get("categoryId") || ""
    const status = searchParams.get("status") || ""
    const skip = (page - 1) * limit

    const where: Prisma.ProductWhereInput = {}

    if (search) {
      where.name = { contains: search, mode: "insensitive" }
    }
    if (categoryId) {
      where.categoryId = categoryId
    }
    if (status) {
      where.status = status as any
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: { select: { id: true, name: true } },
          _count: { select: { billItems: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ])

    return Response.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching products:", error)
    return Response.json({ error: "Failed to fetch products" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, categoryId, price, status } = body

    if (!name || !categoryId || price === undefined) {
      return Response.json({ error: "Name, category, and price are required" }, { status: 400 })
    }

    const product = await prisma.product.create({
      data: {
        name,
        categoryId,
        price: new Prisma.Decimal(price),
        status: status || "ACTIVE",
      },
      include: {
        category: { select: { id: true, name: true } },
      },
    })

    return Response.json(product, { status: 201 })
  } catch (error) {
    console.error("Error creating product:", error)
    return Response.json({ error: "Failed to create product" }, { status: 500 })
  }
}
