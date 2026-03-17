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
  <div class="product-list d-flex flex-column gap-2">
    <van-swipe-cell v-for="product in products" :key="product.id">
      <div
        class="d-flex align-items-center gap-3 px-3 py-3 bg-white product-item"
        :class="{ 'opacity-50': !product.isActive }"
        @click="emit('edit', product)"
      >
        <div class="product-icon flex-shrink-0 d-flex align-items-center justify-content-center">
          {{ product.imageDataUrl ? '🖼' : '📦' }}
        </div>
        <div class="flex-grow-1 min-w-0">
          <div class="small fw-medium text-primary text-truncate">{{ product.name }}</div>
          <div class="extra-small text-muted mt-1">
            {{ getCategoryName(product.categoryId, categories) }}
            <span v-if="product.stock !== null"> · 庫存 {{ product.stock }}</span>
            <span v-if="!product.isActive"> · 已下架</span>
          </div>
        </div>
        <div class="small fw-bold text-accent flex-shrink-0">
          {{ formatCurrency(product.price) }}
        </div>
      </div>
      <template #right>
        <van-button
          square
          :text="product.isActive ? '下架' : '上架'"
          type="warning"
          class="h-100"
          @click="emit('toggle', product.id)"
        />
        <van-button
          square
          :text="LOCALE.deleteProduct"
          type="danger"
          class="h-100"
          @click="emit('delete', product.id)"
        />
      </template>
    </van-swipe-cell>
    <div v-if="products.length === 0" class="text-center py-5 text-muted small">
      尚無商品，點擊上方按鈕新增
    </div>
  </div>
</template>

<style scoped>
.product-list {
  --c-primary: #1a1a2e;
  --c-accent: #e94560;
  --c-surface: #f5f6f8;
  --c-border: #dee2e6;
  --c-text: #1a1a2e;
  --c-text-muted: #6c757d;
  --radius: 10px;
  --radius-sm: 6px;
}
.bg-white { background-color: #fff; }
.text-primary { color: var(--c-text) !important; }
.text-accent { color: var(--c-accent) !important; }
.text-muted { color: var(--c-text-muted) !important; }
.extra-small { font-size: 0.75rem; }
.fw-medium { font-weight: 500; }
.opacity-50 { opacity: 0.5; }
.min-w-0 { min-width: 0; }

.product-item {
  cursor: pointer;
  min-height: 44px;
}

.product-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-sm);
  background-color: var(--c-surface);
  font-size: 1.125rem;
}
</style>
