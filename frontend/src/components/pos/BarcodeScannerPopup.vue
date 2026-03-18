<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import Quagga from '@ericblade/quagga2'
import { LOCALE } from '@/constants/locale'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  'update:show': [value: boolean]
  scanned: [code: string]
}>()

const scannerRef = ref<HTMLDivElement | null>(null)
const error = ref('')
const hint = ref('將條碼對準框內')
const hintType = ref<'info' | 'warn' | 'success'>('info')
let running = false
let lastDetectedAt = 0
// Buffer consecutive reads to reduce false positives
let codeBuffer: string[] = []

function resetHint() {
  hint.value = '將條碼對準框內'
  hintType.value = 'info'
}

async function startScanner() {
  error.value = ''
  resetHint()
  codeBuffer = []
  await new Promise(r => setTimeout(r, 150))

  const target = scannerRef.value
  if (!target) return

  try {
    await new Promise<void>((resolve, reject) => {
      Quagga.init(
        {
          inputStream: {
            type: 'LiveStream',
            target,
            constraints: {
              facingMode: 'environment',
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
            area: {
              top: '20%',
              right: '5%',
              left: '5%',
              bottom: '20%',
            },
          },
          decoder: {
            readers: ['ean_reader'],
            multiple: false,
          },
          locate: true,
          frequency: 15,
        },
        (err: any) => {
          if (err) reject(err)
          else resolve()
        },
      )
    })

    Quagga.start()
    running = true

    // Process each frame for hints
    Quagga.onProcessed(onProcessed)
    // Detected barcode
    Quagga.onDetected(onDetected)
  } catch (e: any) {
    error.value = e?.message || '無法啟動鏡頭'
  }
}

function onProcessed(result: any) {
  if (!result) return

  const now = Date.now()

  // If boxes found but no code yet, give positioning hints
  if (result.boxes && result.boxes.length > 0 && !result.codeResult) {
    if (now - lastDetectedAt > 2000) {
      hint.value = '偵測到條碼，請保持穩定...'
      hintType.value = 'warn'
    }
  } else if (!result.boxes || result.boxes.length === 0) {
    if (now - lastDetectedAt > 3000) {
      hint.value = '未偵測到條碼，請對準條碼並保持適當距離'
      hintType.value = 'warn'
    }
  }
}

function onDetected(result: any) {
  if (!result?.codeResult?.code) return

  const code = result.codeResult.code as string
  // Validate EAN-13 format
  if (!/^\d{13}$/.test(code)) return

  // Check confidence — average of all decodedCodes errors
  const errors: number[] = (result.codeResult.decodedCodes || [])
    .map((d: any) => d.error)
    .filter((e: any) => typeof e === 'number')
  const avgError = errors.length > 0
    ? errors.reduce((s: number, e: number) => s + e, 0) / errors.length
    : 1

  if (avgError > 0.1) {
    hint.value = '條碼模糊，請拉遠一點或保持穩定'
    hintType.value = 'warn'
    return
  }

  lastDetectedAt = Date.now()

  // Need 2 consecutive same reads to confirm
  codeBuffer.push(code)
  if (codeBuffer.length > 5) codeBuffer.shift()

  const recentSame = codeBuffer.filter(c => c === code).length
  if (recentSame >= 2) {
    hint.value = `掃描成功: ${code}`
    hintType.value = 'success'
    codeBuffer = []
    emit('scanned', code)
    stopScanner()
    emit('update:show', false)
  } else {
    hint.value = '辨識中，請保持不動...'
    hintType.value = 'info'
  }
}

function stopScanner() {
  if (running) {
    Quagga.offDetected(onDetected)
    Quagga.offProcessed(onProcessed)
    Quagga.stop()
    running = false
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
    :style="{ height: '70%' }"
    @update:show="handleClose"
  >
    <div class="d-flex flex-column h-100 px-3 pt-5 pb-3">
      <h2 class="fw-bold text-center mb-2 scanner-title">{{ LOCALE.openCamera }}</h2>

      <!-- Hint bar -->
      <div
        class="hint-bar text-center mb-2"
        :class="{
          'hint-info': hintType === 'info',
          'hint-warn': hintType === 'warn',
          'hint-success': hintType === 'success',
        }"
      >
        {{ hint }}
      </div>

      <div class="flex-grow-1 position-relative overflow-hidden rounded scanner-viewport">
        <div ref="scannerRef" class="scanner-container" />
        <!-- Scan line overlay -->
        <div class="scan-overlay">
          <div class="scan-frame">
            <div class="scan-line" />
          </div>
        </div>
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

.hint-bar {
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 0.8125rem;
  font-weight: 600;
  transition: all 0.3s;
}
.hint-info {
  background: #e8f4fd;
  color: #0c5da5;
}
.hint-warn {
  background: #fff3cd;
  color: #856404;
}
.hint-success {
  background: #d1e7dd;
  color: #0f5132;
}

.scanner-viewport {
  background-color: #000;
  border-radius: var(--radius, 10px);
}

.scanner-container {
  width: 100%;
  height: 100%;
}
.scanner-container :deep(video) {
  width: 100% !important;
  height: 100% !important;
  object-fit: cover !important;
}
.scanner-container :deep(canvas) {
  display: none !important;
}

.scan-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}
.scan-frame {
  width: 80%;
  height: 40%;
  border: 2px solid rgba(255, 255, 255, 0.6);
  border-radius: 8px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.3);
}
.scan-line {
  position: absolute;
  left: 0;
  right: 0;
  height: 2px;
  background: #e94560;
  box-shadow: 0 0 8px #e94560;
  animation: scan-move 2s ease-in-out infinite;
}

@keyframes scan-move {
  0%, 100% { top: 10%; }
  50% { top: 90%; }
}

.error-text {
  color: #dc3545;
}
</style>
