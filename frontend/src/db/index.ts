// Lightweight mock DB using localStorage for persistence
// Mimics RxDB API including reactive find().$.subscribe()

export type PosCollections = any
export type PosDatabase = any

const STORAGE_KEY = 'pos_mock_db'

type Listener = () => void
const listeners: Record<string, Set<Listener>> = {}

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

function notify(name: string) {
  listeners[name]?.forEach(fn => fn())
}

function wrapDoc(name: string, item: any) {
  return {
    ...item,
    toJSON: () => ({ ...item }),
    get isActive() { return item.isActive },
    patch: (data: any) => {
      const s = loadStore()
      const arr = s[name] || []
      const idx = arr.findIndex((r: any) => r.id === item.id)
      if (idx >= 0) {
        arr[idx] = { ...arr[idx], ...data }
        s[name] = arr
        saveStore(s)
        notify(name)
      }
      return Promise.resolve()
    },
    remove: () => {
      const s = loadStore()
      const arr = s[name] || []
      s[name] = arr.filter((r: any) => r.id !== item.id)
      saveStore(s)
      notify(name)
      return Promise.resolve()
    },
  }
}

function createCollection(name: string) {
  if (!listeners[name]) listeners[name] = new Set()

  function getItems() {
    const store = loadStore()
    return (store[name] || []).map((item: any) => wrapDoc(name, item))
  }

  return {
    find: (_opts?: any) => {
      const query = {
        exec: () => Promise.resolve(getItems()),
        remove: () => {
          const store = loadStore()
          store[name] = []
          saveStore(store)
          notify(name)
          return Promise.resolve()
        },
        // RxDB-compatible reactive Observable
        $: {
          subscribe: (callback: (docs: any[]) => void) => {
            // Emit current data immediately
            callback(getItems())
            // Re-emit on changes
            const listener = () => callback(getItems())
            listeners[name]!.add(listener)
            return { unsubscribe: () => { listeners[name]!.delete(listener) } }
          },
        },
      }
      return query
    },
    findOne: (id: string) => ({
      exec: () => {
        const store = loadStore()
        const items = store[name] || []
        const item = items.find((r: any) => r.id === id) || null
        if (!item) return Promise.resolve(null)
        return Promise.resolve(wrapDoc(name, item))
      },
    }),
    insert: (doc: any) => {
      const store = loadStore()
      if (!store[name]) store[name] = []
      store[name].push(doc)
      saveStore(store)
      notify(name)
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
      notify(name)
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

  // Ensure app_settings 'default' document exists
  const settings = await mockDb.app_settings.findOne('default').exec()
  if (!settings) {
    await mockDb.app_settings.insert({
      id: 'default',
      shopName: '',
      deviceName: 'POS-1',
      orderPrefix: 'A',
      nextOrderSeq: 1,
      lastOrderDate: '',
    })
  }

  return mockDb
}

export function getDatabase(): any {
  if (!ready) throw new Error('Database not initialized')
  return mockDb
}
