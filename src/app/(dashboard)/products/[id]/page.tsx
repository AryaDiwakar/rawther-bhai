import { prisma } from "@/lib/db/prisma"
import { notFound } from "next/navigation"
import { EditProductClient } from "./edit-product-client"

export const dynamic = "force-dynamic"

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: { select: { id: true, name: true } },
    },
  })

  if (!product) {
    notFound()
  }

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  })

  const analytics = await prisma.billItem.aggregate({
    where: { productId: id },
    _sum: { quantity: true, total: true },
  })

  const productData = {
    ...product,
    price: product.price.toString(),
    analytics: {
      totalSold: analytics._sum.quantity || 0,
      totalRevenue: analytics._sum.total?.toString() || "0",
    },
  }

  return <EditProductClient product={productData} categories={categories} />
}
