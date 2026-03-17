<script setup lang="ts">
import { useNetworkStatus } from '@/composables/useNetworkStatus'
import { LOCALE } from '@/constants/locale'

const { isOnline } = useNetworkStatus()
</script>

<template>
  <div
    class="flex items-center gap-1.5 px-3 py-1 text-xs font-medium"
    :class="isOnline ? 'bg-success text-white' : 'bg-warning text-white'"
  >
    <span class="inline-block w-2 h-2 rounded-full" :class="isOnline ? 'bg-green-200' : 'bg-orange-200'" />
    {{ isOnline ? LOCALE.online : LOCALE.offline }}
  </div>
</template>
