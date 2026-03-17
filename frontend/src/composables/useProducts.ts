import { ref, onMounted, onUnmounted } from 'vue'
import type { Subscription } from 'rxjs'
import { getDatabase } from '@/db'
import type { ProductDoc } from '@/db/schemas/product'
import { generateId } from '@/utils/id'

export function useProducts() {
  const products = ref<ProductDoc[]>([])
  let sub: Subscription | null = null

  onMounted(() => {
    const db = getDatabase()
    sub = db.products
      .find({ sort: [{ sortOrder: 'asc' }] })
      .$.subscribe(docs => {
        products.value = docs.map(d => d.toJSON() as ProductDoc)
      })
  })

  onUnmounted(() => {
    sub?.unsubscribe()
  })

  function getActiveProducts(categoryId?: string | null) {
    if (!categoryId) {
      return products.value.filter(p => p.isActive)
    }
    return products.value.filter(p => p.isActive && p.categoryId === categoryId)
  }

  async function addProduct(data: Omit<ProductDoc, 'id' | 'createdAt' | 'updatedAt'>) {
    const db = getDatabase()
    await db.products.insert({
      ...data,
      id: generateId(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
  }

  async function updateProduct(id: string, data: Partial<ProductDoc>) {
    const db = getDatabase()
    const doc = await db.products.findOne(id).exec()
    if (doc) {
      await doc.patch({ ...data, updatedAt: Date.now() })
    }
  }

  async function deleteProduct(id: string) {
    const db = getDatabase()
    const doc = await db.products.findOne(id).exec()
    if (doc) {
      await doc.remove()
    }
  }

  async function toggleProduct(id: string) {
    const db = getDatabase()
    const doc = await db.products.findOne(id).exec()
    if (doc) {
      await doc.patch({ isActive: !doc.isActive, updatedAt: Date.now() })
    }
  }

  function findByBarcode(code: string): ProductDoc | undefined {
    return products.value.find(p => p.barcode === code && p.isActive)
  }

  async function importProducts(rows: Array<{
    name: string
    price: number
    stock: number | null
    barcode: string | null
    categoryId: string
  }>) {
    const db = getDatabase()
    let created = 0
    let updated = 0
    for (const row of rows) {
      // Match by barcode if available, otherwise by name
      const existing = row.barcode
        ? products.value.find(p => p.barcode === row.barcode)
        : products.value.find(p => p.name === row.name)
      if (existing) {
        const doc = await db.products.findOne(existing.id).exec()
        if (doc) {
          await doc.patch({
            name: row.name,
            price: row.price,
            stock: row.stock,
            barcode: row.barcode,
            updatedAt: Date.now(),
          })
          updated++
        }
      } else {
        await db.products.insert({
          id: generateId(),
          categoryId: row.categoryId,
          name: row.name,
          price: row.price,
          stock: row.stock,
          barcode: row.barcode,
          imageDataUrl: null,
          isActive: true,
          sortOrder: products.value.length + created,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
        created++
      }
    }
    return { created, updated }
  }

  return { products, getActiveProducts, findByBarcode, addProduct, updateProduct, deleteProduct, toggleProduct, importProducts }
}
