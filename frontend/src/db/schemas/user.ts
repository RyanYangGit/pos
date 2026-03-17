import type { RxJsonSchema } from 'rxdb'

export interface UserDoc {
  id: string
  username: string
  displayName: string
  role: 'super_admin' | 'admin' | 'cashier'
  companyId: string | null
  pinHash: string | null
}

export const userSchema: RxJsonSchema<UserDoc> = {
  version: 1,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 36 },
    username: { type: 'string', maxLength: 100 },
    displayName: { type: 'string', maxLength: 255 },
    role: { type: 'string', enum: ['super_admin', 'admin', 'cashier'], maxLength: 20 },
    companyId: { type: ['string', 'null'] },
    pinHash: { type: ['string', 'null'] },
  },
  required: ['id', 'username', 'displayName', 'role'],
}
