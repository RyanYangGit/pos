<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { getTabsForRole } from '@/constants/roles'
import { LOCALE } from '@/constants/locale'

const route = useRoute()
const router = useRouter()
const { userRole, lock } = useAuth()

const tabs = computed(() =>
  userRole.value ? getTabsForRole(userRole.value) : []
)

function isActive(path: string) {
  return route.path.startsWith(path)
}
</script>

<template>
  <nav class="w-20 bg-primary text-white flex flex-col items-center pt-4 shrink-0">
    <div class="text-xs font-bold mb-6 opacity-80">POS</div>
    <button
      v-for="tab in tabs"
      :key="tab.path"
      class="w-full flex flex-col items-center gap-1 py-3 text-xs transition-colors active:scale-95 active:bg-opacity-80"
      :class="isActive(tab.path) ? 'bg-white/20' : 'hover:bg-white/10'"
      @click="router.push(tab.path)"
    >
      <span class="text-xl">{{ tab.emoji }}</span>
      <span>{{ tab.label }}</span>
    </button>

    <div class="mt-auto mb-4">
      <button
        class="w-full flex flex-col items-center gap-1 py-3 text-xs hover:bg-white/10 transition-colors"
        @click="lock()"
      >
        <van-icon name="lock" size="20" />
        <span>{{ LOCALE.lock }}</span>
      </button>
    </div>
  </nav>
</template>
