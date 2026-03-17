<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { LOCALE } from '@/constants/locale'

interface CategoryLike { id: string; name: string }
interface ProductLike {
  id: string; name: string; price: number; stock: number | null
  barcode: string | null; categoryId: string; isActive: boolean; sortOrder: number
  imageDataUrl?: string | null
}

const props = defineProps<{
  show: boolean
  categories: CategoryLike[]
  product?: ProductLike | null
}>()

const emit = defineEmits<{
  'update:show': [value: boolean]
  save: [data: {
    name: string
    price: number
    stock: number | null
    barcode: string | null
    categoryId: string
    imageDataUrl: string | null
    isActive: boolean
    sortOrder: number
  }]
  delete: []
}>()

const name = ref('')
const price = ref('')
const stock = ref('')
const barcode = ref('')
const categoryId = ref('')
const isActive = ref(true)
const showKeyboard = ref(false)
const activeField = ref<'price' | 'stock'>('price')

const isEditing = computed(() => !!props.product)
const title = computed(() => isEditing.value ? LOCALE.editProduct : LOCALE.addProduct)

watch(() => props.show, (val) => {
  if (val && props.product) {
    name.value = props.product.name
    price.value = String(props.product.price)
    stock.value = props.product.stock !== null ? String(props.product.stock) : ''
    barcode.value = props.product.barcode || ''
    categoryId.value = props.product.categoryId
    isActive.value = props.product.isActive
  } else if (val) {
    name.value = ''
    price.value = ''
    stock.value = ''
    barcode.value = ''
    categoryId.value = props.categories[0]?.id || ''
    isActive.value = true
  }
  showKeyboard.value = false
})

function handleKeyInput(key: string) {
  const field = activeField.value === 'price' ? price : stock
  if (key === 'delete') {
    field.value = field.value.slice(0, -1)
  } else {
    field.value += key
  }
}

function handleSave() {
  if (!name.value.trim() || !price.value) return
  emit('save', {
    name: name.value.trim(),
    price: Number(price.value),
    stock: stock.value ? Number(stock.value) : null,
    barcode: barcode.value.trim() || null,
    categoryId: categoryId.value,
    imageDataUrl: props.product?.imageDataUrl || null,
    isActive: isActive.value,
    sortOrder: props.product?.sortOrder || 0,
  })
  emit('update:show', false)
}

function handleClose() {
  showKeyboard.value = false
  emit('update:show', false)
}
</script>

<template>
  <van-popup
    :show="show"
    position="bottom"
    round
    closeable
    :duration="0"
    :style="{ height: '85%' }"
    @update:show="handleClose"
  >
    <div class="px-4 pt-8 pb-4 flex flex-col h-full">
      <h2 class="text-lg font-bold text-center mb-4">{{ title }}</h2>

      <div class="flex-1 overflow-auto space-y-4">
        <van-field
          v-model="name"
          :label="LOCALE.productName"
          :placeholder="`輸入${LOCALE.productName}`"
          required
        />

        <van-field
          :label="LOCALE.productCategory"
          required
        >
          <template #input>
            <select v-model="categoryId" class="w-full bg-transparent outline-none text-sm">
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                {{ cat.name }}
              </option>
            </select>
          </template>
        </van-field>

        <van-field
          v-model="price"
          :label="LOCALE.productPrice"
          placeholder="0"
          required
          readonly
          @click="activeField = 'price'; showKeyboard = true"
        />

        <van-field
          v-model="stock"
          :label="LOCALE.productStock"
          :placeholder="LOCALE.productStockUnlimited"
          readonly
          @click="activeField = 'stock'; showKeyboard = true"
        />

        <van-field
          v-model="barcode"
          :label="LOCALE.barcode"
          :placeholder="LOCALE.barcodePlaceholder"
          clearable
        />

        <van-cell v-if="isEditing" :title="isActive ? LOCALE.productActive : LOCALE.productInactive">
          <template #right-icon>
            <van-switch v-model="isActive" size="24" />
          </template>
        </van-cell>
      </div>

      <div class="pt-4 flex flex-col gap-2">
        <button
          class="w-full h-14 rounded-xl bg-accent text-white text-base font-bold active:scale-[0.98] transition-all disabled:bg-gray-300 disabled:cursor-not-allowed"
          :disabled="!name.trim() || !price"
          @click="handleSave"
        >
          {{ LOCALE.saveProduct }}
        </button>
        <button
          v-if="isEditing"
          class="w-full h-11 rounded-xl border border-red-300 text-red-500 text-sm font-medium active:bg-red-50"
          @click="emit('delete')"
        >
          刪除商品
        </button>
      </div>
    </div>

    <van-number-keyboard
      :show="showKeyboard"
      theme="custom"
      :extra-key="'.'"
      :close-button-text="'完成'"
      @blur="showKeyboard = false"
      @input="handleKeyInput"
      @delete="handleKeyInput('delete')"
    />
  </van-popup>
</template>
