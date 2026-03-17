import { replicateRxCollection } from 'rxdb/plugins/replication'
import type { RxCollection } from 'rxdb'
import { getDatabase } from '@/db'
import { authHeaders } from '@/utils/token'

const API_BASE = '/api/sync'

function createReplication(
  collection: RxCollection,
  endpoint: string,
  options: { push?: boolean; pull?: boolean } = { push: true, pull: true },
) {
  return replicateRxCollection({
    collection,
    replicationIdentifier: `sync-${collection.name}`,
    live: true,
    retryTime: 10000,
    autoStart: false,
    pull: options.pull
      ? {
          async handler(checkpoint, batchSize) {
            const res = await fetch(`${API_BASE}/${endpoint}/pull`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', ...authHeaders() },
              body: JSON.stringify({
                checkpoint: checkpoint || null,
                limit: batchSize,
              }),
            })
            const data = await res.json()
            return {
              documents: data.documents,
              checkpoint: data.checkpoint,
            }
          },
        }
      : undefined,
    push: options.push
      ? {
          async handler(changeRows) {
            const res = await fetch(`${API_BASE}/${endpoint}/push`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', ...authHeaders() },
              body: JSON.stringify({ changeRows }),
            })
            const data = await res.json()
            return data.conflicts || []
          },
        }
      : undefined,
  })
}

let replications: ReturnType<typeof replicateRxCollection>[] = []

export async function startSync() {
  const db = getDatabase()

  replications = [
    createReplication(db.categories, 'categories'),
    createReplication(db.products, 'products'),
    createReplication(db.orders, 'orders', { push: true, pull: false }),
  ]

  for (const rep of replications) {
    await rep.start()
  }
}

export async function stopSync() {
  for (const rep of replications) {
    await rep.cancel()
  }
  replications = []
}
