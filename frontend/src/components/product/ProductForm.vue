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
  readonlyName?: boolean
  canDelete?: boolean
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
    <div class="product-form px-3 pt-5 pb-3 d-flex flex-column h-100">
      <h2 class="fs-5 fw-bold text-center mb-4">{{ title }}</h2>

      <div class="flex-grow-1 overflow-auto d-flex flex-column gap-3">
        <van-field
          v-model="name"
          :label="LOCALE.productName"
          :placeholder="`輸入${LOCALE.productName}`"
          required
          :readonly="readonlyName && isEditing"
          :class="{ 'field-readonly': readonlyName && isEditing }"
        />

        <van-field
          :label="LOCALE.productCategory"
          required
        >
          <template #input>
            <select v-model="categoryId" class="w-100 bg-transparent border-0 outline-none small">
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

      <div class="pt-3 d-flex flex-column gap-2">
        <button
          class="btn-accent w-100"
          :disabled="!name.trim() || !price"
          @click="handleSave"
        >
          {{ LOCALE.saveProduct }}
        </button>
        <button
          v-if="isEditing && canDelete !== false"
          class="btn-danger-outline w-100"
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

<style scoped>
.product-form {
  --c-primary: #1a1a2e;
  --c-accent: #e94560;
  --c-surface: #f5f6f8;
  --c-border: #dee2e6;
  --c-text: #1a1a2e;
  --c-text-muted: #6c757d;
  --radius: 10px;
  --radius-sm: 6px;
}
.h-100 { height: 100%; }
.outline-none { outline: none; }

.btn-accent {
  height: 56px;
  min-height: 44px;
  border-radius: var(--radius);
  background-color: var(--c-accent);
  color: #fff;
  font-size: 1rem;
  font-weight: 700;
  border: none;
  cursor: pointer;
}
.btn-accent:disabled {
  background-color: var(--c-border);
  cursor: not-allowed;
}

.btn-danger-outline {
  height: 44px;
  min-height: 44px;
  border-radius: var(--radius);
  background: transparent;
  border: 1px solid #dc3545;
  color: #dc3545;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
}
.btn-danger-outline:active {
  background-color: #fff5f5;
}
.field-readonly {
  opacity: 0.6;
}
</style>
