<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { getTabsForRole } from '@/constants/roles'

const route = useRoute()
const router = useRouter()
const { userRole } = useAuth()

const tabs = computed(() =>
  userRole.value ? getTabsForRole(userRole.value) : []
)

const activeIndex = computed(() => {
  const idx = tabs.value.findIndex(t => route.path.startsWith(t.path))
  return idx >= 0 ? idx : 0
})

function onTabChange(index: number) {
  const tab = tabs.value[index]
  if (tab) router.push(tab.path)
}
</script>

<template>
  <van-tabbar :model-value="activeIndex" @change="onTabChange" :safe-area-inset-bottom="true" :border="true">
    <van-tabbar-item v-for="tab in tabs" :key="tab.path" :icon="tab.icon">
      {{ tab.label }}
    </van-tabbar-item>
  </van-tabbar>
</template>
