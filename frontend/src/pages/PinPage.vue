<script setup lang="ts">
import { ref, computed } from 'vue'
import { showFailToast } from 'vant'
import { LOCALE } from '@/constants/locale'
import { useAuth } from '@/composables/useAuth'

const props = defineProps<{
  mode: 'set' | 'unlock'
}>()

const { setPin, verifyPin, userName, logout } = useAuth()

const pin = ref('')
const confirmPin = ref('')
const phase = ref<'enter' | 'confirm'>('enter')
const loading = ref(false)

const title = computed(() =>
  props.mode === 'set' ? LOCALE.setPinTitle : LOCALE.unlockTitle
)

const subtitle = computed(() => {
  if (props.mode === 'set') {
    return phase.value === 'enter' ? LOCALE.setPinDesc : LOCALE.confirmPin
  }
  return userName.value
})

function onInput(key: string) {
  const target = phase.value === 'confirm' ? confirmPin : pin
  if (target.value.length < 4) {
    target.value += key
  }
  if (target.value.length === 4) {
    handleComplete()
  }
}

function onDelete() {
  const target = phase.value === 'confirm' ? confirmPin : pin
  target.value = target.value.slice(0, -1)
}

async function handleComplete() {
  if (props.mode === 'set') {
    if (phase.value === 'enter') {
      phase.value = 'confirm'
      return
    }
    // confirm phase
    if (pin.value !== confirmPin.value) {
      showFailToast(LOCALE.pinMismatch)
      pin.value = ''
      confirmPin.value = ''
      phase.value = 'enter'
      return
    }
    loading.value = true
    try {
      await setPin(pin.value)
    } finally {
      loading.value = false
    }
  } else {
    // unlock mode
    loading.value = true
    try {
      const ok = await verifyPin(pin.value)
      if (!ok) {
        showFailToast(LOCALE.pinError)
        pin.value = ''
      }
    } finally {
      loading.value = false
    }
  }
}

const currentPin = computed(() =>
  phase.value === 'confirm' ? confirmPin.value : pin.value
)

const dots = computed(() => {
  const filled = currentPin.value.length
  return Array.from({ length: 4 }, (_, i) => i < filled)
})

const keys = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['', '0', 'del'],
]

async function handleLogout() {
  await logout()
}
</script>

<template>
  <div class="h-full flex flex-col items-center justify-center bg-surface px-6">
    <div class="w-full max-w-xs text-center">
      <h1 class="text-xl font-bold text-gray-800 mb-1">{{ title }}</h1>
      <p class="text-gray-500 text-sm mb-8">{{ subtitle }}</p>

      <!-- PIN dots -->
      <div class="flex justify-center gap-4 mb-10">
        <div
          v-for="(filled, i) in dots"
          :key="i"
          class="w-4 h-4 rounded-full border-2 transition-colors"
          :class="filled ? 'bg-primary border-primary' : 'border-gray-300'"
        />
      </div>

      <!-- Number pad -->
      <div class="grid grid-cols-3 gap-3 max-w-[240px] mx-auto">
        <template v-for="row in keys" :key="row.join()">
          <button
            v-for="key in row"
            :key="key"
            class="h-14 rounded-xl text-xl font-medium transition-colors"
            :class="
              key === ''
                ? 'invisible'
                : key === 'del'
                  ? 'text-gray-500 active:bg-gray-100'
                  : 'bg-white text-gray-800 active:bg-gray-100'
            "
            :disabled="key === '' || loading"
            @click="key === 'del' ? onDelete() : onInput(key)"
          >
            <template v-if="key === 'del'">
              <van-icon name="delete-o" size="22" />
            </template>
            <template v-else>{{ key }}</template>
          </button>
        </template>
      </div>

      <!-- Unlock mode: option to switch to login -->
      <div v-if="mode === 'unlock'" class="mt-8">
        <button
          class="text-sm text-gray-400 underline"
          @click="handleLogout"
        >
          {{ LOCALE.logout }}
        </button>
      </div>
    </div>
  </div>
</template>
