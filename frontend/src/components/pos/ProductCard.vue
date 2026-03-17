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
    class="flex flex-col items-center justify-center bg-white rounded-xl p-3 border border-gray-100 min-h-[120px] relative"
    :class="{ 'opacity-50': product.stock === 0 }"
    :disabled="product.stock === 0"
    @click="emit('tap', product)"
  >
    <div
      v-if="product.imageDataUrl"
      class="w-12 h-12 rounded-lg mb-2 bg-cover bg-center"
      :style="{ backgroundImage: `url(${product.imageDataUrl})` }"
    />
    <div v-else class="w-12 h-12 rounded-lg mb-2 bg-gray-100 flex items-center justify-center text-2xl">
      📦
    </div>
    <span class="text-sm text-gray-800 text-center leading-tight line-clamp-2 md:text-base">
      {{ product.name }}
    </span>
    <span class="text-lg font-bold text-accent mt-1 md:text-xl">
      {{ formatCurrency(product.price) }}
    </span>
    <span v-if="product.stock !== null" class="text-xs text-gray-400 mt-0.5">
      {{ product.stock === 0 ? '售完' : `剩 ${product.stock}` }}
    </span>
  </button>
</template>
