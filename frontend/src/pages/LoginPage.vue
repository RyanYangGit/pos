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
  <div class="h-full flex items-center justify-center bg-surface px-6">
    <div class="w-full max-w-sm">
      <div class="text-center mb-8">
        <h1 class="text-2xl font-bold text-gray-800">{{ LOCALE.appName }}</h1>
        <p class="text-gray-500 mt-1">{{ LOCALE.loginTitle }}</p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-4">
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
