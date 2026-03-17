export const PAYMENT_METHODS = [
  { value: 'cash' as const, label: '現金', icon: '💵' },
  { value: 'line_pay' as const, label: 'LINE Pay', icon: '💳' },
  { value: 'transfer' as const, label: '轉帳', icon: '🏦' },
] as const

export type PaymentMethod = 'cash' | 'line_pay' | 'transfer'

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  cash: '現金',
  line_pay: 'LINE Pay',
  transfer: '轉帳',
}
