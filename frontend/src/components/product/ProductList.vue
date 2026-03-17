<script setup lang="ts">
import { LOCALE } from '@/constants/locale'
import { formatCurrency } from '@/utils/format'
import type { ProductDoc } from '@/db/schemas/product'
import type { CategoryDoc } from '@/db/schemas/category'

defineProps<{
  products: ProductDoc[]
  categories: CategoryDoc[]
}>()

const emit = defineEmits<{
  edit: [product: ProductDoc]
  toggle: [id: string]
  delete: [id: string]
}>()

function getCategoryName(categoryId: string, categories: CategoryDoc[]): string {
  return categories.find(c => c.id === categoryId)?.name || '—'
}
</script>

<template>
  <div class="space-y-2">
    <van-swipe-cell v-for="product in products" :key="product.id">
      <div
        class="flex items-center gap-3 px-4 py-3 bg-white"
        :class="{ 'opacity-50': !product.isActive }"
        @click="emit('edit', product)"
      >
        <div class="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-lg shrink-0">
          {{ product.imageDataUrl ? '🖼' : '📦' }}
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-sm font-medium text-gray-800 truncate">{{ product.name }}</div>
          <div class="text-xs text-gray-400 mt-0.5">
            {{ getCategoryName(product.categoryId, categories) }}
            <span v-if="product.stock !== null"> · 庫存 {{ product.stock }}</span>
            <span v-if="!product.isActive"> · 已下架</span>
          </div>
        </div>
        <div class="text-sm font-bold text-accent shrink-0">
          {{ formatCurrency(product.price) }}
        </div>
      </div>
      <template #right>
        <van-button
          square
          :text="product.isActive ? '下架' : '上架'"
          type="warning"
          class="h-full"
          @click="emit('toggle', product.id)"
        />
        <van-button
          square
          :text="LOCALE.deleteProduct"
          type="danger"
          class="h-full"
          @click="emit('delete', product.id)"
        />
      </template>
    </van-swipe-cell>
    <div v-if="products.length === 0" class="text-center py-20 text-gray-400 text-sm">
      尚無商品，點擊上方按鈕新增
    </div>
  </div>
</template>
