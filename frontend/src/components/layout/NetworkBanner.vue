<script setup lang="ts">
import { useNetworkStatus } from '@/composables/useNetworkStatus'
import { LOCALE } from '@/constants/locale'

const { isOnline } = useNetworkStatus()
</script>

<template>
  <div
    class="d-flex align-items-center gap-1 px-3 py-1 small fw-medium text-white"
    :class="isOnline ? 'banner-online' : 'banner-offline'"
  >
    <span class="status-dot rounded-circle" :class="isOnline ? 'dot-online' : 'dot-offline'" />
    {{ isOnline ? LOCALE.online : LOCALE.offline }}
  </div>
</template>

<style scoped>
.banner-online {
  background-color: var(--c-success, #22c55e);
}

.banner-offline {
  background-color: var(--c-warning, #f59e0b);
}

.status-dot {
  display: inline-block;
  width: 0.5rem;
  height: 0.5rem;
}

.dot-online {
  background-color: #bbf7d0;
}

.dot-offline {
  background-color: #fed7aa;
}
</style>
