import { ref, onMounted, onUnmounted } from 'vue'
import type { Subscription } from 'rxjs'
import { getDatabase } from '@/db'
import type { CategoryDoc } from '@/db/schemas/category'
import { generateId } from '@/utils/id'

export function useCategories() {
  const categories = ref<CategoryDoc[]>([])
  let sub: Subscription | null = null

  onMounted(() => {
    const db = getDatabase()
    sub = db.categories
      .find({ sort: [{ sortOrder: 'asc' }] })
      .$.subscribe(docs => {
        categories.value = docs.map(d => d.toJSON() as CategoryDoc)
      })
  })

  onUnmounted(() => {
    sub?.unsubscribe()
  })

  async function addCategory(name: string) {
    const db = getDatabase()
    const count = await db.categories.count().exec()
    await db.categories.insert({
      id: generateId(),
      name,
      sortOrder: count,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
  }

  async function updateCategory(id: string, name: string) {
    const db = getDatabase()
    const doc = await db.categories.findOne(id).exec()
    if (doc) {
      await doc.patch({ name, updatedAt: Date.now() })
    }
  }

  async function deleteCategory(id: string) {
    const db = getDatabase()
    const doc = await db.categories.findOne(id).exec()
    if (doc) {
      await doc.remove()
    }
  }

  return { categories, addCategory, updateCategory, deleteCategory }
}
