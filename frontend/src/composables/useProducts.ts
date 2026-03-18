import { ref, onMounted, onUnmounted } from 'vue'
import { getDatabase } from '@/db'
import { authHeaders } from '@/utils/token'
import type { ProductDoc } from '@/db/schemas/product'
import { generateId } from '@/utils/id'

export function useProducts() {
  const products = ref<ProductDoc[]>([])
  let unsub: (() => void) | null = null
  let syncTimer: ReturnType<typeof setInterval> | null = null

  function loadLocal() {
    const db = getDatabase()
    const sub = db.products.find().$.subscribe((docs: any[]) => {
      products.value = docs.map((d: any) => d.toJSON() as ProductDoc)
    })
    unsub = () => sub.unsubscribe()
  }

  // Pull from server → overwrite local DB
  async function pullFromServer() {
    try {
      const res = await fetch('/api/products', { headers: authHeaders() })
      if (!res.ok) return
      const data = await res.json()
      const db = getDatabase()
      await db.products.find().remove()
      for (const p of data) {
        await db.products.insert({
          id: p.id,
          name: p.name,
          price: p.price,
          stock: p.stock,
          barcode: p.barcode,
          categoryId: p.category_id,
          imageDataUrl: null,
          isActive: p.is_active,
          sortOrder: p.sort_order ?? 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      }
    } catch { /* offline — use local data */ }
  }

  onMounted(async () => {
    loadLocal()
    await pullFromServer()
    syncTimer = setInterval(pullFromServer, 30_000)
  })

  onUnmounted(() => {
    unsub?.()
    if (syncTimer) clearInterval(syncTimer)
  })

  function getActiveProducts(categoryId?: string | null) {
    if (!categoryId) return products.value.filter(p => p.isActive)
    return products.value.filter(p => p.isActive && p.categoryId === categoryId)
  }

  async function addProduct(data: Omit<ProductDoc, 'id' | 'createdAt' | 'updatedAt'>) {
    const db = getDatabase()
    const id = generateId()
    // Write local
    await db.products.insert({
      ...data, id,
      createdAt: Date.now(), updatedAt: Date.now(),
    })
    // Push to server
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          name: data.name, price: data.price,
          stock: data.stock ?? null, barcode: data.barcode ?? null,
          category_id: data.categoryId,
          is_active: data.isActive ?? true,
          sort_order: data.sortOrder ?? 0,
        }),
      })
      if (res.ok) await pullFromServer()
    } catch { /* offline */ }
  }

  async function updateProduct(id: string, data: Partial<ProductDoc>) {
    const db = getDatabase()
    const doc = await db.products.findOne(id).exec()
    if (doc) await doc.patch({ ...data, updatedAt: Date.now() })
    // Push to server
    try {
      const body: any = {}
      if (data.name !== undefined) body.name = data.name
      if (data.price !== undefined) body.price = data.price
      if ('stock' in data) body.stock = data.stock
      if ('barcode' in data) body.barcode = data.barcode
      if (data.categoryId !== undefined) body.category_id = data.categoryId
      if (data.isActive !== undefined) body.is_active = data.isActive
      if (data.sortOrder !== undefined) body.sort_order = data.sortOrder
      await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(body),
      })
    } catch { /* offline */ }
  }

  async function deleteProduct(id: string) {
    const db = getDatabase()
    const doc = await db.products.findOne(id).exec()
    if (doc) await doc.remove()
    try {
      await fetch(`/api/products/${id}`, {
        method: 'DELETE', headers: authHeaders(),
      })
    } catch { /* offline */ }
  }

  async function toggleProduct(id: string) {
    const prod = products.value.find(p => p.id === id)
    if (!prod) return
    await updateProduct(id, { isActive: !prod.isActive })
  }

  function findByBarcode(code: string): ProductDoc | undefined {
    return products.value.find(p => p.barcode === code && p.isActive)
  }

  async function importProducts(rows: Array<{
    name: string; price: number; stock: number | null
    barcode: string | null; categoryId: string
  }>) {
    let created = 0
    let updated = 0
    for (const row of rows) {
      const existing = row.barcode
        ? products.value.find(p => p.barcode === row.barcode)
        : products.value.find(p => p.name === row.name)
      if (existing) {
        await updateProduct(existing.id, {
          name: row.name, price: row.price,
          stock: row.stock, barcode: row.barcode,
        })
        updated++
      } else {
        await addProduct({
          categoryId: row.categoryId,
          name: row.name, price: row.price,
          stock: row.stock, barcode: row.barcode,
          imageDataUrl: null, isActive: true,
          sortOrder: products.value.length + created,
        })
        created++
      }
    }
    return { created, updated }
  }

  return { products, loadProducts: pullFromServer, getActiveProducts, findByBarcode, addProduct, updateProduct, deleteProduct, toggleProduct, importProducts }
}
