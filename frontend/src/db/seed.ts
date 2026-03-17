import type { PosDatabase } from './index'
import { generateId } from '../utils/id'

export async function seedDatabase(db: PosDatabase): Promise<void> {
  const now = Date.now()

  // Categories
  const cat0 = { id: generateId(), name: '陶瓷', sortOrder: 0, createdAt: now, updatedAt: now }
  const cat1 = { id: generateId(), name: '飾品', sortOrder: 1, createdAt: now, updatedAt: now }
  const cat2 = { id: generateId(), name: '版畫', sortOrder: 2, createdAt: now, updatedAt: now }
  const cat3 = { id: generateId(), name: '其他', sortOrder: 3, createdAt: now, updatedAt: now }
  const categories = [cat0, cat1, cat2, cat3]

  await db.categories.bulkInsert(categories)

  // Products
  const products = [
    { id: generateId(), categoryId: cat0.id, name: '手作陶杯 - 藍', price: 480, stock: 10, barcode: null, imageDataUrl: null, isActive: true, sortOrder: 0, createdAt: now, updatedAt: now },
    { id: generateId(), categoryId: cat0.id, name: '手作陶杯 - 白', price: 480, stock: 8, barcode: null, imageDataUrl: null, isActive: true, sortOrder: 1, createdAt: now, updatedAt: now },
    { id: generateId(), categoryId: cat0.id, name: '陶盤 - 淺碟', price: 380, stock: 15, barcode: null, imageDataUrl: null, isActive: true, sortOrder: 2, createdAt: now, updatedAt: now },
    { id: generateId(), categoryId: cat0.id, name: '花瓶 - 青釉', price: 650, stock: 5, barcode: null, imageDataUrl: null, isActive: true, sortOrder: 3, createdAt: now, updatedAt: now },
    { id: generateId(), categoryId: cat1.id, name: '銀飾耳環', price: 320, stock: 20, barcode: null, imageDataUrl: null, isActive: true, sortOrder: 0, createdAt: now, updatedAt: now },
    { id: generateId(), categoryId: cat1.id, name: '手工項鍊', price: 580, stock: 12, barcode: null, imageDataUrl: null, isActive: true, sortOrder: 1, createdAt: now, updatedAt: now },
    { id: generateId(), categoryId: cat1.id, name: '琉璃手鏈', price: 420, stock: 8, barcode: null, imageDataUrl: null, isActive: true, sortOrder: 2, createdAt: now, updatedAt: now },
    { id: generateId(), categoryId: cat2.id, name: '版畫 - 山景', price: 1200, stock: 3, barcode: null, imageDataUrl: null, isActive: true, sortOrder: 0, createdAt: now, updatedAt: now },
    { id: generateId(), categoryId: cat2.id, name: '版畫 - 海浪', price: 1500, stock: 2, barcode: null, imageDataUrl: null, isActive: true, sortOrder: 1, createdAt: now, updatedAt: now },
    { id: generateId(), categoryId: cat3.id, name: '明信片組', price: 150, stock: null, barcode: null, imageDataUrl: null, isActive: true, sortOrder: 0, createdAt: now, updatedAt: now },
    { id: generateId(), categoryId: cat3.id, name: '展覽圖錄', price: 350, stock: 30, barcode: null, imageDataUrl: null, isActive: true, sortOrder: 1, createdAt: now, updatedAt: now },
  ]

  await db.products.bulkInsert(products)
}
