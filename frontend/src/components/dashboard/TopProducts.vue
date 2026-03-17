<script setup lang="ts">
import { LOCALE } from '@/constants/locale'
import { formatCurrency } from '@/utils/format'

defineProps<{
  products: { name: string; quantity: number; revenue: number }[]
}>()
</script>

<template>
  <div class="bg-white rounded-xl p-4">
    <h3 class="text-sm font-bold text-gray-700 mb-3">{{ LOCALE.topProducts }}</h3>
    <div v-if="products.length === 0" class="text-sm text-gray-400 text-center py-4">{{ LOCALE.noData }}</div>
    <div v-else class="space-y-2">
      <div
        v-for="(product, idx) in products"
        :key="product.name"
        class="flex items-center gap-3"
      >
        <span class="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">
          {{ idx + 1 }}
        </span>
        <span class="flex-1 text-sm text-gray-800 truncate">{{ product.name }}</span>
        <span class="text-xs text-gray-400 shrink-0">{{ product.quantity }}件</span>
        <span class="text-sm font-medium text-gray-800 shrink-0">{{ formatCurrency(product.revenue) }}</span>
      </div>
    </div>
  </div>
</template>
