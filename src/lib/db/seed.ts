import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("Seeding database...")

  // Clean existing data in correct order
  await prisma.auditLog.deleteMany()
  await prisma.dailyClosing.deleteMany()
  await prisma.orderPayment.deleteMany()
  await prisma.order.deleteMany()
  await prisma.billItem.deleteMany()
  await prisma.bill.deleteMany()
  await prisma.collection.deleteMany()
  await prisma.vendorSettlement.deleteMany()
  await prisma.vendorAdjustment.deleteMany()
  await prisma.expense.deleteMany()
  await prisma.vendor.deleteMany()
  await prisma.product.deleteMany()
  await prisma.category.deleteMany()
  await prisma.expenseCategory.deleteMany()
  await prisma.customer.deleteMany()
  await prisma.session.deleteMany()
  await prisma.account.deleteMany()
  await prisma.user.deleteMany()
  await prisma.verificationToken.deleteMany()

  const hashedPassword = await bcrypt.hash("admin123", 10)
  const hashedManagerPassword = await bcrypt.hash("manager123", 10)

  // Users
  const admin = await prisma.user.create({
    data: {
      name: "Admin",
      email: "admin@hotel.com",
      password: hashedPassword,
      role: "ADMIN",
      active: true,
    },
  })

  const manager = await prisma.user.create({
    data: {
      name: "Manager",
      email: "manager@hotel.com",
      password: hashedManagerPassword,
      role: "MANAGER",
      active: true,
    },
  })

  console.log("Users created")

  // Expense Categories
  const expenseCategories = await Promise.all([
    prisma.expenseCategory.create({ data: { name: "Food", description: "Food and kitchen supplies" } }),
    prisma.expenseCategory.create({ data: { name: "Utilities", description: "Electricity, water, gas bills" } }),
    prisma.expenseCategory.create({ data: { name: "Rent", description: "Property rent" } }),
    prisma.expenseCategory.create({ data: { name: "Salary", description: "Employee salaries" } }),
    prisma.expenseCategory.create({ data: { name: "Maintenance", description: "Repairs and maintenance" } }),
    prisma.expenseCategory.create({ data: { name: "Marketing", description: "Advertising and promotions" } }),
    prisma.expenseCategory.create({ data: { name: "Other", description: "Miscellaneous expenses" } }),
  ])

  console.log("Expense categories created")

  // Product Categories
  const beveragesCat = await prisma.category.create({ data: { name: "Beverages", description: "Cold and hot drinks" } })
  const foodCat = await prisma.category.create({ data: { name: "Food", description: "Main course meals" } })
  const snacksCat = await prisma.category.create({ data: { name: "Snacks", description: "Light bites and starters" } })
  const dessertsCat = await prisma.category.create({ data: { name: "Desserts", description: "Sweet treats" } })
  const othersCat = await prisma.category.create({ data: { name: "Others", description: "Other items" } })

  console.log("Product categories created")

  // Products
  const products = await Promise.all([
    prisma.product.create({ data: { name: "Chai", categoryId: beveragesCat.id, price: 20 } }),
    prisma.product.create({ data: { name: "Coffee", categoryId: beveragesCat.id, price: 40 } }),
    prisma.product.create({ data: { name: "Cold Coffee", categoryId: beveragesCat.id, price: 60 } }),
    prisma.product.create({ data: { name: "Mango Shake", categoryId: beveragesCat.id, price: 80 } }),
    prisma.product.create({ data: { name: "Lassi", categoryId: beveragesCat.id, price: 50 } }),
    prisma.product.create({ data: { name: "Chicken Biryani", categoryId: foodCat.id, price: 250 } }),
    prisma.product.create({ data: { name: "Veg Biryani", categoryId: foodCat.id, price: 200 } }),
    prisma.product.create({ data: { name: "Butter Chicken", categoryId: foodCat.id, price: 300 } }),
    prisma.product.create({ data: { name: "Dal Makhani", categoryId: foodCat.id, price: 180 } }),
    prisma.product.create({ data: { name: "Naan", categoryId: foodCat.id, price: 30 } }),
    prisma.product.create({ data: { name: "Samosa", categoryId: snacksCat.id, price: 20 } }),
    prisma.product.create({ data: { name: "French Fries", categoryId: snacksCat.id, price: 80 } }),
    prisma.product.create({ data: { name: "Chicken Pakora", categoryId: snacksCat.id, price: 120 } }),
    prisma.product.create({ data: { name: "Gulab Jamun", categoryId: dessertsCat.id, price: 60 } }),
    prisma.product.create({ data: { name: "Ice Cream", categoryId: dessertsCat.id, price: 40 } }),
    prisma.product.create({ data: { name: "Cold Drink", categoryId: beveragesCat.id, price: 40 } }),
    prisma.product.create({ data: { name: "Paneer Butter Masala", categoryId: foodCat.id, price: 220 } }),
  ])

  console.log("Products created")

  // Customers
  const customers = await Promise.all([
    prisma.customer.create({ data: { name: "Rahul Sharma", phone: "9876543210", email: "rahul@email.com", address: "MG Road, Bangalore", visitCount: 15, totalSpent: 12500 } }),
    prisma.customer.create({ data: { name: "Priya Patel", phone: "9876543211", email: "priya@email.com", address: "Indiranagar, Bangalore", visitCount: 8, totalSpent: 6400 } }),
    prisma.customer.create({ data: { name: "Amit Singh", phone: "9876543212", email: "amit@email.com", address: "Koramangala, Bangalore", visitCount: 22, totalSpent: 18000 } }),
    prisma.customer.create({ data: { name: "Sneha Reddy", phone: "9876543213", email: "sneha@email.com", address: "Jayanagar, Bangalore", visitCount: 5, totalSpent: 3200 } }),
    prisma.customer.create({ data: { name: "Vikram Joshi", phone: "9876543214", email: "vikram@email.com", address: "Whitefield, Bangalore", visitCount: 12, totalSpent: 9500 } }),
  ])

  console.log("Customers created")

  // Vendors
  const vendors = await Promise.all([
    prisma.vendor.create({ data: { name: "Fresh Foods Supply", phone: "9988776651", email: "fresh@supply.com", address: "Azad Market, Delhi", outstandingBalance: 4500 } }),
    prisma.vendor.create({ data: { name: "Dairy Best", phone: "9988776652", email: "dairy@best.com", address: "Lajpat Nagar, Delhi", outstandingBalance: 2800 } }),
    prisma.vendor.create({ data: { name: "Quality Meats", phone: "9988776653", email: "meats@quality.com", address: "Karol Bagh, Delhi", outstandingBalance: 0 } }),
    prisma.vendor.create({ data: { name: "Beverage World", phone: "9988776654", email: "info@beverageworld.com", address: "Connaught Place, Delhi", outstandingBalance: 1500 } }),
  ])

  console.log("Vendors created")

  const now = new Date()

  // Bills and BillItems (10 bills spread across last 30 days)
  const billData = [
    { daysAgo: 28, customer: customers[0], cash: true, items: [{ product: products[5], qty: 2 }, { product: products[9], qty: 4 }, { product: products[0], qty: 2 }] },
    { daysAgo: 25, customer: customers[1], cash: false, items: [{ product: products[6], qty: 1 }, { product: products[4], qty: 2 }] },
    { daysAgo: 21, customer: customers[2], cash: true, items: [{ product: products[5], qty: 3 }, { product: products[7], qty: 1 }, { product: products[1], qty: 3 }] },
    { daysAgo: 18, customer: customers[3], cash: false, items: [{ product: products[10], qty: 6 }, { product: products[11], qty: 2 }] },
    { daysAgo: 14, customer: customers[4], cash: true, items: [{ product: products[6], qty: 2 }, { product: products[8], qty: 2 }, { product: products[9], qty: 3 }] },
    { daysAgo: 10, customer: customers[0], cash: false, items: [{ product: products[7], qty: 1 }, { product: products[16], qty: 1 }, { product: products[2], qty: 2 }] },
    { daysAgo: 7, customer: customers[2], cash: true, items: [{ product: products[5], qty: 1 }, { product: products[8], qty: 1 }, { product: products[4], qty: 1 }] },
    { daysAgo: 5, customer: customers[1], cash: false, items: [{ product: products[15], qty: 4 }, { product: products[14], qty: 2 }] },
    { daysAgo: 3, customer: customers[4], cash: true, items: [{ product: products[12], qty: 2 }, { product: products[11], qty: 1 }, { product: products[3], qty: 1 }] },
    { daysAgo: 1, customer: customers[3], cash: true, items: [{ product: products[5], qty: 1 }, { product: products[9], qty: 2 }, { product: products[13], qty: 3 }] },
  ]

  let billNo = 1001

  for (const bd of billData) {
    const billDate = new Date(now)
    billDate.setDate(billDate.getDate() - bd.daysAgo)
    billDate.setHours(12 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 60), 0, 0)

    let subtotal = 0
    const itemsData = bd.items.map((item) => {
      const total = Number(item.product.price) * item.qty
      subtotal += total
      return { productId: item.product.id, productName: item.product.name, quantity: item.qty, unitPrice: item.product.price, total }
    })

    const tax = Math.round(subtotal * 0.05 * 100) / 100
    const discount = subtotal > 500 ? Math.round(subtotal * 0.1 * 100) / 100 : 0
    const total = subtotal + tax - discount

    const cashAmount = bd.cash ? total : 0
    const gpayAmount = bd.cash ? 0 : total
    const paymentMode = bd.cash ? "CASH" : "GPAY"

    const bill = await prisma.bill.create({
      data: {
        billNo: String(billNo),
        customerId: bd.customer.id,
        subtotal,
        tax,
        discount,
        total,
        paymentMode: paymentMode as "CASH" | "GPAY",
        cashAmount,
        gpayAmount,
        status: "ACTIVE",
        createdAt: billDate,
        updatedAt: billDate,
        userId: manager.id,
        items: {
          create: itemsData,
        },
      },
    })

    // Update customer visit count and total spent
    await prisma.customer.update({
      where: { id: bd.customer.id },
      data: {
        visitCount: { increment: 1 },
        totalSpent: { increment: total },
      },
    })

    billNo++
  }

  console.log("Bills and bill items created")

  // Expenses (10 spread across last 30 days)
  const expenseData = [
    { daysAgo: 29, amount: 2500, desc: "Weekly vegetable purchase", cat: expenseCategories[0], vendor: vendors[0], mode: "CASH" },
    { daysAgo: 26, amount: 1800, desc: "Milk and dairy products", cat: expenseCategories[0], vendor: vendors[1], mode: "CASH" },
    { daysAgo: 22, amount: 3500, desc: "Chicken and mutton supply", cat: expenseCategories[0], vendor: vendors[2], mode: "GPAY" },
    { daysAgo: 19, amount: 12000, desc: "Monthly rent payment", cat: expenseCategories[2], vendor: null, mode: "GPAY" },
    { daysAgo: 17, amount: 450, desc: "Electricity bill", cat: expenseCategories[1], vendor: null, mode: "CASH" },
    { daysAgo: 14, amount: 3200, desc: "Soft drinks stock", cat: expenseCategories[0], vendor: vendors[3], mode: "CASH" },
    { daysAgo: 12, amount: 15000, desc: "Staff salaries", cat: expenseCategories[3], vendor: null, mode: "CASH" },
    { daysAgo: 8, amount: 1200, desc: "Kitchen equipment repair", cat: expenseCategories[4], vendor: null, mode: "CASH" },
    { daysAgo: 5, amount: 2000, desc: "Facebook ads promotion", cat: expenseCategories[5], vendor: null, mode: "GPAY" },
    { daysAgo: 2, amount: 850, desc: "Cleaning supplies", cat: expenseCategories[0], vendor: vendors[0], mode: "CARD" },
  ]

  for (const ed of expenseData) {
    const expDate = new Date(now)
    expDate.setDate(expDate.getDate() - ed.daysAgo)
    expDate.setHours(10 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 60), 0, 0)

    await prisma.expense.create({
      data: {
        amount: ed.amount,
        description: ed.desc,
        expenseCategoryId: ed.cat.id,
        vendorId: ed.vendor?.id ?? null,
        paymentMode: ed.mode as "CASH" | "GPAY" | "CARD",
        date: expDate,
        createdAt: expDate,
        updatedAt: expDate,
      },
    })
  }

  console.log("Expenses created")

  // Orders with payments
  const orderData = [
    { daysAgo: 20, customer: customers[0], total: 5000, advance: 2000, status: "COMPLETED", deliveryDaysAgo: 18 },
    { daysAgo: 15, customer: customers[2], total: 8000, advance: 3000, status: "COMPLETED", deliveryDaysAgo: 13 },
    { daysAgo: 6, customer: customers[4], total: 3500, advance: 1500, status: "COMPLETED", deliveryDaysAgo: 4 },
    { daysAgo: 2, customer: customers[1], total: 6000, advance: 2000, status: "PENDING_BALANCE", deliveryDaysAgo: 1 },
    { daysAgo: 0, customer: customers[3], total: 4000, advance: 1000, status: "UPCOMING", deliveryDaysAgo: -2 },
  ]

  let orderNo = 5001

  for (const od of orderData) {
    const orderDate = new Date(now)
    orderDate.setDate(orderDate.getDate() - od.daysAgo)
    orderDate.setHours(10, 0, 0, 0)

    let deliveryDate: Date | null = null
    if (od.deliveryDaysAgo >= 0) {
      deliveryDate = new Date(now)
      deliveryDate.setDate(deliveryDate.getDate() - od.deliveryDaysAgo)
      deliveryDate.setHours(16, 0, 0, 0)
    } else {
      deliveryDate = new Date(now)
      deliveryDate.setDate(deliveryDate.getDate() + Math.abs(od.deliveryDaysAgo))
      deliveryDate.setHours(16, 0, 0, 0)
    }

    const balance = od.total - od.advance

    await prisma.order.create({
      data: {
        orderNo: String(orderNo),
        customerId: od.customer.id,
        orderDate,
        deliveryDate,
        advance: od.advance,
        balance,
        totalAmount: od.total,
        status: od.status as "COMPLETED" | "PENDING_BALANCE" | "UPCOMING",
        userId: manager.id,
        payments: {
          create: [
            {
              amount: od.advance,
              mode: "CASH",
              type: "ADVANCE",
              createdAt: orderDate,
            },
          ],
        },
      },
    })

    orderNo++
  }

  console.log("Orders and payments created")

  // Collections
  const collectionData = [
    { daysAgo: 28, cash: 4500, gpay: 2300, advance: 0, balance: 0 },
    { daysAgo: 21, cash: 6200, gpay: 3100, advance: 2000, balance: 0 },
    { daysAgo: 14, cash: 3800, gpay: 4200, advance: 0, balance: 1500 },
    { daysAgo: 7, cash: 5100, gpay: 2800, advance: 1500, balance: 0 },
    { daysAgo: 1, cash: 2900, gpay: 3600, advance: 1000, balance: 2000 },
  ]

  for (const cd of collectionData) {
    const colDate = new Date(now)
    colDate.setDate(colDate.getDate() - cd.daysAgo)
    colDate.setHours(23, 0, 0, 0)

    await prisma.collection.create({
      data: {
        date: colDate,
        cashAmount: cd.cash,
        gpayAmount: cd.gpay,
        advanceAmount: cd.advance,
        balanceAmount: cd.balance,
      },
    })
  }

  console.log("Collections created")
  console.log("Seeding completed successfully!")
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
