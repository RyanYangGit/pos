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
  <div class="flex gap-2 overflow-x-auto px-3 py-2 no-scrollbar">
    <button
      class="shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all active:scale-95"
      :class="activeId === null
        ? 'bg-primary text-white'
        : 'bg-white text-gray-900 border border-gray-300'"
      @click="emit('select', null)"
    >
      {{ LOCALE.allCategories }}
    </button>
    <button
      v-for="cat in categories"
      :key="cat.id"
      class="shrink-0 px-4 py-2 rounded-full text-sm font-medium"
      :class="activeId === cat.id
        ? 'bg-primary text-white'
        : 'bg-white text-gray-900 border border-gray-300'"
      @click="emit('select', cat.id)"
    >
      {{ cat.name }}
    </button>
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
