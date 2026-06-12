import { NextRequest } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { apiSuccess, apiError, handleApiError } from "@/lib/utils/api"
import { getCurrentUser } from "@/lib/auth/middleware"
import { startOfMonth, endOfMonth, format } from "date-fns"

function generateMonthEndSummaryHTML(data: {
  totalRevenue: number
  totalExpenses: number
  netIncome: number
  totalBills: number
  totalOrders: number
  topProducts: { name: string; quantity: number; total: number }[]
  expenseCategories: { category: string; total: number }[]
}): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; padding:0; margin:0; background:#f6f8fa; }
  .container { max-width:600px; margin:0 auto; padding:20px; }
  .header { background:linear-gradient(135deg,#1a1a1a,#333); color:#fff; padding:30px; border-radius:12px 12px 0 0; text-align:center; }
  .header h1 { margin:0; font-size:22px; font-weight:600; }
  .header p { margin:4px 0 0; opacity:.8; font-size:13px; }
  .content { background:#fff; padding:24px; border-radius:0 0 12px 12px; }
  .stats-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:20px; }
  .stat-card { background:#f8f9fa; border-radius:8px; padding:14px; text-align:center; }
  .stat-card .label { font-size:11px; text-transform:uppercase; color:#666; letter-spacing:.5px; }
  .stat-card .value { font-size:20px; font-weight:700; margin-top:4px; }
  .section { margin-bottom:20px; }
  .section h3 { font-size:14px; font-weight:600; margin:0 0 10px; color:#333; border-bottom:1px solid #eee; padding-bottom:6px; }
  table { width:100%; border-collapse:collapse; font-size:13px; }
  th { text-align:left; padding:6px 8px; background:#f0f0f0; font-weight:500; color:#555; }
  td { padding:6px 8px; border-bottom:1px solid #f0f0f0; }
  .footer { text-align:center; padding:20px; font-size:11px; color:#999; }
</style></head>
<body>
  <div class="container">
    <div class="header">
      <h1>Rawther Biryani</h1>
      <p>Month End Summary Report</p>
      <p>${format(new Date(), "MMMM yyyy")}</p>
    </div>
    <div class="content">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="label">Total Revenue</div>
          <div class="value" style="color:#059669;">₹${Number(data.totalRevenue).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
        </div>
        <div class="stat-card">
          <div class="label">Total Expenses</div>
          <div class="value" style="color:#dc2626;">₹${Number(data.totalExpenses).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
        </div>
        <div class="stat-card">
          <div class="label">Net Income</div>
          <div class="value" style="color:${data.netIncome >= 0 ? "#059669" : "#dc2626"};">₹${Number(data.netIncome).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
        </div>
        <div class="stat-card">
          <div class="label">Total Bills</div>
          <div class="value">${data.totalBills}</div>
        </div>
      </div>

      <div class="section">
        <h3>Top Products</h3>
        <table>
          <thead><tr><th>Product</th><th>Qty</th><th>Total</th></tr></thead>
          <tbody>
            ${data.topProducts.map((p) => `<tr><td>${p.name}</td><td>${p.quantity}</td><td>₹${Number(p.total).toFixed(2)}</td></tr>`).join("")}
          </tbody>
        </table>
      </div>

      <div class="section">
        <h3>Expense Breakdown</h3>
        <table>
          <thead><tr><th>Category</th><th>Amount</th></tr></thead>
          <tbody>
            ${data.expenseCategories.map((ec) => `<tr><td>${ec.category}</td><td>₹${Number(ec.total).toFixed(2)}</td></tr>`).join("")}
          </tbody>
        </table>
      </div>
    </div>
    <div class="footer">
      <p>Rawther Biryani Management System</p>
      <p>${format(new Date(), "MMMM d, yyyy h:mm a")}</p>
    </div>
  </div>
</body>
</html>`
}

function generateRevenueSummaryHTML(data: {
  totalRevenue: number
  cashTotal: number
  gpayTotal: number
  cardTotal: number
  splitTotal: number
  totalBills: number
  totalItems: number
  averageBill: number
}): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; padding:0; margin:0; background:#f6f8fa; }
  .container { max-width:600px; margin:0 auto; padding:20px; }
  .header { background:linear-gradient(135deg,#1e3a5f,#2d5a87); color:#fff; padding:30px; border-radius:12px 12px 0 0; text-align:center; }
  .header h1 { margin:0; font-size:22px; font-weight:600; }
  .header p { margin:4px 0 0; opacity:.8; font-size:13px; }
  .content { background:#fff; padding:24px; border-radius:0 0 12px 12px; }
  .stats-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:20px; }
  .stat-card { background:#f8f9fa; border-radius:8px; padding:14px; text-align:center; }
  .stat-card .label { font-size:11px; text-transform:uppercase; color:#666; letter-spacing:.5px; }
  .stat-card .value { font-size:20px; font-weight:700; margin-top:4px; }
  .payment-breakdown { margin-top:20px; }
  .payment-row { display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid #f0f0f0; font-size:14px; }
  .footer { text-align:center; padding:20px; font-size:11px; color:#999; }
</style></head>
<body>
  <div class="container">
    <div class="header">
      <h1>Revenue Summary</h1>
      <p>${format(new Date(), "MMMM yyyy")}</p>
    </div>
    <div class="content">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="label">Total Revenue</div>
          <div class="value" style="color:#059669;">₹${Number(data.totalRevenue).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
        </div>
        <div class="stat-card">
          <div class="label">Total Bills</div>
          <div class="value">${data.totalBills}</div>
        </div>
        <div class="stat-card">
          <div class="label">Items Sold</div>
          <div class="value">${data.totalItems}</div>
        </div>
        <div class="stat-card">
          <div class="label">Avg. Bill</div>
          <div class="value">₹${Number(data.averageBill).toFixed(2)}</div>
        </div>
      </div>

      <h3 style="font-size:14px;font-weight:600;margin:16px 0 10px;">Payment Mode Breakdown</h3>
      <div class="payment-breakdown">
        <div class="payment-row"><span>Cash</span><span style="font-weight:600;">₹${Number(data.cashTotal).toFixed(2)}</span></div>
        <div class="payment-row"><span>GPay</span><span style="font-weight:600;">₹${Number(data.gpayTotal).toFixed(2)}</span></div>
        <div class="payment-row"><span>Card</span><span style="font-weight:600;">₹${Number(data.cardTotal).toFixed(2)}</span></div>
        <div class="payment-row"><span>Split</span><span style="font-weight:600;">₹${Number(data.splitTotal).toFixed(2)}</span></div>
      </div>
    </div>
    <div class="footer">
      <p>Rawther Biryani Management System</p>
      <p>${format(new Date(), "MMMM d, yyyy h:mm a")}</p>
    </div>
  </div>
</body>
</html>`
}

function generateExpenseSummaryHTML(data: {
  totalExpenses: number
  totalCount: number
  categoryBreakdown: { category: string; total: number; count: number }[]
  modeBreakdown: Record<string, number>
}): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; padding:0; margin:0; background:#f6f8fa; }
  .container { max-width:600px; margin:0 auto; padding:20px; }
  .header { background:linear-gradient(135deg,#7f1d1d,#991b1b); color:#fff; padding:30px; border-radius:12px 12px 0 0; text-align:center; }
  .header h1 { margin:0; font-size:22px; font-weight:600; }
  .header p { margin:4px 0 0; opacity:.8; font-size:13px; }
  .content { background:#fff; padding:24px; border-radius:0 0 12px 12px; }
  .stats-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:20px; }
  .stat-card { background:#f8f9fa; border-radius:8px; padding:14px; text-align:center; }
  .stat-card .label { font-size:11px; text-transform:uppercase; color:#666; letter-spacing:.5px; }
  .stat-card .value { font-size:20px; font-weight:700; margin-top:4px; }
  .footer { text-align:center; padding:20px; font-size:11px; color:#999; }
</style></head>
<body>
  <div class="container">
    <div class="header">
      <h1>Expense Summary</h1>
      <p>${format(new Date(), "MMMM yyyy")}</p>
    </div>
    <div class="content">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="label">Total Expenses</div>
          <div class="value" style="color:#dc2626;">₹${Number(data.totalExpenses).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
        </div>
        <div class="stat-card">
          <div class="label">Total Entries</div>
          <div class="value">${data.totalCount}</div>
        </div>
      </div>

      <h3 style="font-size:14px;font-weight:600;margin:16px 0 10px;">Category Breakdown</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead><tr style="background:#f0f0f0;text-align:left;"><th style="padding:6px 8px;">Category</th><th style="padding:6px 8px;">Count</th><th style="padding:6px 8px;">Amount</th></tr></thead>
        <tbody>
          ${data.categoryBreakdown.map((c) => `<tr><td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;">${c.category}</td><td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;">${c.count}</td><td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;">₹${Number(c.total).toFixed(2)}</td></tr>`).join("")}
        </tbody>
      </table>

      <h3 style="font-size:14px;font-weight:600;margin:16px 0 10px;">Payment Mode</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead><tr style="background:#f0f0f0;text-align:left;"><th style="padding:6px 8px;">Mode</th><th style="padding:6px 8px;">Amount</th></tr></thead>
        <tbody>
          ${Object.entries(data.modeBreakdown).map(([mode, amount]) => `<tr><td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;">${mode}</td><td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;">₹${Number(amount).toFixed(2)}</td></tr>`).join("")}
        </tbody>
      </table>
    </div>
    <div class="footer">
      <p>Rawther Biryani Management System</p>
      <p>${format(new Date(), "MMMM d, yyyy h:mm a")}</p>
    </div>
  </div>
</body>
</html>`
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return apiError("Unauthorized", 401)

    const body = await request.json()
    const { type, recipient, subject: customSubject } = body

    if (!type || !recipient) {
      return apiError("Report type and recipient email are required")
    }

    const now = new Date()
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)

    let htmlContent = ""
    let subject = ""

    switch (type) {
      case "month-end": {
        const [bills, expenses] = await Promise.all([
          prisma.bill.findMany({
            where: {
              createdAt: { gte: monthStart, lte: monthEnd },
              status: "ACTIVE",
            },
            include: { items: true },
          }),
          prisma.expense.findMany({
            where: { date: { gte: monthStart, lte: monthEnd } },
            include: { category: { select: { name: true } } },
          }),
        ])

        const totalRevenue = bills.reduce((s, b) => s + Number(b.total), 0)
        const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0)

        const productMap = new Map<string, { name: string; quantity: number; total: number }>()
        for (const bill of bills) {
          for (const item of bill.items) {
            const existing = productMap.get(item.productName) || { name: item.productName, quantity: 0, total: 0 }
            existing.quantity += item.quantity
            existing.total += Number(item.total)
            productMap.set(item.productName, existing)
          }
        }

        const expenseCatMap = new Map<string, { category: string; total: number }>()
        for (const exp of expenses) {
          const cat = exp.category.name
          const existing = expenseCatMap.get(cat) || { category: cat, total: 0 }
          existing.total += Number(exp.amount)
          expenseCatMap.set(cat, existing)
        }

        const ordersCount = await prisma.order.count({
          where: { createdAt: { gte: monthStart, lte: monthEnd } },
        })

        htmlContent = generateMonthEndSummaryHTML({
          totalRevenue,
          totalExpenses,
          netIncome: totalRevenue - totalExpenses,
          totalBills: bills.length,
          totalOrders: ordersCount,
          topProducts: Array.from(productMap.values()).sort((a, b) => b.total - a.total).slice(0, 10),
          expenseCategories: Array.from(expenseCatMap.values()).sort((a, b) => b.total - a.total),
        })
        subject = `Month End Summary - ${format(now, "MMMM yyyy")}`
        break
      }

      case "revenue": {
        const bills = await prisma.bill.findMany({
          where: {
            createdAt: { gte: monthStart, lte: monthEnd },
            status: "ACTIVE",
          },
          include: { items: true },
        })

        const totalRevenue = bills.reduce((s, b) => s + Number(b.total), 0)
        const cashTotal = bills.filter((b) => b.paymentMode === "CASH").reduce((s, b) => s + Number(b.total), 0)
        const gpayTotal = bills.filter((b) => b.paymentMode === "GPAY").reduce((s, b) => s + Number(b.total), 0)
        const cardTotal = bills.filter((b) => b.paymentMode === "CARD").reduce((s, b) => s + Number(b.total), 0)
        const splitTotal = bills.filter((b) => b.paymentMode === "SPLIT").reduce((s, b) => s + Number(b.total), 0)
        const totalItems = bills.reduce((s, b) => s + b.items.reduce((si, i) => si + i.quantity, 0), 0)

        htmlContent = generateRevenueSummaryHTML({
          totalRevenue,
          cashTotal,
          gpayTotal,
          cardTotal,
          splitTotal,
          totalBills: bills.length,
          totalItems,
          averageBill: bills.length > 0 ? totalRevenue / bills.length : 0,
        })
        subject = `Revenue Summary - ${format(now, "MMMM yyyy")}`
        break
      }

      case "expense": {
        const expenses = await prisma.expense.findMany({
          where: { date: { gte: monthStart, lte: monthEnd } },
          include: { category: { select: { name: true } } },
        })

        const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0)
        const catMap = new Map<string, { category: string; total: number; count: number }>()
        for (const exp of expenses) {
          const cat = exp.category.name
          const existing = catMap.get(cat) || { category: cat, total: 0, count: 0 }
          existing.total += Number(exp.amount)
          existing.count++
          catMap.set(cat, existing)
        }

        const modeBreakdown: Record<string, number> = { CASH: 0, GPAY: 0, CARD: 0 }
        for (const exp of expenses) {
          const mode = exp.paymentMode as keyof typeof modeBreakdown
          if (mode in modeBreakdown) modeBreakdown[mode] += Number(exp.amount)
        }

        htmlContent = generateExpenseSummaryHTML({
          totalExpenses,
          totalCount: expenses.length,
          categoryBreakdown: Array.from(catMap.values()).sort((a, b) => b.total - a.total),
          modeBreakdown,
        })
        subject = `Expense Summary - ${format(now, "MMMM yyyy")}`
        break
      }

      default:
        return apiError("Invalid report type. Use month-end, revenue, or expense.")
    }

    const apiKey = process.env.RESEND_API_KEY

    if (apiKey) {
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: process.env.EMAIL_FROM || "noreply@rawtherbiryani.com",
            to: recipient,
            subject: customSubject || subject,
            html: htmlContent,
          }),
        })

        if (!res.ok) {
          const errData = await res.text()
          console.error("Resend API error:", errData)
        }

        const resData = await res.json()

        await prisma.dailyClosing.findFirst()

        return apiSuccess(
          { sent: true, id: resData.id },
          "Email report sent successfully"
        )
      } catch (sendError) {
        console.error("Failed to send email via Resend:", sendError)
        return apiSuccess(
          { sent: false, preview: htmlContent },
          "Report generated but email sending failed (preview available)"
        )
      }
    }

    return apiSuccess(
      {
        sent: false,
        preview: htmlContent,
        note: "RESEND_API_KEY not configured. Report preview generated.",
      },
      "Report generated (email not sent - configure RESEND_API_KEY)"
    )
  } catch (error) {
    return handleApiError(error)
  }
}
