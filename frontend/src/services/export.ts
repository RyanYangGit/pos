import { getDatabase } from '@/db'
import type { OrderDoc } from '@/db/schemas/order'
import { PAYMENT_LABEL, type PaymentMethod } from '@/constants/payment'
import { formatDateTime } from '@/utils/format'

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export async function exportOrdersCsv() {
  const db = getDatabase()
  const orders = await db.orders.find({ sort: [{ createdAt: 'desc' }] }).exec()
  const rows: Record<string, string | number>[] = []

  for (const order of orders) {
    const data = order.toJSON() as OrderDoc
    for (const item of data.items) {
      rows.push({
        '單號': data.orderNumber,
        '時間': formatDateTime(data.createdAt),
        '商品名稱': item.productName,
        '單價': item.unitPrice,
        '數量': item.quantity,
        '小計': item.subtotal,
        '付款方式': PAYMENT_LABEL[data.paymentMethod as PaymentMethod],
        '訂單總額': data.totalAmount,
        '備註': data.note || '',
      })
    }
  }

  // BOM for Excel to display Chinese correctly
  const Papa = await import('papaparse')
  const BOM = '\uFEFF'
  const csv = BOM + Papa.default.unparse(rows)
  const date = new Date().toISOString().slice(0, 10)
  downloadFile(csv, `orders_${date}.csv`, 'text/csv;charset=utf-8')
}

export async function exportAllJson() {
  const db = getDatabase()
  const [categories, products, orders, settings] = await Promise.all([
    db.categories.find().exec(),
    db.products.find().exec(),
    db.orders.find().exec(),
    db.app_settings.find().exec(),
  ])

  const data = {
    exportedAt: new Date().toISOString(),
    categories: categories.map(d => d.toJSON()),
    products: products.map(d => d.toJSON()),
    orders: orders.map(d => d.toJSON()),
    settings: settings.map(d => d.toJSON()),
  }

  const json = JSON.stringify(data, null, 2)
  const date = new Date().toISOString().slice(0, 10)
  downloadFile(json, `pos_backup_${date}.json`, 'application/json')
}

export async function importJson(file: File) {
  const text = await file.text()
  const data = JSON.parse(text)
  const db = getDatabase()

  if (data.categories) {
    for (const cat of data.categories) {
      await db.categories.upsert(cat)
    }
  }
  if (data.products) {
    for (const prod of data.products) {
      await db.products.upsert(prod)
    }
  }
  if (data.orders) {
    for (const order of data.orders) {
      await db.orders.upsert(order)
    }
  }
  if (data.settings) {
    for (const s of data.settings) {
      await db.app_settings.upsert(s)
    }
  }
}
