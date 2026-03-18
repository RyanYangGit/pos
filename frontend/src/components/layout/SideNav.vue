<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { getTabsForRole } from '@/constants/roles'
import { LOCALE } from '@/constants/locale'
import { APP_VERSION } from '@/version'

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
  <nav class="sidenav d-flex flex-column align-items-center pt-3 flex-shrink-0 bg-primary text-white">
    <div class="small fw-bold mb-4 opacity-75">POS</div>
    <button
      v-for="tab in tabs"
      :key="tab.path"
      class="sidenav-btn d-flex flex-column align-items-center gap-1 py-3 border-0 small text-white w-100"
      :class="isActive(tab.path) ? 'active' : ''"
      @click="router.push(tab.path)"
    >
      <span class="fs-5">{{ tab.emoji }}</span>
      <span>{{ tab.label }}</span>
    </button>

    <div class="mt-auto mb-3 position-relative">
      <button
        class="sidenav-btn d-flex flex-column align-items-center gap-1 py-3 border-0 small text-white w-100"
        @click="showMenu = !showMenu"
      >
        <van-icon name="setting-o" size="20" />
        <span>{{ LOCALE.settings }}</span>
      </button>

      <!-- Popup menu -->
      <div
        v-if="showMenu"
        class="popup-menu position-absolute rounded-3 overflow-hidden"
      >
        <button
          class="menu-item d-flex align-items-center gap-2 w-100 px-3 py-3 border-0 small fw-medium text-start text-white"
          @click="handleLock"
        >
          <van-icon name="lock" size="16" />
          鎖定螢幕
        </button>
        <button
          class="menu-item d-flex align-items-center gap-2 w-100 px-3 py-3 border-0 small fw-medium text-start text-white border-top border-white border-opacity-10"
          @click="handleUpdate"
        >
          <van-icon name="replay" size="16" />
          檢查更新
        </button>
        <button
          class="menu-item d-flex align-items-center gap-2 w-100 px-3 py-3 border-0 small fw-medium text-start text-danger-light border-top border-white border-opacity-10"
          @click="handleLogout"
        >
          <van-icon name="revoke" size="16" />
          登出
        </button>
        <div class="px-3 py-2 text-center border-top border-white border-opacity-10">
          <span class="version-label">{{ APP_VERSION }}</span>
        </div>
      </div>
    </div>
  </nav>

  <!-- Backdrop to close menu -->
  <div
    v-if="showMenu"
    class="position-fixed top-0 start-0 w-100 h-100"
    style="z-index: 40"
    @click="showMenu = false"
  />
</template>

<style scoped>
.sidenav {
  width: 5rem;
  background-color: var(--c-primary);
}

.sidenav-btn {
  background: transparent;
  cursor: pointer;
}

.sidenav-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.sidenav-btn.active {
  background-color: rgba(255, 255, 255, 0.2);
}

.popup-menu {
  bottom: 100%;
  left: 100%;
  margin-left: 0.25rem;
  margin-bottom: 0.25rem;
  width: 10rem;
  background-color: var(--c-primary-light, #2a2a4a);
  border: 1px solid rgba(255, 255, 255, 0.2);
  z-index: 50;
}

.menu-item {
  background: transparent;
  cursor: pointer;
}

.text-danger-light {
  color: #fca5a5;
}
.version-label {
  font-size: 0.625rem;
  color: rgba(255, 255, 255, 0.35);
  letter-spacing: 0.5px;
}
</style>
