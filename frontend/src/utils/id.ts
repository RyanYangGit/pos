import { v4 as uuidv4 } from 'uuid'

export function generateId(): string {
  return uuidv4()
}

export function generateOrderNumber(prefix: string, seq: number, date: string): string {
  const seqStr = String(seq).padStart(3, '0')
  return `${date}-${prefix}${seqStr}`
}
