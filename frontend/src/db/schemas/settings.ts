import type { RxJsonSchema } from 'rxdb'

export interface AppSettingsDoc {
  id: string
  shopName: string
  deviceName: string
  orderPrefix: string
  nextOrderSeq: number
  lastOrderDate: string
}

export const appSettingsSchema: RxJsonSchema<AppSettingsDoc> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 36 },
    shopName: { type: 'string' },
    deviceName: { type: 'string' },
    orderPrefix: { type: 'string' },
    nextOrderSeq: { type: 'number' },
    lastOrderDate: { type: 'string' },
  },
  required: ['id', 'shopName', 'deviceName', 'orderPrefix', 'nextOrderSeq', 'lastOrderDate'],
}
