import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { AppShell } from './AppShell'

vi.mock('../inventory-view/InventoryView', () => ({
  InventoryView: () => <div>Mock Inventory View</div>,
}))

vi.mock('../locations-view/LocationsView', () => ({
  LocationsView: () => <div>Mock Locations View</div>,
}))

vi.mock('../categories-view/CategoriesView', () => ({
  CategoriesView: () => <div>Mock Categories View</div>,
}))

describe('AppShell', () => {
  it('renders default inventory view', () => {
    render(<AppShell />)
    expect(screen.getByText('Inventory Manager')).toBeInTheDocument()
    expect(screen.getByText('Mock Inventory View')).toBeInTheDocument()
  })

  it('switches to categories view from menu click', () => {
    render(<AppShell />)
    fireEvent.click(screen.getByText('Categories'))
    expect(screen.getByText('Mock Categories View')).toBeInTheDocument()
  })
})
