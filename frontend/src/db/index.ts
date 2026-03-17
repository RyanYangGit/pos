// Lightweight mock DB using localStorage for persistence
// Replaces RxDB to keep bundle small for low-end Android tablets

export type PosCollections = any
export type PosDatabase = any

const STORAGE_KEY = 'pos_mock_db'

function loadStore(): Record<string, any[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveStore(store: Record<string, any[]>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

function createCollection(name: string) {
  return {
    find: () => ({
      exec: () => {
        const store = loadStore()
        const items = store[name] || []
        return Promise.resolve(
          items.map((item: any) => ({
            toJSON: () => ({ ...item }),
            patch: (data: any) => {
              const s = loadStore()
              const arr = s[name] || []
              const idx = arr.findIndex((r: any) => r.id === item.id)
              if (idx >= 0) {
                arr[idx] = { ...arr[idx], ...data }
                s[name] = arr
                saveStore(s)
              }
              return Promise.resolve()
            },
          }))
        )
      },
      remove: () => {
        const store = loadStore()
        store[name] = []
        saveStore(store)
        return Promise.resolve()
      },
    }),
    findOne: (id: string) => ({
      exec: () => {
        const store = loadStore()
        const items = store[name] || []
        const item = items.find((r: any) => r.id === id) || null
        if (!item) return Promise.resolve(null)
        return Promise.resolve({
          toJSON: () => ({ ...item }),
          patch: (data: any) => {
            const s = loadStore()
            const arr = s[name] || []
            const idx = arr.findIndex((r: any) => r.id === id)
            if (idx >= 0) {
              arr[idx] = { ...arr[idx], ...data }
              s[name] = arr
              saveStore(s)
            }
            return Promise.resolve()
          },
        })
      },
    }),
    insert: (doc: any) => {
      const store = loadStore()
      if (!store[name]) store[name] = []
      store[name].push(doc)
      saveStore(store)
      return Promise.resolve(doc)
    },
    upsert: (doc: any) => {
      const store = loadStore()
      if (!store[name]) store[name] = []
      const idx = store[name].findIndex((r: any) => r.id === doc.id)
      if (idx >= 0) {
        store[name][idx] = doc
      } else {
        store[name].push(doc)
      }
      saveStore(store)
      return Promise.resolve(doc)
    },
    count: () => ({
      exec: () => {
        const store = loadStore()
        return Promise.resolve((store[name] || []).length)
      },
    }),
  }
}

const mockDb = {
  categories: createCollection('categories'),
  products: createCollection('products'),
  orders: createCollection('orders'),
  app_settings: createCollection('app_settings'),
  users: createCollection('users'),
}

let ready = false

export async function initDatabase(): Promise<any> {
  console.log('[MOCK-DB] init (localStorage-backed)')
  ready = true
  return mockDb
}

export function getDatabase(): any {
  if (!ready) throw new Error('Database not initialized')
  return mockDb
}
