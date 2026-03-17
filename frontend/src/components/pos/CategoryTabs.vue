<script setup lang="ts">
import { LOCALE } from '@/constants/locale'
import type { CategoryDoc } from '@/db/schemas/category'

defineProps<{
  categories: CategoryDoc[]
  activeId: string | null
}>()

const emit = defineEmits<{
  select: [id: string | null]
}>()
</script>

<template>
  <div class="d-flex gap-2 overflow-auto px-3 py-2 no-scrollbar">
    <button
      class="btn flex-shrink-0 small fw-medium tab-btn"
      :class="activeId === null ? 'btn-active' : 'btn-inactive'"
      @click="emit('select', null)"
    >
      {{ LOCALE.allCategories }}
    </button>
    <button
      v-for="cat in categories"
      :key="cat.id"
      class="btn flex-shrink-0 small fw-medium tab-btn"
      :class="activeId === cat.id ? 'btn-active' : 'btn-inactive'"
      @click="emit('select', cat.id)"
    >
      {{ cat.name }}
    </button>
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

.tab-btn {
  padding: 0.5rem 1rem;
  border-radius: 50rem;
  font-size: 0.875rem;
  min-height: 44px;
  white-space: nowrap;
}
.btn-active {
  background-color: var(--c-primary);
  color: #fff;
  border: 1px solid var(--c-primary);
}
.btn-active:hover,
.btn-active:active {
  background-color: var(--c-primary);
  color: #fff;
}
.btn-inactive {
  background-color: #fff;
  color: var(--c-text);
  border: 1px solid var(--c-border);
}
.btn-inactive:hover,
.btn-inactive:active {
  background-color: #fff;
  color: var(--c-text);
}
</style>
