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
    :class="{ 'opacity-50': product.stock === 0 }"
    :disabled="product.stock === 0"
    @click="emit('tap', product)"
  >
    <div
      v-if="product.imageDataUrl"
      class="product-img mb-2"
      :style="{ backgroundImage: `url(${product.imageDataUrl})` }"
    />
    <div v-else class="product-img-placeholder d-flex align-items-center justify-content-center mb-2">
      &#128230;
    </div>
    <span class="small text-center product-name">
      {{ product.name }}
    </span>
    <span class="fw-bold mt-1 product-price">
      {{ formatCurrency(product.price) }}
    </span>
    <span v-if="product.stock !== null" class="product-stock mt-1">
      {{ product.stock === 0 ? '售完' : `剩 ${product.stock}` }}
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
.product-img {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background-size: cover;
  background-position: center;
}
.product-img-placeholder {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background-color: var(--c-surface);
  font-size: 1.5rem;
}
.product-name {
  color: var(--c-text);
  line-height: 1.25;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-size: 0.875rem;
}
@media (min-width: 768px) {
  .product-name {
    font-size: 1rem;
  }
  .product-price {
    font-size: 1.25rem;
  }
}
.product-price {
  color: var(--c-accent);
  font-size: 1.125rem;
}
.product-stock {
  font-size: 0.75rem;
  color: var(--c-text-muted);
}
</style>
