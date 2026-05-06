import { Card, Col, Row, Select, Space, Typography, message } from 'antd'
import { useEffect, useMemo, useState } from 'react'

import { listInventory } from '../../services/inventory/service'
import { listLocations } from '../../services/locations/service'
import type { InventoryItem, Location } from '../../types/models'

type LocationNode = Location & { children: LocationNode[] }

function buildTree(locations: Location[]): LocationNode[] {
  const byId = new Map<number, LocationNode>()
  locations.forEach((loc) => byId.set(loc.id, { ...loc, children: [] }))

  const roots: LocationNode[] = []
  byId.forEach((node) => {
    if (node.parent_id && byId.has(node.parent_id)) {
      byId.get(node.parent_id)?.children.push(node)
    } else {
      roots.push(node)
    }
  })
  return roots
}

function collectDescendants(node: LocationNode): number[] {
  const ids = [node.id]
  node.children.forEach((child) => ids.push(...collectDescendants(child)))
  return ids
}

export function LocationsView() {
  const [roots, setRoots] = useState<LocationNode[]>([])
  const [allLocations, setAllLocations] = useState<Location[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [path, setPath] = useState<number[]>([])

  const pathNodes = useMemo(() => {
    const map = new Map(allLocations.map((loc) => [loc.id, loc]))
    return path.map((id) => map.get(id)).filter((node): node is Location => !!node)
  }, [allLocations, path])

  const currentNode = useMemo(() => {
    if (!path.length) {
      return undefined
    }
    const id = path[path.length - 1]
    const stack = [...roots]
    while (stack.length) {
      const node = stack.pop()!
      if (node.id === id) {
        return node
      }
      stack.push(...node.children)
    }
    return undefined
  }, [roots, path])

  const visibleNodes = currentNode?.children ?? roots

  async function loadData() {
    try {
      const [locations, items] = await Promise.all([listLocations(), listInventory()])
      setAllLocations(locations)
      setInventory(items)
      setRoots(buildTree(locations))
    } catch (error) {
      message.error(`Failed to load locations: ${String(error)}`)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  function countInventory(node: LocationNode): number {
    const ids = new Set(collectDescendants(node))
    return inventory
      .filter((item) => item.location_id !== null && ids.has(item.location_id))
      .reduce((sum, item) => sum + item.qty, 0)
  }

  return (
    <div className='panel'>
      <div className='panel-head'>
        <div>
          <Typography.Title level={4}>Locations</Typography.Title>
          <Typography.Text type='secondary'>
            Finder-style hierarchy with recursive inventory totals.
          </Typography.Text>
        </div>
        <Space>
          <Select
            style={{ width: 280 }}
            placeholder='Jump to location'
            allowClear
            options={allLocations.map((loc) => ({ value: loc.id, label: loc.name }))}
            onChange={(value) => {
              if (!value) {
                setPath([])
              } else {
                setPath([value])
              }
            }}
          />
        </Space>
      </div>

      <Typography.Paragraph type='secondary'>
        Path: {pathNodes.map((node) => node.name).join(' / ') || 'Root'}
      </Typography.Paragraph>

      <Row gutter={[16, 16]}>
        {visibleNodes.map((node) => (
          <Col key={node.id} xs={24} sm={12} lg={8}>
            <Card
              hoverable
              title={node.name}
              onClick={() => setPath([...path, node.id])}
              extra={<Typography.Text strong>{countInventory(node)} items</Typography.Text>}
            >
              <Typography.Paragraph>{node.description || 'No description'}</Typography.Paragraph>
              <Typography.Text type='secondary'>
                Coordinate: {node.coordinate || 'N/A'}
              </Typography.Text>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  )
}
