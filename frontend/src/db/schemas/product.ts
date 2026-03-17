import type { RxJsonSchema } from 'rxdb'

export interface ProductDoc {
  id: string
  categoryId: string
  name: string
  price: number
  stock: number | null
  barcode: string | null
  imageDataUrl: string | null
  isActive: boolean
  sortOrder: number
  createdAt: number
  updatedAt: number
}

export const productSchema: RxJsonSchema<ProductDoc> = {
  version: 1,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 36 },
    categoryId: { type: 'string', maxLength: 36 },
    name: { type: 'string' },
    price: { type: 'number', multipleOf: 1, minimum: 0, maximum: 9999999 },
    stock: { type: ['number', 'null'] },
    barcode: { type: ['string', 'null'] },
    imageDataUrl: { type: ['string', 'null'] },
    isActive: { type: 'boolean' },
    sortOrder: { type: 'number', multipleOf: 1, minimum: 0, maximum: 10000 },
    createdAt: { type: 'number', multipleOf: 1, minimum: 0, maximum: 99999999999999 },
    updatedAt: { type: 'number', multipleOf: 1, minimum: 0, maximum: 99999999999999 },
  },
  required: ['id', 'categoryId', 'name', 'price', 'isActive', 'sortOrder', 'createdAt', 'updatedAt'],
  indexes: ['categoryId', 'sortOrder'],
}
