<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import { Html5Qrcode } from 'html5-qrcode'
import { LOCALE } from '@/constants/locale'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  'update:show': [value: boolean]
  scanned: [code: string]
}>()

const readerId = 'barcode-reader'
let scanner: Html5Qrcode | null = null
const error = ref('')

async function startScanner() {
  error.value = ''
  // Wait for DOM element to be rendered
  await new Promise(r => setTimeout(r, 100))

  const el = document.getElementById(readerId)
  if (!el) return

  scanner = new Html5Qrcode(readerId)
  try {
    await scanner.start(
      { facingMode: 'environment' },
      {
        fps: 10,
        qrbox: { width: 250, height: 150 },
      },
      (decodedText) => {
        emit('scanned', decodedText)
        stopScanner()
        emit('update:show', false)
      },
      () => {
        // ignore scan failures
      },
    )
  } catch (e: any) {
    error.value = e?.message || '無法啟動鏡頭'
  }
}

async function stopScanner() {
  if (scanner) {
    try {
      const state = scanner.getState()
      if (state === 2) { // SCANNING
        await scanner.stop()
      }
    } catch {
      // ignore
    }
    scanner.clear()
    scanner = null
  }
}

watch(() => props.show, (val) => {
  if (val) {
    startScanner()
  } else {
    stopScanner()
  }
})

onUnmounted(() => {
  stopScanner()
})

function handleClose() {
  stopScanner()
  emit('update:show', false)
}
</script>

<template>
  <van-popup
    :show="show"
    position="bottom"
    round
    closeable
    :duration="0"
    :style="{ height: '60%' }"
    @update:show="handleClose"
  >
    <div class="d-flex flex-column h-100 px-3 pt-5 pb-3">
      <h2 class="fw-bold text-center mb-3 scanner-title">{{ LOCALE.openCamera }}</h2>

      <div class="flex-grow-1 d-flex align-items-center justify-content-center overflow-hidden rounded scanner-viewport">
        <div :id="readerId" class="w-100 h-100" />
      </div>

      <p v-if="error" class="text-center small mt-3 error-text">{{ error }}</p>
    </div>
  </van-popup>
</template>

<style scoped>
.scanner-title {
  font-size: 1.125rem;
  color: var(--c-text);
}
.scanner-viewport {
  background-color: #000;
  border-radius: var(--radius);
}
.error-text {
  color: #dc3545;
}
</style>
