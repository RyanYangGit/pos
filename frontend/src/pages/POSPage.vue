<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { showSuccessToast, showFailToast } from 'vant'
import { LOCALE } from '@/constants/locale'
import { formatCurrency } from '@/utils/format'
import type { PaymentMethod } from '@/constants/payment'
import type { ProductDoc } from '@/db/schemas/product'
import { useCategories } from '@/composables/useCategories'
import { useProducts } from '@/composables/useProducts'
import { useCart } from '@/composables/useCart'
import { useOrders } from '@/composables/useOrders'
import CategoryTabs from '@/components/pos/CategoryTabs.vue'
import ProductGrid from '@/components/pos/ProductGrid.vue'
import CartPanel from '@/components/pos/CartPanel.vue'
import BarcodeScannerPopup from '@/components/pos/BarcodeScannerPopup.vue'

const { categories } = useCategories()
const { getActiveProducts, findByBarcode } = useProducts()
const { items, totalItems, totalAmount, addItem, updateQuantity, removeItem, clearCart, getItems } = useCart()
const { createOrder } = useOrders()

const activeCategoryId = ref<string | null>(null)
const showCartSheet = ref(false)
const showCameraScanner = ref(false)
const barcodeInput = ref('')
const barcodeInputRef = ref<HTMLInputElement | null>(null)

const filteredProducts = computed(() => getActiveProducts(activeCategoryId.value))

// --- Bluetooth scanner: global keystroke capture ---
let scanBuffer = ''
let scanTimeout: ReturnType<typeof setTimeout> | null = null
const scannerConnected = ref(false)
let scannerDisconnectTimer: ReturnType<typeof setTimeout> | null = null

function markScannerActive() {
  scannerConnected.value = true
  // If no scan activity for 5 minutes, consider disconnected
  if (scannerDisconnectTimer) clearTimeout(scannerDisconnectTimer)
  scannerDisconnectTimer = setTimeout(() => { scannerConnected.value = false }, 5 * 60 * 1000)
}

function onGlobalKeydown(e: KeyboardEvent) {
  // Ignore if user is typing in a real input (other than barcode input)
  const target = e.target as HTMLElement
  const isBarInput = target === barcodeInputRef.value
  const isOtherInput = (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') && !isBarInput
  if (isOtherInput) return

  if (e.key === 'Enter') {
    if (scanBuffer.length >= 4) {
      // Looks like a barcode scanner burst
      e.preventDefault()
      markScannerActive()
      processScanBuffer(scanBuffer)
    }
    scanBuffer = ''
    if (scanTimeout) clearTimeout(scanTimeout)
    return
  }

  // Only collect printable single chars
  if (e.key.length === 1) {
    // If focus is not on barcode input, prevent default to avoid typing elsewhere
    if (!isBarInput) e.preventDefault()
    scanBuffer += e.key
    // Reset buffer after 100ms of no input (scanner sends chars <50ms apart)
    if (scanTimeout) clearTimeout(scanTimeout)
    scanTimeout = setTimeout(() => { scanBuffer = '' }, 100)
  }
}

function processScanBuffer(code: string) {
  const trimmed = code.trim()
  if (!trimmed) return
  barcodeInput.value = trimmed
  handleBarcodeSubmit()
}

onMounted(() => {
  nextTick(() => {
    barcodeInputRef.value?.focus()
  })
  document.addEventListener('keydown', onGlobalKeydown, true)
})

onUnmounted(() => {
  document.removeEventListener('keydown', onGlobalKeydown, true)
  if (scanTimeout) clearTimeout(scanTimeout)
  if (scannerDisconnectTimer) clearTimeout(scannerDisconnectTimer)
})

function handleProductTap(product: ProductDoc) {
  addItem(product)
}

function handleIncrement(productId: string) {
  const item = items.value.find(i => i.productId === productId)
  if (item) updateQuantity(productId, item.quantity + 1)
}

function handleDecrement(productId: string) {
  const item = items.value.find(i => i.productId === productId)
  if (item) updateQuantity(productId, item.quantity - 1)
}

async function handleConfirmCheckout(paymentMethod: PaymentMethod, note: string) {
  try {
    await createOrder(getItems(), totalAmount.value, paymentMethod, note)
    clearCart()
    showCartSheet.value = false
    showSuccessToast(LOCALE.checkoutSuccess)
  } catch (e: any) {
    console.error('Checkout error:', e)
    showFailToast('結帳失敗: ' + (e?.message || '未知錯誤'))
  }
}

// --- Barcode ---

function handleBarcodeSubmit() {
  const code = barcodeInput.value.trim()
  if (!code) return

  const product = findByBarcode(code)
  if (product) {
    addItem(product)
    showSuccessToast(`${product.name} ${LOCALE.barcodeAdded}`)
  } else {
    showFailToast(LOCALE.barcodeNotFound)
  }

  barcodeInput.value = ''
  nextTick(() => {
    barcodeInputRef.value?.focus()
  })
}

function handleCameraScanned(code: string) {
  // Delay so the popup fully closes before showing toast
  setTimeout(() => {
    barcodeInput.value = code
    handleBarcodeSubmit()
  }, 300)
}
</script>

<template>
  <!-- iPhone Layout -->
  <div class="pos-mobile d-flex flex-column h-100 d-md-none">
    <!-- Barcode input bar -->
    <div class="p-3 pb-1">
      <div class="d-flex gap-2">
        <div class="flex-grow-1 position-relative">
          <input
            ref="barcodeInputRef"
            v-model="barcodeInput"
            type="text"
            inputmode="none"
            :placeholder="LOCALE.barcodePlaceholder"
            class="form-control barcode-input"
            @keydown.enter="handleBarcodeSubmit"
          />
          <button
            v-if="barcodeInput"
            class="btn btn-link barcode-clear-btn"
            @click="barcodeInput = ''; barcodeInputRef?.focus()"
          >
            <van-icon name="clear" size="16" />
          </button>
        </div>
        <button
          class="btn btn-primary d-flex align-items-center gap-1 flex-shrink-0 scan-btn"
          @click="showCameraScanner = true"
        >
          <van-icon name="scan" size="18" />
        </button>
      </div>
      <div v-if="scannerConnected" class="scanner-status mt-1">
        <span class="scanner-dot" />條碼機已連線
      </div>
    </div>

    <CategoryTabs
      :categories="categories"
      :active-id="activeCategoryId"
      @select="activeCategoryId = $event"
    />

    <div class="flex-grow-1 overflow-auto">
      <ProductGrid :products="filteredProducts" @select="handleProductTap" />
    </div>

    <!-- Bottom cart summary bar (iPhone) -->
    <div
      v-if="totalItems > 0"
      class="d-flex align-items-center justify-content-between px-3 py-3 bg-primary text-white cart-summary-bar"
      @click="showCartSheet = true"
    >
      <div class="d-flex align-items-center gap-2">
        <span class="small fw-medium">{{ totalItems }}{{ LOCALE.items }}</span>
        <span class="fw-bold">{{ LOCALE.total }} {{ formatCurrency(totalAmount) }}</span>
      </div>
      <span class="small opacity-75">{{ LOCALE.viewCart }} &#9650;</span>
    </div>

    <!-- iPhone cart bottom sheet -->
    <van-popup
      v-model:show="showCartSheet"
      position="bottom"
      round
      :duration="0"
      :style="{ height: '80%' }"
    >
      <CartPanel
        :items="items"
        :total-items="totalItems"
        :total-amount="totalAmount"
        @increment="handleIncrement"
        @decrement="handleDecrement"
        @remove="removeItem"
        @clear="clearCart"
        @confirm="handleConfirmCheckout"
      />
    </van-popup>
  </div>

  <!-- iPad Layout -->
  <div class="pos-desktop d-none d-md-flex h-100">
    <!-- Left: Products area -->
    <div class="flex-grow-1 d-flex flex-column overflow-hidden">
      <!-- Barcode input bar -->
      <div class="p-3 pb-1">
        <div class="d-flex gap-2">
          <div class="flex-grow-1 position-relative">
            <input
              v-model="barcodeInput"
              type="text"
              inputmode="none"
              :placeholder="LOCALE.barcodePlaceholder"
              class="form-control barcode-input"
              @keydown.enter="handleBarcodeSubmit"
            />
            <button
              v-if="barcodeInput"
              class="btn btn-link barcode-clear-btn"
              @click="barcodeInput = ''"
            >
              <van-icon name="clear" size="16" />
            </button>
          </div>
          <button
            class="btn btn-primary d-flex align-items-center gap-1 flex-shrink-0 scan-btn fw-bold"
            @click="showCameraScanner = true"
          >
            <van-icon name="scan" size="18" />
            {{ LOCALE.openCamera }}
          </button>
        </div>
        <div v-if="scannerConnected" class="scanner-status mt-1">
          <span class="scanner-dot" />條碼機已連線
        </div>
      </div>

      <CategoryTabs
        :categories="categories"
        :active-id="activeCategoryId"
        @select="activeCategoryId = $event"
      />
      <div class="flex-grow-1 overflow-auto">
        <ProductGrid :products="filteredProducts" @select="handleProductTap" />
      </div>
    </div>

    <!-- Right: Cart sidebar (always visible on iPad) -->
    <div class="cart-sidebar d-flex flex-column bg-white border-start">
      <CartPanel
        :items="items"
        :total-items="totalItems"
        :total-amount="totalAmount"
        @increment="handleIncrement"
        @decrement="handleDecrement"
        @remove="removeItem"
        @clear="clearCart"
        @confirm="handleConfirmCheckout"
      />
    </div>
  </div>

  <!-- Camera scanner popup (shared) -->
  <BarcodeScannerPopup
    v-model:show="showCameraScanner"
    @scanned="handleCameraScanned"
  />
</template>

<style scoped>
.barcode-input {
  height: 44px;
  padding-left: 1rem;
  padding-right: 2.5rem;
  border-radius: var(--radius);
  border: 1px solid var(--c-border);
  font-size: 0.875rem;
}
.barcode-input:focus {
  border-color: var(--c-primary);
  outline: none;
  box-shadow: none;
}
.barcode-clear-btn {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--c-text-muted);
  padding: 0;
  text-decoration: none;
}
.scan-btn {
  height: 44px;
  padding-left: 0.75rem;
  padding-right: 0.75rem;
  border-radius: var(--radius);
  background-color: var(--c-primary);
  border-color: var(--c-primary);
  color: #fff;
  font-size: 0.875rem;
  min-height: 44px;
}
.scan-btn:hover,
.scan-btn:active {
  background-color: var(--c-primary);
  border-color: var(--c-primary);
  color: #fff;
}
.cart-summary-bar {
  background-color: var(--c-primary);
  cursor: pointer;
  min-height: 44px;
}
.cart-sidebar {
  width: 320px;
  border-color: var(--c-border);
}
.scanner-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  color: #198754;
  font-weight: 500;
  padding-left: 2px;
}
.scanner-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #198754;
  animation: dot-pulse 2s ease-in-out infinite;
}
@keyframes dot-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
</style>
