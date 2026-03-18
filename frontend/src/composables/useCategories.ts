import { ref, onMounted, onUnmounted } from 'vue'
import { getDatabase } from '@/db'
import { authHeaders } from '@/utils/token'
import type { CategoryDoc } from '@/db/schemas/category'
import { generateId } from '@/utils/id'

export function useCategories() {
  const categories = ref<CategoryDoc[]>([])
  let unsub: (() => void) | null = null
  let syncTimer: ReturnType<typeof setInterval> | null = null

  function loadLocal() {
    const db = getDatabase()
    const sub = db.categories.find().$.subscribe((docs: any[]) => {
      categories.value = docs.map((d: any) => d.toJSON() as CategoryDoc)
    })
    unsub = () => sub.unsubscribe()
  }

  // Pull from server → overwrite local DB
  async function pullFromServer() {
    try {
      const res = await fetch('/api/categories', { headers: authHeaders() })
      if (!res.ok) return
      const data = await res.json()
      const db = getDatabase()
      // Clear local and replace with server data
      await db.categories.find().remove()
      for (const c of data) {
        await db.categories.insert({
          id: c.id,
          name: c.name,
          sortOrder: c.sort_order ?? 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      }
    } catch { /* offline — use local data */ }
  }

  onMounted(async () => {
    loadLocal()
    await pullFromServer()
    // Sync every 30 seconds
    syncTimer = setInterval(pullFromServer, 30_000)
  })

  onUnmounted(() => {
    unsub?.()
    if (syncTimer) clearInterval(syncTimer)
  })

  async function addCategory(name: string) {
    const db = getDatabase()
    const id = generateId()
    const count = categories.value.length
    // Write local first
    await db.categories.insert({
      id, name, sortOrder: count,
      createdAt: Date.now(), updatedAt: Date.now(),
    })
    // Push to server
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ name }),
      })
      if (res.ok) await pullFromServer() // get server-assigned ID
    } catch { /* offline — local write already done */ }
  }

  async function updateCategory(id: string, name: string) {
    const db = getDatabase()
    const doc = await db.categories.findOne(id).exec()
    if (doc) await doc.patch({ name, updatedAt: Date.now() })
    try {
      await fetch(`/api/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ name }),
      })
    } catch { /* offline */ }
  }

  async function deleteCategory(id: string) {
    const db = getDatabase()
    const doc = await db.categories.findOne(id).exec()
    if (doc) await doc.remove()
    try {
      await fetch(`/api/categories/${id}`, {
        method: 'DELETE', headers: authHeaders(),
      })
    } catch { /* offline */ }
  }

  return { categories, addCategory, updateCategory, deleteCategory, pullFromServer }
}
