<script setup lang="ts">
import type { ProductDoc } from '@/db/schemas/product'
import { formatCurrency } from '@/utils/format'

defineProps<{
  product: ProductDoc
}>()

const emit = defineEmits<{
  tap: [product: ProductDoc]
}>()
</script>

<template>
  <button
    class="btn d-flex flex-column align-items-center justify-content-center border rounded p-3 product-card"
    @click="emit('tap', product)"
  >
    <span class="small text-center product-name">
      {{ product.name }}
    </span>
    <span v-if="product.barcode" class="product-barcode mt-1">
      {{ product.barcode }}
    </span>
    <span class="fw-bold mt-1 product-price">
      {{ formatCurrency(product.price) }}
    </span>
    <!-- Stock is informational only: goods on hand can always be sold, so it may go negative. -->
    <span
      v-if="product.stock !== null"
      class="product-stock mt-1"
      :class="{ 'product-stock--low': product.stock <= 0 }"
    >
      剩 {{ product.stock }}
    </span>
  </button>
</template>

<style scoped>
.product-card {
  background-color: #fff;
  border-color: var(--c-border) !important;
  border-radius: var(--radius);
  min-height: 120px;
  position: relative;
  text-decoration: none;
}
.product-card:hover,
.product-card:active {
  background-color: #fff;
}
.product-name {
  color: var(--c-text);
  line-height: 1.25;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-size: 0.75rem;
}
@media (min-width: 768px) {
  .product-name {
    font-size: 0.875rem;
  }
  .product-price {
    font-size: 1.25rem;
  }
}
.product-barcode {
  font-size: 0.625rem;
  color: var(--c-text-muted);
  font-family: monospace;
  letter-spacing: 0.05em;
}
.product-price {
  color: var(--c-accent);
  font-size: 1.125rem;
}
.product-stock {
  font-size: 0.75rem;
  color: var(--c-text-muted);
}
.product-stock--low {
  color: var(--c-accent);
}
</style>
