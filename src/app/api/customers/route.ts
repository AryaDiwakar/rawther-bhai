import { NextRequest } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { apiSuccess, apiError, handleApiError } from "@/lib/utils/api"
import { getCurrentUser } from "@/lib/auth/middleware"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return apiError("Unauthorized", 401)

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const sortBy = searchParams.get("sortBy") || "createdAt"
    const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc"
    const page = parseInt(searchParams.get("page") || "1")
    const pageSize = parseInt(searchParams.get("pageSize") || "10")
    const top = searchParams.get("top")

    if (top === "true") {
      const topCustomers = await prisma.customer.findMany({
        orderBy: { totalSpent: "desc" },
        take: 5,
        select: {
          id: true,
          name: true,
          phone: true,
          visitCount: true,
          totalSpent: true,
        },
      })
      return apiSuccess(topCustomers)
    }

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { phone: { contains: search } },
          ],
        }
      : {}

    const validSortFields = ["visitCount", "totalSpent", "name", "createdAt"]
    const actualSortBy = validSortFields.includes(sortBy) ? sortBy : "createdAt"

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy: { [actualSortBy]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          visitCount: true,
          totalSpent: true,
          lastVisit: true,
          createdAt: true,
        },
      }),
      prisma.customer.count({ where }),
    ])

    return apiSuccess({
      customers,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return apiError("Unauthorized", 401)

    const body = await request.json()
    const { name, phone, email, address } = body

    if (!name || !phone) {
      return apiError("Name and phone are required")
    }

    const existing = await prisma.customer.findUnique({
      where: { phone },
    })
    if (existing) {
      return apiError("A customer with this phone number already exists")
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        phone,
        email: email || null,
        address: address || null,
      },
    })

    return apiSuccess(customer, "Customer created successfully")
  } catch (error) {
    return handleApiError(error)
  }
}
