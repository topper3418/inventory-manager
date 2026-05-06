import { DeleteOutlined, EditOutlined, EyeOutlined, SwapOutlined } from '@ant-design/icons'
import {
  Button,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Typography,
  message,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useEffect, useMemo, useState } from 'react'

import { listCategories } from '../../services/categories/service'
import {
  createInventory,
  deleteInventory,
  listInventory,
  updateInventory,
} from '../../services/inventory/service'
import { listLocations } from '../../services/locations/service'
import { createTransaction } from '../../services/transactions/service'
import type { Category, InventoryItem, Location } from '../../types/models'

export function InventoryView() {
  const [rows, setRows] = useState<InventoryItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isTransactModalOpen, setIsTransactModalOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<InventoryItem | null>(null)

  const [form] = Form.useForm()
  const [editForm] = Form.useForm()
  const [transactForm] = Form.useForm()
  const transactionQty = Form.useWatch('transactionQty', transactForm)

  async function refresh() {
    setLoading(true)
    try {
      const [items, categoryRows, locationRows] = await Promise.all([
        listInventory(),
        listCategories(),
        listLocations(),
      ])
      setRows(items)
      setCategories(categoryRows)
      setLocations(locationRows)
    } catch (error) {
      message.error(`Failed to load inventory: ${String(error)}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  const categoryById = useMemo(() => {
    const map = new Map<number, string>()
    categories.forEach((category) => map.set(category.id, category.name))
    return map
  }, [categories])

  const locationById = useMemo(() => {
    const map = new Map<number, string>()
    locations.forEach((location) => map.set(location.id, location.name))
    return map
  }, [locations])

  const categoryOptions = categories.map((category) => ({
    value: category.id,
    label: category.name,
  }))

  const locationOptions = locations.map((location) => ({
    value: location.id,
    label: location.name,
  }))

  async function remove(record: InventoryItem) {
    try {
      await deleteInventory(record.id)
      await refresh()
      message.success('Inventory item deleted')
    } catch (error) {
      message.error(`Delete failed: ${String(error)}`)
    }
  }

  function openView(record: InventoryItem) {
    setSelectedRecord(record)
    setIsViewModalOpen(true)
  }

  function openEdit(record: InventoryItem) {
    setSelectedRecord(record)
    editForm.setFieldsValue({
      name: record.name,
      description: record.description,
      link: record.link,
      data: record.data,
      qty: record.qty,
      price: record.price,
      categoryId: record.category_id,
      locationId: record.location_id,
    })
    setIsEditModalOpen(true)
  }

  function openTransact(record: InventoryItem) {
    setSelectedRecord(record)
    transactForm.setFieldsValue({
      transactionQty: 1,
      note: '',
    })
    setIsTransactModalOpen(true)
  }

  async function submitCreate() {
    try {
      const values = await form.validateFields()
      await createInventory({
        name: values.name,
        description: values.description ?? '',
        link: values.link ?? '',
        data: values.data ?? '',
        qty: values.qty ?? 0,
        price: values.price ?? 0,
        category_id: values.categoryId ?? null,
        location_id: values.locationId ?? null,
      })
      setIsModalOpen(false)
      form.resetFields()
      await refresh()
      message.success('Inventory item created')
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
      await updateInventory(selectedRecord.id, {
        name: values.name,
        description: values.description ?? '',
        link: values.link ?? '',
        data: values.data ?? '',
        qty: values.qty ?? 0,
        price: values.price ?? 0,
        category_id: values.categoryId ?? null,
        location_id: values.locationId ?? null,
      })
      setIsEditModalOpen(false)
      editForm.resetFields()
      await refresh()
      message.success('Inventory item updated')
    } catch (error) {
      if (error instanceof Error) {
        message.error(`Update failed: ${error.message}`)
      }
    }
  }

  async function submitTransaction() {
    if (!selectedRecord) {
      return
    }

    try {
      const values = await transactForm.validateFields()
      const beforeQty = selectedRecord.qty
      const requestedQty = Number(values.transactionQty)
      if (!Number.isFinite(requestedQty) || requestedQty === 0) {
        message.error('Transaction quantity must be non-zero')
        return
      }

      const afterQty = Math.max(0, beforeQty + requestedQty)
      const appliedDelta = afterQty - beforeQty
      if (appliedDelta === 0) {
        message.error('Transaction results in no quantity change')
        return
      }

      await createTransaction({
        inventory_id: selectedRecord.id,
        qty_delta: appliedDelta,
        note: values.note ?? '',
      })

      setIsTransactModalOpen(false)
      transactForm.resetFields()
      await refresh()
      message.success('Transaction recorded')
    } catch (error) {
      if (error instanceof Error) {
        message.error(`Transaction failed: ${error.message}`)
      }
    }
  }

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) {
      return rows
    }
    return rows.filter((item) => {
      const categoryName = item.category_id ? categoryById.get(item.category_id) ?? '' : ''
      const locationName = item.location_id ? locationById.get(item.location_id) ?? '' : ''
      const haystack = [
        item.name,
        item.description,
        item.data,
        item.link,
        categoryName,
        locationName,
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(term)
    })
  }, [rows, search, categoryById, locationById])

  const columns: ColumnsType<InventoryItem> = [
    {
      title: 'Name',
      dataIndex: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Category',
      dataIndex: 'category_id',
      sorter: (a, b) => {
        const aCategory = a.category_id ? categoryById.get(a.category_id) ?? '' : ''
        const bCategory = b.category_id ? categoryById.get(b.category_id) ?? '' : ''
        return aCategory.localeCompare(bCategory)
      },
      render: (value: number | null) => (value ? categoryById.get(value) ?? '-' : '-'),
    },
    {
      title: 'Quantity',
      dataIndex: 'qty',
      sorter: (a, b) => a.qty - b.qty,
    },
    {
      title: 'Price',
      dataIndex: 'price',
      sorter: (a, b) => a.price - b.price,
      render: (value: number) => `$${value.toFixed(2)}`,
    },
    {
      title: 'Updated',
      dataIndex: 'updated_at',
      defaultSortOrder: 'descend',
      sorter: (a, b) =>
        new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime(),
      render: (value: string) => new Date(value).toLocaleString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button icon={<EyeOutlined />} onClick={() => openView(record)}>
            View
          </Button>
          <Button icon={<SwapOutlined />} onClick={() => openTransact(record)}>
            Transact
          </Button>
          <Popconfirm
            title='Delete inventory item?'
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

  return (
    <div className='panel'>
      <div className='panel-head'>
        <div>
          <Typography.Title level={4}>Inventory</Typography.Title>
          <Typography.Text type='secondary'>
            Create, search, sort, view details, and transact inventory with before/after preview.
          </Typography.Text>
        </div>
        <Space>
          <Input.Search
            placeholder='Search inventory'
            allowClear
            onChange={(event) => setSearch(event.target.value)}
            style={{ width: 260 }}
          />
          <Button type='primary' onClick={() => setIsModalOpen(true)}>
            Create New
          </Button>
        </Space>
      </div>

      <Table
        rowKey='id'
        loading={loading}
        columns={columns}
        dataSource={filteredRows}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title='Create Inventory Item'
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => void submitCreate()}
        okText='Create'
      >
        <Form form={form} layout='vertical'>
          <Form.Item name='name' label='Name' rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name='description' label='Description'>
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name='link' label='Link'>
            <Input />
          </Form.Item>
          <Form.Item name='data' label='Data'>
            <Input.TextArea rows={2} />
          </Form.Item>
          <Space size='middle' style={{ width: '100%' }}>
            <Form.Item name='qty' label='Qty' initialValue={0}>
              <InputNumber min={0} />
            </Form.Item>
            <Form.Item name='price' label='Price' initialValue={0}>
              <InputNumber min={0} step={0.01} />
            </Form.Item>
          </Space>
          <Space size='middle' style={{ width: '100%' }}>
            <Form.Item name='categoryId' label='Category'>
              <Select allowClear options={categoryOptions} placeholder='Select category' />
            </Form.Item>
            <Form.Item name='locationId' label='Location'>
              <Select allowClear options={locationOptions} placeholder='Select location' />
            </Form.Item>
          </Space>
        </Form>
      </Modal>

      <Modal
        title='Inventory Details'
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
            <Button
              type='primary'
              icon={<SwapOutlined />}
              onClick={() => {
                setIsViewModalOpen(false)
                if (selectedRecord) {
                  openTransact(selectedRecord)
                }
              }}
            >
              Transact
            </Button>
          </Space>
        }
      >
        {selectedRecord && (
          <Descriptions bordered column={1} size='small'>
            <Descriptions.Item label='Name'>{selectedRecord.name}</Descriptions.Item>
            <Descriptions.Item label='Description'>
              {selectedRecord.description || '-'}
            </Descriptions.Item>
            <Descriptions.Item label='Link'>{selectedRecord.link || '-'}</Descriptions.Item>
            <Descriptions.Item label='Data'>{selectedRecord.data || '-'}</Descriptions.Item>
            <Descriptions.Item label='Qty'>{selectedRecord.qty}</Descriptions.Item>
            <Descriptions.Item label='Price'>
              ${selectedRecord.price.toFixed(2)}
            </Descriptions.Item>
            <Descriptions.Item label='Category'>
              {selectedRecord.category_id
                ? categoryById.get(selectedRecord.category_id) ?? '-'
                : '-'}
            </Descriptions.Item>
            <Descriptions.Item label='Location'>
              {selectedRecord.location_id
                ? locationById.get(selectedRecord.location_id) ?? '-'
                : '-'}
            </Descriptions.Item>
            <Descriptions.Item label='Created'>
              {new Date(selectedRecord.created_at).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label='Updated'>
              {new Date(selectedRecord.updated_at).toLocaleString()}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      <Modal
        title='Edit Inventory Item'
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
          <Form.Item name='link' label='Link'>
            <Input />
          </Form.Item>
          <Form.Item name='data' label='Data'>
            <Input.TextArea rows={2} />
          </Form.Item>
          <Space size='middle' style={{ width: '100%' }}>
            <Form.Item name='qty' label='Qty'>
              <InputNumber min={0} />
            </Form.Item>
            <Form.Item name='price' label='Price'>
              <InputNumber min={0} step={0.01} />
            </Form.Item>
          </Space>
          <Space size='middle' style={{ width: '100%' }}>
            <Form.Item name='categoryId' label='Category'>
              <Select allowClear options={categoryOptions} placeholder='Select category' />
            </Form.Item>
            <Form.Item name='locationId' label='Location'>
              <Select allowClear options={locationOptions} placeholder='Select location' />
            </Form.Item>
          </Space>
        </Form>
      </Modal>

      <Modal
        title='Transact Inventory'
        open={isTransactModalOpen}
        onCancel={() => setIsTransactModalOpen(false)}
        onOk={() => void submitTransaction()}
        okText='Submit Transaction'
      >
        <Form form={transactForm} layout='vertical'>
          <Form.Item
            name='transactionQty'
            label='Transaction Qty'
            rules={[{ required: true, message: 'Enter a transaction quantity' }]}
          >
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Descriptions bordered column={1} size='small'>
            <Descriptions.Item label='Before Qty'>{selectedRecord?.qty ?? 0}</Descriptions.Item>
            <Descriptions.Item label='After Preview'>
              {Math.max(0, (selectedRecord?.qty ?? 0) + Number(transactionQty ?? 0))}
            </Descriptions.Item>
          </Descriptions>
          <Form.Item name='note' label='Note'>
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
