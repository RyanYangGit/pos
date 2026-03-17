<script setup lang="ts">
import { ref } from 'vue'
import { showFailToast } from 'vant'
import { LOCALE } from '@/constants/locale'
import { useAuth } from '@/composables/useAuth'

const { loginSuccess } = useAuth()

const username = ref('')
const password = ref('')
const loading = ref(false)

async function handleLogin() {
  if (!username.value || !password.value) return

  loading.value = true
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: username.value,
        password: password.value,
      }),
    })

    if (!res.ok) {
      showFailToast(LOCALE.loginError)
      return
    }

    const data = await res.json()
    await loginSuccess(data)
  } catch {
    showFailToast(LOCALE.loginNetworkError)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page d-flex align-items-center justify-content-center bg-surface px-4 h-100">
    <div class="w-100" style="max-width: 360px;">
      <div class="text-center mb-5">
        <h1 class="fs-4 fw-bold text-primary">{{ LOCALE.appName }}</h1>
        <p class="text-muted mt-1">{{ LOCALE.loginTitle }}</p>
      </div>

      <form @submit.prevent="handleLogin" class="d-flex flex-column gap-3">
        <van-field
          v-model="username"
          :label="LOCALE.username"
          :placeholder="LOCALE.username"
          left-icon="user-o"
          autocomplete="username"
        />
        <van-field
          v-model="password"
          type="password"
          :label="LOCALE.password"
          :placeholder="LOCALE.password"
          left-icon="lock"
          autocomplete="current-password"
        />
        <van-button
          type="primary"
          block
          round
          :loading="loading"
          native-type="submit"
          :disabled="!username || !password"
        >
          {{ LOCALE.loginButton }}
        </van-button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  --c-primary: #1a1a2e;
  --c-accent: #e94560;
  --c-surface: #f5f6f8;
  --c-border: #dee2e6;
  --c-text: #1a1a2e;
  --c-text-muted: #6c757d;
  --radius: 10px;
  --radius-sm: 6px;
}
.bg-surface { background-color: var(--c-surface); }
.text-primary { color: var(--c-text) !important; }
.text-muted { color: var(--c-text-muted) !important; }
.h-100 { height: 100%; }
</style>
