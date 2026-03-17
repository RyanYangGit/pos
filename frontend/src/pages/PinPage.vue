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
  <div class="pin-page d-flex flex-column align-items-center justify-content-center bg-surface px-4 h-100">
    <div class="w-100 text-center" style="max-width: 300px;">
      <h1 class="fs-5 fw-bold text-primary mb-1">{{ title }}</h1>
      <p class="text-muted small mb-5">{{ subtitle }}</p>

      <!-- PIN dots -->
      <div class="d-flex justify-content-center gap-3 mb-5">
        <div
          v-for="(filled, i) in dots"
          :key="i"
          class="pin-dot"
          :class="filled ? 'pin-dot--filled' : ''"
        />
      </div>

      <!-- Number pad -->
      <div class="numpad mx-auto">
        <template v-for="row in keys" :key="row.join()">
          <button
            v-for="key in row"
            :key="key"
            class="numpad-key"
            :class="
              key === ''
                ? 'invisible'
                : key === 'del'
                  ? 'numpad-key--del'
                  : 'numpad-key--num'
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
      <div v-if="mode === 'unlock'" class="mt-5">
        <button
          class="btn-ghost small text-decoration-underline"
          @click="handleLogout"
        >
          {{ LOCALE.logout }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pin-page {
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

.pin-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid var(--c-border);
  background: transparent;
}
.pin-dot--filled {
  background-color: var(--c-primary);
  border-color: var(--c-primary);
}

.numpad {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  max-width: 240px;
}
.numpad-key {
  height: 56px;
  min-width: 44px;
  min-height: 44px;
  border: none;
  border-radius: var(--radius);
  font-size: 1.25rem;
  font-weight: 500;
  cursor: pointer;
}
.numpad-key--num {
  background-color: #fff;
  color: var(--c-text);
}
.numpad-key--num:active {
  background-color: #f0f0f0;
}
.numpad-key--del {
  background: transparent;
  color: var(--c-text-muted);
}
.numpad-key--del:active {
  background-color: #f0f0f0;
}

.btn-ghost {
  background: none;
  border: none;
  color: var(--c-text-muted);
  cursor: pointer;
  padding: 8px 12px;
  min-height: 44px;
}
</style>
