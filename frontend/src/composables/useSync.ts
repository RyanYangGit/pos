import { ref } from 'vue'
import { startSync, stopSync } from '@/services/sync'

const syncEnabled = ref(false)
const lastSyncAt = ref<number | null>(null)
const isSyncing = ref(false)

export function useSync() {
  async function toggleSync(enabled: boolean) {
    syncEnabled.value = enabled
    if (enabled) {
      isSyncing.value = true
      try {
        await startSync()
      } finally {
        isSyncing.value = false
      }
    } else {
      await stopSync()
    }
  }

  return {
    syncEnabled,
    lastSyncAt,
    isSyncing,
    toggleSync,
  }
}
