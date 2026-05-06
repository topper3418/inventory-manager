import { request } from '../api/client'

type TransactionPayload = {
  inventory_id: number
  qty_delta: number
  note?: string
}

export function createTransaction(payload: TransactionPayload): Promise<void> {
  return request<void>('/transactions', 'POST', payload)
}
