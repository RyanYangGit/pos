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
    <div class="px-4 pt-8 pb-4 flex flex-col h-full">
      <h2 class="text-lg font-bold text-center mb-4">{{ LOCALE.openCamera }}</h2>

      <div class="flex-1 flex items-center justify-center overflow-hidden rounded-xl bg-black">
        <div :id="readerId" class="w-full h-full" />
      </div>

      <p v-if="error" class="text-red-500 text-sm text-center mt-3">{{ error }}</p>
    </div>
  </van-popup>
</template>
