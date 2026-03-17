<script setup lang="ts">
import type { ProductDoc } from '@/db/schemas/product'
import ProductCard from './ProductCard.vue'

defineProps<{
  products: ProductDoc[]
}>()

const emit = defineEmits<{
  select: [product: ProductDoc]
}>()
</script>

<template>
  <div class="product-grid p-3">
    <ProductCard
      v-for="product in products"
      :key="product.id"
      :product="product"
      @tap="emit('select', product)"
    />
  </div>
  <div v-if="products.length === 0" class="d-flex align-items-center justify-content-center py-5 text-muted">
    沒有商品
  </div>
</template>

<style scoped>
.product-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}
@media (min-width: 768px) {
  .product-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
@media (min-width: 992px) {
  .product-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
.text-muted {
  color: var(--c-text-muted);
}
</style>
