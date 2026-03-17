import type { RxJsonSchema } from 'rxdb'

export interface CategoryDoc {
  id: string
  name: string
  sortOrder: number
  createdAt: number
  updatedAt: number
}

export const categorySchema: RxJsonSchema<CategoryDoc> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 36 },
    name: { type: 'string' },
    sortOrder: { type: 'number', multipleOf: 1, minimum: 0, maximum: 10000 },
    createdAt: { type: 'number', multipleOf: 1, minimum: 0, maximum: 99999999999999 },
    updatedAt: { type: 'number', multipleOf: 1, minimum: 0, maximum: 99999999999999 },
  },
  required: ['id', 'name', 'sortOrder', 'createdAt', 'updatedAt'],
  indexes: ['sortOrder'],
}
