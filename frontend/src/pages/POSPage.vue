<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue'
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

onMounted(() => {
  nextTick(() => {
    barcodeInputRef.value?.focus()
  })
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
  } catch (e) {
    console.error('Checkout error:', e)
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
  barcodeInput.value = code
  handleBarcodeSubmit()
}
</script>

<template>
  <!-- iPhone Layout -->
  <div class="flex flex-col h-full md:hidden">
    <!-- Barcode input bar -->
    <div class="px-3 pt-3 pb-1">
      <div class="flex gap-2">
        <div class="flex-1 relative">
          <input
            ref="barcodeInputRef"
            v-model="barcodeInput"
            type="text"
            inputmode="none"
            :placeholder="LOCALE.barcodePlaceholder"
            class="w-full h-11 px-4 pr-10 rounded-xl border border-gray-300 text-sm focus:border-primary focus:outline-none"
            @keydown.enter="handleBarcodeSubmit"
          />
          <button
            v-if="barcodeInput"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            @click="barcodeInput = ''; barcodeInputRef?.focus()"
          >
            <van-icon name="clear" size="16" />
          </button>
        </div>
        <button
          class="shrink-0 h-11 px-3 rounded-xl bg-primary text-white text-sm font-medium flex items-center gap-1 active:scale-95"
          @click="showCameraScanner = true"
        >
          <van-icon name="scan" size="18" />
        </button>
      </div>
    </div>

    <CategoryTabs
      :categories="categories"
      :active-id="activeCategoryId"
      @select="activeCategoryId = $event"
    />

    <div class="flex-1 overflow-auto">
      <ProductGrid :products="filteredProducts" @select="handleProductTap" />
    </div>

    <!-- Bottom cart summary bar (iPhone) -->
    <div
      v-if="totalItems > 0"
      class="flex items-center justify-between px-4 py-3 bg-primary text-white cursor-pointer active:bg-primary-light"
      @click="showCartSheet = true"
    >
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium">{{ totalItems }}{{ LOCALE.items }}</span>
        <span class="text-base font-bold">{{ LOCALE.total }} {{ formatCurrency(totalAmount) }}</span>
      </div>
      <span class="text-sm opacity-80">{{ LOCALE.viewCart }} ▲</span>
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
  <div class="hidden md:flex h-full">
    <!-- Left: Products area -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Barcode input bar -->
      <div class="px-3 pt-3 pb-1">
        <div class="flex gap-2">
          <div class="flex-1 relative">
            <input
              v-model="barcodeInput"
              type="text"
              inputmode="none"
              :placeholder="LOCALE.barcodePlaceholder"
              class="w-full h-11 px-4 pr-10 rounded-xl border border-gray-300 text-sm focus:border-primary focus:outline-none"
              @keydown.enter="handleBarcodeSubmit"
            />
            <button
              v-if="barcodeInput"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              @click="barcodeInput = ''"
            >
              <van-icon name="clear" size="16" />
            </button>
          </div>
          <button
            class="shrink-0 h-11 px-3 rounded-xl bg-accent text-white text-sm font-bold flex items-center gap-1 active:scale-95"
            @click="showCameraScanner = true"
          >
            <van-icon name="scan" size="18" />
            {{ LOCALE.openCamera }}
          </button>
        </div>
      </div>

      <CategoryTabs
        :categories="categories"
        :active-id="activeCategoryId"
        @select="activeCategoryId = $event"
      />
      <div class="flex-1 overflow-auto">
        <ProductGrid :products="filteredProducts" @select="handleProductTap" />
      </div>
    </div>

    <!-- Right: Cart sidebar (always visible on iPad) -->
    <div class="w-80 border-l border-gray-200 bg-white flex flex-col">
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
