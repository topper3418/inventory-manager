import { request } from '../api/client'
import type { InventoryItem } from '../../types/models'

export function listInventory(): Promise<InventoryItem[]> {
  return request<InventoryItem[]>('/inventory')
}

export function createInventory(payload: Partial<InventoryItem>): Promise<InventoryItem> {
  return request<InventoryItem>('/inventory', 'POST', payload)
}

export function updateInventory(
  id: number,
  payload: Partial<InventoryItem>,
): Promise<InventoryItem> {
  return request<InventoryItem>(`/inventory/${id}`, 'PATCH', payload)
}

export function deleteInventory(id: number): Promise<void> {
  return request<void>(`/inventory/${id}`, 'DELETE')
}
