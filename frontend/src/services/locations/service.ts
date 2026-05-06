import { request } from '../api/client'
import type { Location } from '../../types/models'

export function listLocations(): Promise<Location[]> {
  return request<Location[]>('/locations')
}

export function createLocation(payload: Partial<Location>): Promise<Location> {
  return request<Location>('/locations', 'POST', payload)
}

export function updateLocation(id: number, payload: Partial<Location>): Promise<Location> {
  return request<Location>(`/locations/${id}`, 'PATCH', payload)
}

export function deleteLocation(id: number): Promise<void> {
  return request<void>(`/locations/${id}`, 'DELETE')
}
