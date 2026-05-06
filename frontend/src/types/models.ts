export type InventoryItem = {
  id: number
  name: string
  description: string
  link: string
  data: string
  qty: number
  price: number
  category_id: number | null
  location_id: number | null
  created_at: string
  updated_at: string
}

export type Location = {
  id: number
  name: string
  description: string
  coordinate: string
  parent_id: number | null
}

export type Category = {
  id: number
  name: string
  description: string
  parent_id: number | null
}
