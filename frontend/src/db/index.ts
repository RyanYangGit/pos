// TEMPORARY: No RxDB at all — pure mock to test if app renders

export type PosCollections = any
export type PosDatabase = any

const mockCollection = {
  find: () => ({ exec: () => Promise.resolve([]), remove: () => Promise.resolve() }),
  findOne: (_id: string) => ({ exec: () => Promise.resolve(null), patch: (_data: any) => Promise.resolve() }),
  insert: (_doc: any) => Promise.resolve({}),
  count: () => ({ exec: () => Promise.resolve(0) }),
}

const mockDb = {
  categories: mockCollection,
  products: mockCollection,
  orders: mockCollection,
  app_settings: mockCollection,
  users: mockCollection,
}

let ready = false

export async function initDatabase(): Promise<any> {
  console.log('[MOCK-DB] init (no RxDB)')
  ready = true
  return mockDb
}

export function getDatabase(): any {
  if (!ready) throw new Error('Database not initialized')
  return mockDb
}
