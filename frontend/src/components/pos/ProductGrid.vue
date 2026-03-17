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
  <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-3">
    <ProductCard
      v-for="product in products"
      :key="product.id"
      :product="product"
      @tap="emit('select', product)"
    />
  </div>
  <div v-if="products.length === 0" class="flex items-center justify-center py-20 text-gray-400">
    沒有商品
  </div>
</template>
