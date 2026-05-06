import { DeleteOutlined, MinusOutlined, PlusOutlined } from '@ant-design/icons'
import {
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useEffect, useMemo, useState } from 'react'

import {
  createInventory,
  deleteInventory,
  listInventory,
  updateInventory,
} from '../../services/inventory/service'
import type { InventoryItem } from '../../types/models'

export function InventoryView() {
  const [rows, setRows] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form] = Form.useForm()

  async function refresh() {
    setLoading(true)
    try {
      const items = await listInventory()
      setRows(items)
    } catch (error) {
      message.error(`Failed to load inventory: ${String(error)}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  async function changeQty(record: InventoryItem, delta: number) {
    try {
      const nextQty = Math.max(0, record.qty + delta)
      await updateInventory(record.id, { qty: nextQty })
      await refresh()
    } catch (error) {
      message.error(`Failed to update quantity: ${String(error)}`)
    }
  }

  async function remove(record: InventoryItem) {
    try {
      await deleteInventory(record.id)
      await refresh()
      message.success('Inventory item deleted')
    } catch (error) {
      message.error(`Delete failed: ${String(error)}`)
    }
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

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) {
      return rows
    }
    return rows.filter((item) => {
      const haystack = [item.name, item.description, item.data, item.link]
        .join(' ')
        .toLowerCase()
      return haystack.includes(term)
    })
  }, [rows, search])

  const columns: ColumnsType<InventoryItem> = [
    {
      title: 'Name',
      dataIndex: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Quantity',
      dataIndex: 'qty',
      sorter: (a, b) => a.qty - b.qty,
      render: (_, record) => (
        <Space>
          <Button icon={<MinusOutlined />} onClick={() => void changeQty(record, -1)} />
          <Tag color={record.qty > 0 ? 'green' : 'red'}>{record.qty}</Tag>
          <Button icon={<PlusOutlined />} onClick={() => void changeQty(record, 1)} />
        </Space>
      ),
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
        <Popconfirm
          title='Delete inventory item?'
          onConfirm={() => void remove(record)}
          okText='Delete'
          okButtonProps={{ danger: true }}
        >
          <Button danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ]

  return (
    <div className='panel'>
      <div className='panel-head'>
        <div>
          <Typography.Title level={4}>Inventory</Typography.Title>
          <Typography.Text type='secondary'>
            Create, search, sort, and adjust quantities.
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
            <Form.Item name='categoryId' label='Category ID'>
              <InputNumber min={1} />
            </Form.Item>
            <Form.Item name='locationId' label='Location ID'>
              <InputNumber min={1} />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </div>
  )
}
