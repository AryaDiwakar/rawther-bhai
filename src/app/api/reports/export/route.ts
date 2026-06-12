import { NextRequest } from "next/server"
import { apiError } from "@/lib/utils/api"
import { getCurrentUser } from "@/lib/auth/middleware"
import ExcelJS from "exceljs"

async function fetchReportData(url: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const response = await fetch(`${baseUrl}${url}`, {
    headers: { "Content-Type": "application/json" },
  })
  const data = await response.json()
  return data
}

function generateCSV(headers: string[], rows: string[][]): string {
  const escapeCsv = (val: string) => {
    if (val.includes(",") || val.includes('"') || val.includes("\n")) {
      return `"${val.replace(/"/g, '""')}"`
    }
    return val
  }
  const headerLine = headers.map(escapeCsv).join(",")
  const dataLines = rows.map((row) => row.map(escapeCsv).join(","))
  return [headerLine, ...dataLines].join("\n")
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return apiError("Unauthorized", 401)

    const { searchParams } = new URL(request.url)
    const format = searchParams.get("format") || "csv"
    const type = searchParams.get("type") || "sales"
    const dateFrom = searchParams.get("dateFrom") || ""
    const dateTo = searchParams.get("dateTo") || ""

    const apiUrl = `/api/reports?type=${type}&dateFrom=${dateFrom}&dateTo=${dateTo}`
    const result = await fetchReportData(apiUrl)

    if (!result.success) {
      return apiError("Failed to fetch report data")
    }

    const reportData = result.data

    switch (format) {
      case "csv": {
        let csvContent = ""

        if (type === "sales") {
          const headers = ["Bill No", "Customer", "Items", "Total (INR)", "Payment Mode", "Date"]
          const rows = reportData.bills.map((bill: Record<string, unknown>) => [
            String(bill.billNo),
            String(bill.customerName),
            String(bill.items),
            String(Number(bill.total).toFixed(2)),
            String(bill.paymentMode),
            new Date(bill.createdAt as string).toLocaleDateString(),
          ])
          csvContent = generateCSV(headers, rows)
        } else if (type === "expense") {
          const headers = ["Description", "Amount (INR)", "Category", "Vendor", "Payment Mode", "Date"]
          const rows = reportData.expenses.map((exp: Record<string, unknown>) => [
            String(exp.description),
            String(Number(exp.amount).toFixed(2)),
            String(exp.category),
            String(exp.vendor || "N/A"),
            String(exp.paymentMode),
            new Date(exp.date as string).toLocaleDateString(),
          ])
          csvContent = generateCSV(headers, rows)
        } else if (type === "collection") {
          const headers = ["Date", "Cash (INR)", "GPay (INR)", "Advance (INR)", "Balance (INR)"]
          const rows = reportData.collections.map((col: Record<string, unknown>) => [
            new Date(col.date as string).toLocaleDateString(),
            String(Number(col.cashAmount).toFixed(2)),
            String(Number(col.gpayAmount).toFixed(2)),
            String(Number(col.advanceAmount).toFixed(2)),
            String(Number(col.balanceAmount).toFixed(2)),
          ])
          csvContent = generateCSV(headers, rows)
        } else if (type === "profit-loss") {
          const headers = ["Date", "Revenue (INR)", "Expense (INR)"]
          const rows = reportData.dailyData.map((d: Record<string, unknown>) => [
            String(d.date),
            String(Number(d.revenue).toFixed(2)),
            String(Number(d.expense).toFixed(2)),
          ])
          csvContent = generateCSV(headers, rows)
        }

        return new Response(csvContent, {
          headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename="${type}-report-${dateFrom || "all"}-${dateTo || "all"}.csv"`,
          },
        })
      }

      case "excel": {
        const workbook = new ExcelJS.Workbook()
        const worksheet = workbook.addWorksheet(`${type.charAt(0).toUpperCase() + type.slice(1)} Report`)

        worksheet.columns = [
          { header: "Date", key: "date", width: 15 },
          { header: "Description", key: "description", width: 30 },
          { header: "Amount (INR)", key: "amount", width: 15 },
          { header: "Details", key: "details", width: 20 },
        ]

        worksheet.getRow(1).font = { bold: true }

        if (type === "sales") {
          worksheet.columns = [
            { header: "Bill No", key: "billNo", width: 15 },
            { header: "Customer", key: "customer", width: 25 },
            { header: "Items", key: "items", width: 10 },
            { header: "Total (INR)", key: "total", width: 15 },
            { header: "Payment Mode", key: "paymentMode", width: 15 },
            { header: "Date", key: "date", width: 15 },
          ]
          worksheet.getRow(1).font = { bold: true }
          reportData.bills.forEach((bill: Record<string, unknown>) => {
            worksheet.addRow({
              billNo: bill.billNo,
              customer: bill.customerName,
              items: bill.items,
              total: Number(bill.total).toFixed(2),
              paymentMode: bill.paymentMode,
              date: new Date(bill.createdAt as string).toLocaleDateString(),
            })
          })

          worksheet.addRow({})
          worksheet.addRow({ billNo: "Summary" })
          worksheet.addRow({ billNo: "Total Bills", customer: reportData.summary.totalBills })
          worksheet.addRow({ billNo: "Total Revenue", customer: reportData.summary.totalRevenue.toFixed(2) })
        } else if (type === "expense") {
          worksheet.columns = [
            { header: "Description", key: "description", width: 30 },
            { header: "Amount (INR)", key: "amount", width: 15 },
            { header: "Category", key: "category", width: 20 },
            { header: "Vendor", key: "vendor", width: 20 },
            { header: "Payment Mode", key: "paymentMode", width: 15 },
            { header: "Date", key: "date", width: 15 },
          ]
          worksheet.getRow(1).font = { bold: true }
          reportData.expenses.forEach((exp: Record<string, unknown>) => {
            worksheet.addRow({
              description: exp.description,
              amount: Number(exp.amount).toFixed(2),
              category: exp.category,
              vendor: exp.vendor || "N/A",
              paymentMode: exp.paymentMode,
              date: new Date(exp.date as string).toLocaleDateString(),
            })
          })
        } else if (type === "collection") {
          worksheet.columns = [
            { header: "Date", key: "date", width: 15 },
            { header: "Cash (INR)", key: "cash", width: 15 },
            { header: "GPay (INR)", key: "gpay", width: 15 },
            { header: "Advance (INR)", key: "advance", width: 15 },
            { header: "Balance (INR)", key: "balance", width: 15 },
          ]
          worksheet.getRow(1).font = { bold: true }
          reportData.collections.forEach((col: Record<string, unknown>) => {
            worksheet.addRow({
              date: new Date(col.date as string).toLocaleDateString(),
              cash: Number(col.cashAmount).toFixed(2),
              gpay: Number(col.gpayAmount).toFixed(2),
              advance: Number(col.advanceAmount).toFixed(2),
              balance: Number(col.balanceAmount).toFixed(2),
            })
          })
        } else if (type === "profit-loss") {
          worksheet.columns = [
            { header: "Date", key: "date", width: 15 },
            { header: "Revenue (INR)", key: "revenue", width: 15 },
            { header: "Expense (INR)", key: "expense", width: 15 },
          ]
          worksheet.getRow(1).font = { bold: true }
          reportData.dailyData.forEach((d: Record<string, unknown>) => {
            worksheet.addRow({
              date: d.date,
              revenue: Number(d.revenue).toFixed(2),
              expense: Number(d.expense).toFixed(2),
            })
          })
        }

        const buffer = await workbook.xlsx.writeBuffer()

        return new Response(buffer, {
          headers: {
            "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": `attachment; filename="${type}-report-${dateFrom || "all"}-${dateTo || "all"}.xlsx"`,
          },
        })
      }

      case "pdf": {
        const reportTitle = `${
          type === "sales" ? "Sales" : type === "expense" ? "Expense" : type === "collection" ? "Collection" : "Profit & Loss"
        } Report`

        let tableRows = ""

        if (type === "sales" && reportData.bills) {
          tableRows = reportData.bills
            .map(
              (bill: Record<string, unknown>) => `
            <tr>
              <td>${bill.billNo}</td>
              <td>${bill.customerName}</td>
              <td>${bill.items}</td>
              <td>₹${Number(bill.total).toFixed(2)}</td>
              <td>${bill.paymentMode}</td>
            </tr>`
            )
            .join("")
        } else if (type === "expense" && reportData.expenses) {
          tableRows = reportData.expenses
            .map(
              (exp: Record<string, unknown>) => `
            <tr>
              <td>${exp.description}</td>
              <td>₹${Number(exp.amount).toFixed(2)}</td>
              <td>${exp.category}</td>
              <td>${exp.vendor || "N/A"}</td>
            </tr>`
            )
            .join("")
        } else if (type === "collection" && reportData.collections) {
          tableRows = reportData.collections
            .map(
              (col: Record<string, unknown>) => `
            <tr>
              <td>${new Date(col.date as string).toLocaleDateString()}</td>
              <td>₹${Number(col.cashAmount).toFixed(2)}</td>
              <td>₹${Number(col.gpayAmount).toFixed(2)}</td>
              <td>₹${Number(col.advanceAmount).toFixed(2)}</td>
              <td>₹${Number(col.balanceAmount).toFixed(2)}</td>
            </tr>`
            )
            .join("")
        } else if (type === "profit-loss" && reportData.dailyData) {
          tableRows = reportData.dailyData
            .map(
              (d: Record<string, unknown>) => `
            <tr>
              <td>${d.date}</td>
              <td>₹${Number(d.revenue).toFixed(2)}</td>
              <td>₹${Number(d.expense).toFixed(2)}</td>
            </tr>`
            )
            .join("")
        }

        const summaryHtml = reportData.summary
          ? `<div style="margin-bottom:20px;padding:15px;background:#f5f5f5;border-radius:8px;">
              ${Object.entries(reportData.summary)
                .map(
                  ([key, val]) =>
                    `<p style="margin:4px 0;font-size:13px;"><strong>${key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}:</strong> ${typeof val === "number" ? (key.includes("total") || key.includes("revenue") || key.includes("expense") || key.includes("profit") ? "₹" : "") + Number(val).toFixed(2) : String(val)}</p>`
                )
                .join("")}
            </div>`
          : ""

        const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${reportTitle}</title></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;padding:30px;color:#1a1a1a;">
  <h1 style="font-size:22px;margin-bottom:5px;">${reportTitle}</h1>
  <p style="color:#666;font-size:13px;margin-bottom:20px;">${dateFrom || "Start"} to ${dateTo || "End"}</p>
  ${summaryHtml}
  <table style="width:100%;border-collapse:collapse;font-size:13px;">
    <thead>
      <tr style="background:#f0f0f0;text-align:left;">
        ${tableRows ? Object.keys(reportData.bills?.[0] || reportData.expenses?.[0] || reportData.collections?.[0] || reportData.dailyData?.[0] || {})
          .filter((k) => k !== "id")
          .map((k) => `<th style="padding:8px 10px;border-bottom:2px solid #ddd;">${k.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}</th>`)
          .join("") : ""}
      </tr>
    </thead>
    <tbody>
      ${tableRows || "<tr><td colspan='4' style='padding:20px;text-align:center;color:#999;'>No data available</td></tr>"}
    </tbody>
  </table>
  <p style="margin-top:30px;font-size:11px;color:#999;text-align:center;">Generated by Rawther Biryani Management System</p>
</body>
</html>`

        return new Response(html, {
          headers: {
            "Content-Type": "text/html",
            "Content-Disposition": `attachment; filename="${type}-report-${dateFrom || "all"}-${dateTo || "all"}.html"`,
          },
        })
      }

      default:
        return apiError("Invalid export format. Use csv, excel, or pdf.")
    }
  } catch (error) {
    console.error("Export error:", error)
    return apiError("Failed to generate export")
  }
}
