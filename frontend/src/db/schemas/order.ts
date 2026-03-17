import type { RxJsonSchema } from 'rxdb'

export interface OrderItem {
  productId: string
  productName: string
  unitPrice: number
  quantity: number
  subtotal: number
}

export interface OrderDoc {
  id: string
  orderNumber: string
  items: OrderItem[]
  totalAmount: number
  paymentMethod: 'cash' | 'line_pay' | 'transfer'
  note: string | null
  deviceId: string
  createdAt: number
  syncedAt: number | null
}

export const orderSchema: RxJsonSchema<OrderDoc> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 36 },
    orderNumber: { type: 'string', maxLength: 50 },
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          productId: { type: 'string' },
          productName: { type: 'string' },
          unitPrice: { type: 'number' },
          quantity: { type: 'number' },
          subtotal: { type: 'number' },
        },
        required: ['productId', 'productName', 'unitPrice', 'quantity', 'subtotal'],
      },
    },
    totalAmount: { type: 'number', multipleOf: 1, minimum: 0, maximum: 9999999 },
    paymentMethod: {
      type: 'string',
      enum: ['cash', 'line_pay', 'transfer'],
    },
    note: { type: ['string', 'null'] },
    deviceId: { type: 'string' },
    createdAt: { type: 'number', multipleOf: 1, minimum: 0, maximum: 99999999999999 },
    syncedAt: { type: ['number', 'null'] },
  },
  required: ['id', 'orderNumber', 'items', 'totalAmount', 'paymentMethod', 'deviceId', 'createdAt'],
  indexes: ['createdAt', 'orderNumber'],
}
