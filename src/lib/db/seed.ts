import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("Seeding database...")

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

  const admin = await prisma.user.create({
    data: { name: "Admin", email: "admin@hotel.com", password: hashedPassword, role: "ADMIN", active: true },
  })

  const manager = await prisma.user.create({
    data: { name: "Manager", email: "manager@hotel.com", password: hashedManagerPassword, role: "MANAGER", active: true },
  })

  console.log("Users created")

  await Promise.all([
    prisma.expenseCategory.create({ data: { name: "Food Supplies", description: "Raw ingredients and kitchen supplies" } }),
    prisma.expenseCategory.create({ data: { name: "Utilities", description: "Electricity, water, gas bills" } }),
    prisma.expenseCategory.create({ data: { name: "Rent", description: "Property rent" } }),
    prisma.expenseCategory.create({ data: { name: "Salary", description: "Employee salaries" } }),
    prisma.expenseCategory.create({ data: { name: "Maintenance", description: "Repairs and maintenance" } }),
    prisma.expenseCategory.create({ data: { name: "Marketing", description: "Advertising and promotions" } }),
    prisma.expenseCategory.create({ data: { name: "Other", description: "Miscellaneous expenses" } }),
  ])

  console.log("Expense categories created")

  const sidesNonVeg = await prisma.category.create({ data: { name: "Sides Non-Veg", description: "Non-vegetarian starters" } })
  const sidesVeg = await prisma.category.create({ data: { name: "Sides Veg", description: "Vegetarian starters" } })
  const nonVegGravy = await prisma.category.create({ data: { name: "Non-Veg Gravy", description: "Non-vegetarian gravies" } })
  const vegGravy = await prisma.category.create({ data: { name: "Veg Gravy", description: "Vegetarian gravies" } })
  const tiffin = await prisma.category.create({ data: { name: "Tiffin", description: "Traditional breakfast items" } })
  const parotta = await prisma.category.create({ data: { name: "Parotta Items", description: "Parotta based dishes" } })
  const biriyani = await prisma.category.create({ data: { name: "Meals / Biriyani", description: "Biriyani and meal items" } })
  const chinese = await prisma.category.create({ data: { name: "Chinese", description: "Chinese cuisine" } })

  console.log("Product categories created")

  const products = await Promise.all([
    // Sides Non-Veg
    prisma.product.create({ data: { name: "Chicken 65 (5 pcs)", categoryId: sidesNonVeg.id, price: 120 } }),
    prisma.product.create({ data: { name: "Chicken 65 Boneless (10 pcs)", categoryId: sidesNonVeg.id, price: 150 } }),
    prisma.product.create({ data: { name: "Kadai 65 (1 Full)", categoryId: sidesNonVeg.id, price: 120 } }),
    prisma.product.create({ data: { name: "Lolly Pop (6 pcs) Dry", categoryId: sidesNonVeg.id, price: 150 } }),
    prisma.product.create({ data: { name: "Lolly Pop (6 pcs) Saucy", categoryId: sidesNonVeg.id, price: 160 } }),
    prisma.product.create({ data: { name: "Leg Fry", categoryId: sidesNonVeg.id, price: 70 } }),

    // Sides Veg
    prisma.product.create({ data: { name: "Paneer 65 (10 pcs)", categoryId: sidesVeg.id, price: 140 } }),
    prisma.product.create({ data: { name: "Mushroom 65", categoryId: sidesVeg.id, price: 130 } }),
    prisma.product.create({ data: { name: "Gobi 65", categoryId: sidesVeg.id, price: 110 } }),

    // Non-Veg Gravy
    prisma.product.create({ data: { name: "Chicken Gravy (2 pcs)", categoryId: nonVegGravy.id, price: 50 } }),
    prisma.product.create({ data: { name: "Chilli Chicken (10 pcs)", categoryId: nonVegGravy.id, price: 150 } }),
    prisma.product.create({ data: { name: "Chicken Manchurian (10 pcs)", categoryId: nonVegGravy.id, price: 150 } }),
    prisma.product.create({ data: { name: "Ginger Chicken (10 pcs)", categoryId: nonVegGravy.id, price: 160 } }),
    prisma.product.create({ data: { name: "Garlic Chicken (10 pcs)", categoryId: nonVegGravy.id, price: 160 } }),
    prisma.product.create({ data: { name: "Dragon Chicken (10 pcs)", categoryId: nonVegGravy.id, price: 180 } }),
    prisma.product.create({ data: { name: "Honey Chicken", categoryId: nonVegGravy.id, price: 170 } }),
    prisma.product.create({ data: { name: "Schezwan Chicken (10 pcs)", categoryId: nonVegGravy.id, price: 160 } }),
    prisma.product.create({ data: { name: "Pepper Chicken (10 pcs)", categoryId: nonVegGravy.id, price: 160 } }),

    // Veg Gravy
    prisma.product.create({ data: { name: "Chilli Paneer", categoryId: vegGravy.id, price: 150 } }),
    prisma.product.create({ data: { name: "Paneer Manchurian", categoryId: vegGravy.id, price: 160 } }),
    prisma.product.create({ data: { name: "Chilli Mushroom", categoryId: vegGravy.id, price: 130 } }),
    prisma.product.create({ data: { name: "Mushroom Manchurian", categoryId: vegGravy.id, price: 160 } }),
    prisma.product.create({ data: { name: "Chilli Gobi", categoryId: vegGravy.id, price: 120 } }),
    prisma.product.create({ data: { name: "Gobi Manchurian", categoryId: vegGravy.id, price: 130 } }),

    // Tiffin
    prisma.product.create({ data: { name: "Idli (2 nos)", categoryId: tiffin.id, price: 25 } }),
    prisma.product.create({ data: { name: "Plain Dosa", categoryId: tiffin.id, price: 50 } }),
    prisma.product.create({ data: { name: "Egg Dosa", categoryId: tiffin.id, price: 70 } }),
    prisma.product.create({ data: { name: "Onion Dosa", categoryId: tiffin.id, price: 50 } }),
    prisma.product.create({ data: { name: "Kal Dosa", categoryId: tiffin.id, price: 25 } }),
    prisma.product.create({ data: { name: "Chapati (each pc)", categoryId: tiffin.id, price: 20 } }),

    // Parotta Items
    prisma.product.create({ data: { name: "Chilli Parotta", categoryId: parotta.id, price: 110 } }),
    prisma.product.create({ data: { name: "Parotta", categoryId: parotta.id, price: 20 } }),
    prisma.product.create({ data: { name: "Chicken Kothu Parotta", categoryId: parotta.id, price: 130 } }),
    prisma.product.create({ data: { name: "Egg Kothu Parotta", categoryId: parotta.id, price: 100 } }),
    prisma.product.create({ data: { name: "Chicken Labba", categoryId: parotta.id, price: 180 } }),
    prisma.product.create({ data: { name: "Egg Labba", categoryId: parotta.id, price: 160 } }),
    prisma.product.create({ data: { name: "Plain Labba", categoryId: parotta.id, price: 140 } }),
    prisma.product.create({ data: { name: "Egg Mass", categoryId: parotta.id, price: 90 } }),
    prisma.product.create({ data: { name: "Chicken Roll", categoryId: parotta.id, price: 100 } }),

    // Meals / Biriyani
    prisma.product.create({ data: { name: "Chicken Biriyani", categoryId: biriyani.id, price: 140 } }),
    prisma.product.create({ data: { name: "Chicken 65 Biriyani", categoryId: biriyani.id, price: 150 } }),
    prisma.product.create({ data: { name: "Chicken Thokku Biriyani", categoryId: biriyani.id, price: 160 } }),
    prisma.product.create({ data: { name: "Egg Biriyani", categoryId: biriyani.id, price: 100 } }),
    prisma.product.create({ data: { name: "Kushka", categoryId: biriyani.id, price: 90 } }),
    prisma.product.create({ data: { name: "Kushka 1 Kg", categoryId: biriyani.id, price: 140 } }),
    prisma.product.create({ data: { name: "Nei Soru + Dalcha", categoryId: biriyani.id, price: 100 } }),
    prisma.product.create({ data: { name: "Nei Soru + Chicken", categoryId: biriyani.id, price: 140 } }),
    prisma.product.create({ data: { name: "Chicken Mini Bucket", categoryId: biriyani.id, price: 750 } }),
    prisma.product.create({ data: { name: "Limited Meals", categoryId: biriyani.id, price: 120 } }),

    // Chinese
    prisma.product.create({ data: { name: "Chicken Rice", categoryId: chinese.id, price: 140 } }),
    prisma.product.create({ data: { name: "Chicken Noodles", categoryId: chinese.id, price: 140 } }),
    prisma.product.create({ data: { name: "Chicken Schezwan Rice", categoryId: chinese.id, price: 160 } }),
    prisma.product.create({ data: { name: "Chicken Schezwan Noodles", categoryId: chinese.id, price: 160 } }),
    prisma.product.create({ data: { name: "Egg Rice", categoryId: chinese.id, price: 120 } }),
    prisma.product.create({ data: { name: "Egg Noodles", categoryId: chinese.id, price: 120 } }),
    prisma.product.create({ data: { name: "Veg Rice", categoryId: chinese.id, price: 100 } }),
    prisma.product.create({ data: { name: "Veg Noodles", categoryId: chinese.id, price: 100 } }),
    prisma.product.create({ data: { name: "Paneer Rice", categoryId: chinese.id, price: 130 } }),
    prisma.product.create({ data: { name: "Paneer Noodles", categoryId: chinese.id, price: 130 } }),
    prisma.product.create({ data: { name: "Mushroom Rice", categoryId: chinese.id, price: 130 } }),
    prisma.product.create({ data: { name: "Mushroom Noodles", categoryId: chinese.id, price: 130 } }),
    prisma.product.create({ data: { name: "Gobi Rice", categoryId: chinese.id, price: 120 } }),
    prisma.product.create({ data: { name: "Gobi Noodles", categoryId: chinese.id, price: 120 } }),
    prisma.product.create({ data: { name: "Schezwan Paneer Rice", categoryId: chinese.id, price: 150 } }),
    prisma.product.create({ data: { name: "Schezwan Mushroom Rice", categoryId: chinese.id, price: 150 } }),
    prisma.product.create({ data: { name: "Schezwan Gobi Rice", categoryId: chinese.id, price: 150 } }),
    prisma.product.create({ data: { name: "Schezwan Paneer Noodles", categoryId: chinese.id, price: 150 } }),
    prisma.product.create({ data: { name: "Schezwan Mushroom Noodles", categoryId: chinese.id, price: 150 } }),
    prisma.product.create({ data: { name: "Schezwan Gobi Noodles", categoryId: chinese.id, price: 150 } }),
  ])

  console.log(`${products.length} Products created`)

  const customers = await Promise.all([
    prisma.customer.create({ data: { name: "Rahul Sharma", phone: "9876543210", email: "rahul@email.com", address: "MG Road, Bangalore", visitCount: 15, totalSpent: 12500 } }),
    prisma.customer.create({ data: { name: "Priya Patel", phone: "9876543211", email: "priya@email.com", address: "Indiranagar, Bangalore", visitCount: 8, totalSpent: 6400 } }),
    prisma.customer.create({ data: { name: "Amit Singh", phone: "9876543212", email: "amit@email.com", address: "Koramangala, Bangalore", visitCount: 22, totalSpent: 18000 } }),
    prisma.customer.create({ data: { name: "Sneha Reddy", phone: "9876543213", email: "sneha@email.com", address: "Jayanagar, Bangalore", visitCount: 5, totalSpent: 3200 } }),
    prisma.customer.create({ data: { name: "Vikram Joshi", phone: "9876543214", email: "vikram@email.com", address: "Whitefield, Bangalore", visitCount: 12, totalSpent: 9500 } }),
    prisma.customer.create({ data: { name: "Dinesh Kumar", phone: "9876543215", email: "dinesh@email.com", address: "BTM Layout, Bangalore", visitCount: 6, totalSpent: 4200 } }),
  ])
  console.log("Customers created")

  const vendors = await Promise.all([
    prisma.vendor.create({ data: { name: "Fresh Foods Supply", phone: "9988776651", email: "fresh@supply.com", address: "Azad Market, Delhi", outstandingBalance: 4500 } }),
    prisma.vendor.create({ data: { name: "Dairy Best", phone: "9988776652", email: "dairy@best.com", address: "Lajpat Nagar, Delhi", outstandingBalance: 2800 } }),
    prisma.vendor.create({ data: { name: "Quality Meats", phone: "9988776653", email: "meats@quality.com", address: "Karol Bagh, Delhi", outstandingBalance: 0 } }),
    prisma.vendor.create({ data: { name: "Beverage World", phone: "9988776654", email: "info@beverageworld.com", address: "Connaught Place, Delhi", outstandingBalance: 1500 } }),
  ])
  console.log("Vendors created")

  const now = new Date()

  const getProd = (name: string) => products.find((p) => p.name.startsWith(name))!

  const billData = [
    { daysAgo: 28, customer: customers[0], cash: true, items: [{ product: getProd("Chicken Biriyani"), qty: 2 }, { product: getProd("Chicken 65 (5 pcs)"), qty: 1 }, { product: getProd("Parotta"), qty: 2 }] },
    { daysAgo: 25, customer: customers[1], cash: false, items: [{ product: getProd("Limited Meals"), qty: 2 }, { product: getProd("Egg Dosa"), qty: 1 }] },
    { daysAgo: 21, customer: customers[2], cash: true, items: [{ product: getProd("Chicken Biriyani"), qty: 3 }, { product: getProd("Chilli Chicken (10 pcs)"), qty: 1 }, { product: getProd("Parotta"), qty: 4 }] },
    { daysAgo: 18, customer: customers[3], cash: false, items: [{ product: getProd("Chicken 65 Boneless (10 pcs)"), qty: 1 }, { product: getProd("Kushka"), qty: 2 }] },
    { daysAgo: 14, customer: customers[4], cash: true, items: [{ product: getProd("Chicken 65 Biriyani"), qty: 2 }, { product: getProd("Chicken Kothu Parotta"), qty: 1 }, { product: getProd("Lolly Pop (6 pcs) Saucy"), qty: 1 }] },
    { daysAgo: 10, customer: customers[0], cash: false, items: [{ product: getProd("Dragon Chicken (10 pcs)"), qty: 1 }, { product: getProd("Chicken Rice"), qty: 2 }, { product: getProd("Plain Dosa"), qty: 1 }] },
    { daysAgo: 7, customer: customers[5], cash: true, items: [{ product: getProd("Kushka 1 Kg"), qty: 1 }, { product: getProd("Chilli Parotta"), qty: 1 }, { product: getProd("Chicken Gravy (2 pcs)"), qty: 2 }] },
    { daysAgo: 5, customer: customers[1], cash: false, items: [{ product: getProd("Chicken Schezwan Rice"), qty: 1 }, { product: getProd("Chicken Noodles"), qty: 1 }, { product: getProd("Chicken Roll"), qty: 2 }] },
    { daysAgo: 3, customer: customers[2], cash: true, items: [{ product: getProd("Chicken 65 (5 pcs)"), qty: 2 }, { product: getProd("Ginger Chicken (10 pcs)"), qty: 1 }, { product: getProd("Kushka"), qty: 1 }] },
    { daysAgo: 1, customer: customers[4], cash: true, items: [{ product: getProd("Chicken Thokku Biriyani"), qty: 1 }, { product: getProd("Egg Rice"), qty: 1 }, { product: getProd("Chicken 65 Boneless (10 pcs)"), qty: 1 }] },
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
        subtotal, tax, discount, total,
        paymentMode: paymentMode as "CASH" | "GPAY",
        cashAmount, gpayAmount,
        status: "ACTIVE",
        createdAt: billDate, updatedAt: billDate,
        userId: manager.id,
        items: { create: itemsData },
      },
    })

    await prisma.customer.update({
      where: { id: bd.customer.id },
      data: { visitCount: { increment: 1 }, totalSpent: { increment: total } },
    })

    billNo++
  }
  console.log("Bills and bill items created")

  const expenseCategories = await prisma.expenseCategory.findMany()
  const ecMap = (name: string) => expenseCategories.find((e) => e.name === name)!

  const expenseData = [
    { daysAgo: 29, amount: 2500, desc: "Weekly vegetable purchase", cat: "Food Supplies", vendor: vendors[0], mode: "CASH" },
    { daysAgo: 26, amount: 1800, desc: "Milk and dairy products", cat: "Food Supplies", vendor: vendors[1], mode: "CASH" },
    { daysAgo: 22, amount: 3500, desc: "Chicken and mutton supply", cat: "Food Supplies", vendor: vendors[2], mode: "GPAY" },
    { daysAgo: 19, amount: 12000, desc: "Monthly rent payment", cat: "Rent", vendor: null, mode: "GPAY" },
    { daysAgo: 17, amount: 450, desc: "Electricity bill", cat: "Utilities", vendor: null, mode: "CASH" },
    { daysAgo: 14, amount: 3200, desc: "Masala and spice stock", cat: "Food Supplies", vendor: vendors[0], mode: "CASH" },
    { daysAgo: 12, amount: 15000, desc: "Staff salaries", cat: "Salary", vendor: null, mode: "CASH" },
    { daysAgo: 8, amount: 1200, desc: "Kitchen equipment repair", cat: "Maintenance", vendor: null, mode: "CASH" },
    { daysAgo: 5, amount: 2000, desc: "Social media ads", cat: "Marketing", vendor: null, mode: "GPAY" },
    { daysAgo: 2, amount: 850, desc: "Cleaning supplies", cat: "Food Supplies", vendor: vendors[0], mode: "CARD" },
  ]

  for (const ed of expenseData) {
    const expDate = new Date(now)
    expDate.setDate(expDate.getDate() - ed.daysAgo)
    expDate.setHours(10 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 60), 0, 0)

    await prisma.expense.create({
      data: {
        amount: ed.amount,
        description: ed.desc,
        expenseCategoryId: ecMap(ed.cat).id,
        vendorId: ed.vendor?.id ?? null,
        paymentMode: ed.mode as "CASH" | "GPAY" | "CARD",
        date: expDate, createdAt: expDate, updatedAt: expDate,
      },
    })
  }
  console.log("Expenses created")

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

    let deliveryDate: Date
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
        orderDate, deliveryDate,
        advance: od.advance, balance,
        totalAmount: od.total,
        status: od.status as "COMPLETED" | "PENDING_BALANCE" | "UPCOMING",
        userId: manager.id,
        payments: { create: [{ amount: od.advance, mode: "CASH", type: "ADVANCE", createdAt: orderDate }] },
      },
    })

    orderNo++
  }
  console.log("Orders and payments created")

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
      data: { date: colDate, cashAmount: cd.cash, gpayAmount: cd.gpay, advanceAmount: cd.advance, balanceAmount: cd.balance },
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
