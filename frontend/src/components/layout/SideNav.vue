<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { getTabsForRole } from '@/constants/roles'
import { LOCALE } from '@/constants/locale'

const route = useRoute()
const router = useRouter()
const { userRole, lock, logout } = useAuth()

const showMenu = ref(false)

const tabs = computed(() =>
  userRole.value ? getTabsForRole(userRole.value) : []
)

function isActive(path: string) {
  return route.path.startsWith(path)
}

function handleLock() {
  showMenu.value = false
  lock()
}

function handleLogout() {
  showMenu.value = false
  logout()
}

function handleUpdate() {
  showMenu.value = false
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistration().then(reg => {
      if (reg) {
        reg.update().then(() => {
          window.location.reload()
        })
      } else {
        window.location.reload()
      }
    })
  } else {
    window.location.reload()
  }
}
</script>

<template>
  <nav class="w-20 bg-primary text-white flex flex-col items-center pt-4 shrink-0">
    <div class="text-xs font-bold mb-6 opacity-80">POS</div>
    <button
      v-for="tab in tabs"
      :key="tab.path"
      class="w-full flex flex-col items-center gap-1 py-3 text-xs active:scale-95 active:bg-opacity-80"
      :class="isActive(tab.path) ? 'bg-white/20' : 'hover:bg-white/10'"
      @click="router.push(tab.path)"
    >
      <span class="text-xl">{{ tab.emoji }}</span>
      <span>{{ tab.label }}</span>
    </button>

    <div class="mt-auto mb-4 relative">
      <button
        class="w-full flex flex-col items-center gap-1 py-3 text-xs hover:bg-white/10"
        @click="showMenu = !showMenu"
      >
        <van-icon name="setting-o" size="20" />
        <span>{{ LOCALE.settings }}</span>
      </button>

      <!-- Popup menu -->
      <div
        v-if="showMenu"
        class="absolute bottom-full left-full ml-1 mb-1 w-36 bg-white rounded-xl border border-gray-200 overflow-hidden z-50"
      >
        <button
          class="w-full px-4 py-3 text-sm text-gray-800 text-left active:bg-gray-100 flex items-center gap-2"
          @click="handleLock"
        >
          <van-icon name="lock" size="16" color="#333" />
          鎖定螢幕
        </button>
        <button
          class="w-full px-4 py-3 text-sm text-gray-800 text-left active:bg-gray-100 flex items-center gap-2 border-t border-gray-100"
          @click="handleUpdate"
        >
          <van-icon name="replay" size="16" color="#333" />
          檢查更新
        </button>
        <button
          class="w-full px-4 py-3 text-sm text-red-500 text-left active:bg-red-50 flex items-center gap-2 border-t border-gray-100"
          @click="handleLogout"
        >
          <van-icon name="revoke" size="16" color="#ee0a24" />
          登出
        </button>
      </div>
    </div>
  </nav>

  <!-- Backdrop to close menu -->
  <div
    v-if="showMenu"
    class="fixed inset-0 z-40"
    @click="showMenu = false"
  />
</template>
