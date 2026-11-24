import { ref, onMounted, onUnmounted } from 'vue'
import { getDatabase } from '@/db'
import { authHeaders } from '@/utils/token'

export interface VendorDoc {
  id: string
  name: string
  isActive: boolean
  sortOrder: number
  productCount: number
}

async function errorDetail(res: Response, fallback: string): Promise<string> {
  const body = await res.json().catch(() => null)
  return body?.detail || fallback
}

// Vendors are managed online only (rare admin task); the local copy lets checkout
// snapshot vendor names while offline.
export function useVendors() {
  const vendors = ref<VendorDoc[]>([])
  let unsub: (() => void) | null = null
  let syncTimer: ReturnType<typeof setInterval> | null = null

  function loadLocal() {
    const db = getDatabase()
    const sub = db.vendors.find().$.subscribe((docs: any[]) => {
      vendors.value = docs
        .map((d: any) => d.toJSON() as VendorDoc)
        .sort((a: VendorDoc, b: VendorDoc) => a.sortOrder - b.sortOrder)
    })
    unsub = () => sub.unsubscribe()
  }

  async function pullFromServer() {
    try {
      const res = await fetch('/api/vendors', { headers: authHeaders() })
      if (!res.ok) return
      const data = await res.json()
      const db = getDatabase()
      await db.vendors.find().remove()
      for (const v of data) {
        await db.vendors.insert({
          id: v.id,
          name: v.name,
          isActive: v.is_active,
          sortOrder: v.sort_order ?? 0,
          productCount: v.product_count ?? 0,
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

  async function send(url: string, method: string, body?: unknown, fallback = '操作失敗') {
    let res: Response
    try {
      res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: body === undefined ? undefined : JSON.stringify(body),
      })
    } catch {
      throw new Error('需要網路連線才能管理廠商')
    }
    if (!res.ok) throw new Error(await errorDetail(res, fallback))
    await pullFromServer()
    return res.json()
  }

  async function addVendor(name: string): Promise<VendorDoc> {
    const v = await send('/api/vendors', 'POST', { name }, '新增失敗')
    return vendors.value.find(x => x.id === v.id)!
  }

  const renameVendor = (id: string, name: string) => send(`/api/vendors/${id}`, 'PUT', { name }, '修改失敗')
  const deleteVendor = (id: string) => send(`/api/vendors/${id}`, 'DELETE', undefined, '刪除失敗')

  return { vendors, loadVendors: pullFromServer, addVendor, renameVendor, deleteVendor }
}
