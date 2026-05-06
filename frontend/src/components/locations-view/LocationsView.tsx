import { DeleteOutlined, EditOutlined, EyeOutlined, SwapOutlined } from '@ant-design/icons'
import {
  Button,
  Card,
  Collapse,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Segmented,
  Select,
  Space,
  Table,
  Typography,
  message,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import { listInventory } from '../../services/inventory/service'
import { createTransaction } from '../../services/transactions/service'
import {
  createLocation,
  deleteLocation,
  listLocations,
  updateLocation,
} from '../../services/locations/service'
import type { InventoryItem, Location } from '../../types/models'

type LocationNode = Location & { children: LocationNode[] }

type ViewMode = 'tree' | 'table'

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
  const [rows, setRows] = useState<Location[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('tree')

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const [selectedRecord, setSelectedRecord] = useState<Location | null>(null)
  const [createForm] = Form.useForm()
  const [editForm] = Form.useForm()
  const [itemTransactForm] = Form.useForm()
  const itemTransactQtyDelta = Form.useWatch('qty_delta', itemTransactForm) as number | undefined

  const [isItemViewModalOpen, setIsItemViewModalOpen] = useState(false)
  const [isItemTransactModalOpen, setIsItemTransactModalOpen] = useState(false)
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<InventoryItem | null>(null)

  async function refresh() {
    setLoading(true)
    try {
      const [locations, items] = await Promise.all([listLocations(), listInventory()])
      setRows(locations)
      setInventory(items)
    } catch (error) {
      message.error(`Failed to load locations: ${String(error)}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  const idToName = useMemo(() => {
    const map = new Map<number, string>()
    rows.forEach((row) => map.set(row.id, row.name))
    return map
  }, [rows])

  const treeRoots = useMemo(() => buildTree(rows), [rows])

  const totalByLocationId = useMemo(() => {
    const totals = new Map<number, number>()

    const compute = (node: LocationNode) => {
      const ids = new Set(collectDescendants(node))
      const total = inventory
        .filter((item) => item.location_id !== null && ids.has(item.location_id))
        .reduce((sum, item) => sum + item.qty, 0)
      totals.set(node.id, total)
      node.children.forEach(compute)
    }

    treeRoots.forEach(compute)
    return totals
  }, [inventory, treeRoots])

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) {
      return rows
    }
    return rows.filter((row) => {
      const parentName = row.parent_id ? idToName.get(row.parent_id) ?? '' : ''
      const haystack = [row.name, row.description, row.coordinate, parentName]
        .join(' ')
        .toLowerCase()
      return haystack.includes(term)
    })
  }, [rows, search, idToName])

  const filteredIds = useMemo(() => new Set(filteredRows.map((row) => row.id)), [filteredRows])

  function openView(record: Location) {
    setSelectedRecord(record)
    setIsViewModalOpen(true)
  }

  function openEdit(record: Location) {
    setSelectedRecord(record)
    editForm.setFieldsValue({
      name: record.name,
      description: record.description,
      coordinate: record.coordinate,
      parentId: record.parent_id,
    })
    setIsEditModalOpen(true)
  }

  async function remove(record: Location) {
    try {
      await deleteLocation(record.id)
      await refresh()
      message.success('Location deleted')
    } catch (error) {
      message.error(`Delete failed: ${String(error)}`)
    }
  }

  async function submitCreate() {
    try {
      const values = await createForm.validateFields()
      await createLocation({
        name: values.name,
        description: values.description ?? '',
        coordinate: values.coordinate ?? '',
        parent_id: values.parentId ?? null,
      })
      setIsCreateModalOpen(false)
      createForm.resetFields()
      await refresh()
      message.success('Location created')
    } catch (error) {
      if (error instanceof Error) {
        message.error(`Create failed: ${error.message}`)
      }
    }
  }

  async function submitEdit() {
    if (!selectedRecord) {
      return
    }
    try {
      const values = await editForm.validateFields()
      await updateLocation(selectedRecord.id, {
        name: values.name,
        description: values.description ?? '',
        coordinate: values.coordinate ?? '',
        parent_id: values.parentId ?? null,
      })
      setIsEditModalOpen(false)
      editForm.resetFields()
      await refresh()
      message.success('Location updated')
    } catch (error) {
      if (error instanceof Error) {
        message.error(`Update failed: ${error.message}`)
      }
    }
  }

  function openItemView(item: InventoryItem) {
    setSelectedInventoryItem(item)
    setIsItemViewModalOpen(true)
  }

  function openItemTransact(item: InventoryItem) {
    setSelectedInventoryItem(item)
    itemTransactForm.resetFields()
    setIsItemTransactModalOpen(true)
  }

  async function submitItemTransact() {
    if (!selectedInventoryItem) return
    try {
      const values = await itemTransactForm.validateFields()
      await createTransaction({
        inventory_id: selectedInventoryItem.id,
        qty_delta: Number(values.qty_delta),
        note: values.note ?? '',
      })
      await refresh()
      setIsItemTransactModalOpen(false)
      itemTransactForm.resetFields()
      message.success('Transaction recorded')
    } catch (error) {
      if (error instanceof Error) {
        message.error(`Transaction failed: ${error.message}`)
      }
    }
  }

  const createParentOptions = rows.map((row) => ({ value: row.id, label: row.name }))
  const editParentOptions = rows
    .filter((row) => row.id !== selectedRecord?.id)
    .map((row) => ({ value: row.id, label: row.name }))

  const columns: ColumnsType<Location> = [
    {
      title: 'Name',
      dataIndex: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Coordinate',
      dataIndex: 'coordinate',
      sorter: (a, b) => a.coordinate.localeCompare(b.coordinate),
      render: (value: string) => value || '-',
    },
    {
      title: 'Parent',
      dataIndex: 'parent_id',
      sorter: (a, b) => {
        const aName = a.parent_id ? idToName.get(a.parent_id) ?? '' : ''
        const bName = b.parent_id ? idToName.get(b.parent_id) ?? '' : ''
        return aName.localeCompare(bName)
      },
      render: (value: number | null) => (value ? idToName.get(value) ?? '-' : '-'),
    },
    {
      title: 'Total Inventory',
      key: 'inventory_total',
      sorter: (a, b) =>
        (totalByLocationId.get(a.id) ?? 0) - (totalByLocationId.get(b.id) ?? 0),
      render: (_, record) => totalByLocationId.get(record.id) ?? 0,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button icon={<EyeOutlined />} onClick={() => openView(record)}>
            View
          </Button>
          <Popconfirm
            title='Delete location?'
            onConfirm={() => void remove(record)}
            okText='Delete'
            okButtonProps={{ danger: true }}
          >
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  function renderTree(nodes: LocationNode[], depth = 0): ReactNode[] {
    return nodes.flatMap((node) => {
      const visible = filteredIds.has(node.id)
      const content = visible ? (
        <Card
          key={node.id}
          size='small'
          style={{ marginLeft: depth * 20, marginBottom: 10 }}
          title={node.name}
          extra={<Typography.Text strong>{totalByLocationId.get(node.id) ?? 0} items</Typography.Text>}
        >
          <Typography.Paragraph style={{ marginBottom: 8 }}>
            {node.description || 'No description'}
          </Typography.Paragraph>
          <Typography.Text type='secondary'>Coordinate: {node.coordinate || '-'}</Typography.Text>
          <br />
          <Typography.Text type='secondary'>
            Parent: {node.parent_id ? idToName.get(node.parent_id) ?? '-' : '-'}
          </Typography.Text>
          <div style={{ marginTop: 10 }}>
            <Space>
              <Button icon={<EyeOutlined />} onClick={() => openView(node)}>
                View
              </Button>
              <Popconfirm
                title='Delete location?'
                onConfirm={() => void remove(node)}
                okText='Delete'
                okButtonProps={{ danger: true }}
              >
                <Button danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </Space>
          </div>

          {node.children.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <Collapse
                size='small'
                items={[
                  {
                    key: `children-${node.id}`,
                    label: `Children (${node.children.length})`,
                    children: <div>{renderTree(node.children, depth + 1)}</div>,
                  },
                ]}
              />
            </div>
          )}
        </Card>
      ) : null

      return content ? [content] : []
    })
  }

  const selectedTotal = selectedRecord ? totalByLocationId.get(selectedRecord.id) ?? 0 : 0
  const selectedLocationItems = selectedRecord
    ? inventory.filter((item) => item.location_id === selectedRecord.id)
    : []

  return (
    <div className='panel'>
      <div className='panel-head'>
        <div>
          <Typography.Title level={4}>Locations</Typography.Title>
          <Typography.Text type='secondary'>
            Toggle between tree and table views with matching row-level actions.
          </Typography.Text>
        </div>
        <Space>
          <Segmented<ViewMode>
            value={viewMode}
            onChange={(value) => setViewMode(value)}
            options={[
              { label: 'Tree', value: 'tree' },
              { label: 'Table', value: 'table' },
            ]}
          />
          <Input.Search
            placeholder='Search locations'
            allowClear
            onChange={(event) => setSearch(event.target.value)}
            style={{ width: 240 }}
          />
          <Button type='primary' onClick={() => setIsCreateModalOpen(true)}>
            Create New
          </Button>
        </Space>
      </div>

      {viewMode === 'tree' ? (
        <div>{renderTree(treeRoots)}</div>
      ) : (
        <Table
          rowKey='id'
          loading={loading}
          columns={columns}
          dataSource={filteredRows}
          pagination={{ pageSize: 10 }}
        />
      )}

      <Modal
        title='Create Location'
        open={isCreateModalOpen}
        onCancel={() => setIsCreateModalOpen(false)}
        onOk={() => void submitCreate()}
        okText='Create'
      >
        <Form form={createForm} layout='vertical'>
          <Form.Item name='name' label='Name' rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name='description' label='Description'>
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name='coordinate' label='Coordinate'>
            <Input />
          </Form.Item>
          <Form.Item name='parentId' label='Parent'>
            <Select allowClear options={createParentOptions} placeholder='No parent' />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title='Location Details'
        open={isViewModalOpen}
        onCancel={() => setIsViewModalOpen(false)}
        footer={
          <Space>
            <Button onClick={() => setIsViewModalOpen(false)}>Close</Button>
            <Button
              icon={<EditOutlined />}
              onClick={() => {
                setIsViewModalOpen(false)
                if (selectedRecord) {
                  openEdit(selectedRecord)
                }
              }}
            >
              Edit
            </Button>
          </Space>
        }
      >
        {selectedRecord && (
          <Space direction='vertical' style={{ width: '100%' }} size='middle'>
            <Descriptions bordered column={1} size='small'>
              <Descriptions.Item label='Name'>{selectedRecord.name}</Descriptions.Item>
              <Descriptions.Item label='Description'>
                {selectedRecord.description || '-'}
              </Descriptions.Item>
              <Descriptions.Item label='Coordinate'>
                {selectedRecord.coordinate || '-'}
              </Descriptions.Item>
              <Descriptions.Item label='Parent'>
                {selectedRecord.parent_id ? idToName.get(selectedRecord.parent_id) ?? '-' : '-'}
              </Descriptions.Item>
              <Descriptions.Item label='Total Inventory'>{selectedTotal}</Descriptions.Item>
            </Descriptions>

            <div>
              <Typography.Text strong>Items In This Location</Typography.Text>
              <Table
                style={{ marginTop: 8 }}
                rowKey='id'
                size='small'
                pagination={false}
                dataSource={selectedLocationItems}
                locale={{ emptyText: 'No direct items in this location' }}
                columns={[
                  { title: 'Name', dataIndex: 'name', key: 'name' },
                  { title: 'Qty', dataIndex: 'qty', key: 'qty' },
                  {
                    title: 'Price',
                    dataIndex: 'price',
                    key: 'price',
                    render: (value: number) => `$${value.toFixed(2)}`,
                  },
                  {
                    title: '',
                    key: 'actions',
                    render: (_: unknown, item: InventoryItem) => (
                      <Space size='small'>
                        <Button
                          size='small'
                          icon={<EyeOutlined />}
                          onClick={() => openItemView(item)}
                        />
                        <Button
                          size='small'
                          icon={<SwapOutlined />}
                          onClick={() => openItemTransact(item)}
                        />
                      </Space>
                    ),
                  },
                ]}
              />
            </div>
          </Space>
        )}
      </Modal>

      <Modal
        title='Edit Location'
        open={isEditModalOpen}
        onCancel={() => setIsEditModalOpen(false)}
        onOk={() => void submitEdit()}
        okText='Save'
      >
        <Form form={editForm} layout='vertical'>
          <Form.Item name='name' label='Name' rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name='description' label='Description'>
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name='coordinate' label='Coordinate'>
            <Input />
          </Form.Item>
          <Form.Item name='parentId' label='Parent'>
            <Select allowClear options={editParentOptions} placeholder='No parent' />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title='Item Details'
        open={isItemViewModalOpen}
        onCancel={() => setIsItemViewModalOpen(false)}
        footer={<Button onClick={() => setIsItemViewModalOpen(false)}>Close</Button>}
      >
        {selectedInventoryItem && (
          <Descriptions bordered column={1} size='small'>
            <Descriptions.Item label='Name'>{selectedInventoryItem.name}</Descriptions.Item>
            <Descriptions.Item label='Description'>
              {selectedInventoryItem.description || '-'}
            </Descriptions.Item>
            <Descriptions.Item label='Qty'>{selectedInventoryItem.qty}</Descriptions.Item>
            <Descriptions.Item label='Price'>
              ${selectedInventoryItem.price.toFixed(2)}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      <Modal
        title={`Transact: ${selectedInventoryItem?.name ?? ''}`}
        open={isItemTransactModalOpen}
        onCancel={() => setIsItemTransactModalOpen(false)}
        onOk={() => void submitItemTransact()}
        okText='Record'
      >
        {selectedInventoryItem && (
          <Space direction='vertical' style={{ width: '100%' }}>
            <Descriptions bordered column={1} size='small'>
              <Descriptions.Item label='Current Qty'>
                {selectedInventoryItem.qty}
              </Descriptions.Item>
              <Descriptions.Item label='After'>
                {selectedInventoryItem.qty + (itemTransactQtyDelta ?? 0)}
              </Descriptions.Item>
            </Descriptions>
            <Form form={itemTransactForm} layout='vertical'>
              <Form.Item
                name='qty_delta'
                label='Qty Delta'
                rules={[{ required: true, message: 'Enter a quantity' }]}
              >
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name='note' label='Note'>
                <Input.TextArea rows={2} />
              </Form.Item>
            </Form>
          </Space>
        )}
      </Modal>
    </div>
  )
}
