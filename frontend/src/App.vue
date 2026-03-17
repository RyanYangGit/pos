<script setup lang="ts">
import { onMounted } from 'vue'
import AppShell from '@/components/layout/AppShell.vue'
import LoginPage from '@/pages/LoginPage.vue'
import PinPage from '@/pages/PinPage.vue'
import { useAuth } from '@/composables/useAuth'

const { authScreen, init } = useAuth()

onMounted(() => {
  init()
})
</script>

<template>
  <!-- Loading -->
  <div v-if="authScreen === 'loading'" class="h-100 d-flex align-items-center justify-content-center">
    <van-loading size="36" />
  </div>

  <!-- Login -->
  <LoginPage v-else-if="authScreen === 'login'" />

  <!-- Set PIN (after first login) -->
  <PinPage v-else-if="authScreen === 'set-pin'" mode="set" />

  <!-- PIN unlock -->
  <PinPage v-else-if="authScreen === 'pin'" mode="unlock" />

  <!-- Authenticated App -->
  <AppShell v-else>
    <router-view />
  </AppShell>
</template>
