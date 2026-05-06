import { request } from '../api/client'
import type { Category } from '../../types/models'

export function listCategories(): Promise<Category[]> {
  return request<Category[]>('/categories')
}

export function createCategory(payload: Partial<Category>): Promise<Category> {
  return request<Category>('/categories', 'POST', payload)
}

export function updateCategory(id: number, payload: Partial<Category>): Promise<Category> {
  return request<Category>(`/categories/${id}`, 'PATCH', payload)
}

export function deleteCategory(id: number): Promise<void> {
  return request<void>(`/categories/${id}`, 'DELETE')
}
