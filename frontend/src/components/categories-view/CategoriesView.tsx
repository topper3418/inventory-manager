import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import {
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Space,
  Table,
  Typography,
  message,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useEffect, useState } from 'react'

import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from '../../services/categories/service'
import type { Category } from '../../types/models'

export function CategoriesView() {
  const [rows, setRows] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form] = Form.useForm()

  async function refresh() {
    setLoading(true)
    try {
      setRows(await listCategories())
    } catch (error) {
      message.error(`Failed to load categories: ${String(error)}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  function openCreate() {
    setEditing(null)
    form.resetFields()
    setIsModalOpen(true)
  }

  function openEdit(record: Category) {
    setEditing(record)
    form.setFieldsValue({
      name: record.name,
      description: record.description,
      parentId: record.parent_id,
    })
    setIsModalOpen(true)
  }

  async function submit() {
    try {
      const values = await form.validateFields()
      if (editing) {
        await updateCategory(editing.id, {
          name: values.name,
          description: values.description ?? '',
          parent_id: values.parentId ?? null,
        })
        message.success('Category updated')
      } else {
        await createCategory({
          name: values.name,
          description: values.description ?? '',
          parent_id: values.parentId ?? null,
        })
        message.success('Category created')
      }
      setIsModalOpen(false)
      form.resetFields()
      await refresh()
    } catch (error) {
      if (error instanceof Error) {
        message.error(`Save failed: ${error.message}`)
      }
    }
  }

  async function remove(record: Category) {
    try {
      await deleteCategory(record.id)
      await refresh()
      message.success('Category deleted')
    } catch (error) {
      message.error(`Delete failed: ${String(error)}`)
    }
  }

  const columns: ColumnsType<Category> = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Description',
      dataIndex: 'description',
    },
    {
      title: 'Parent ID',
      dataIndex: 'parent_id',
      render: (value: number | null) => value ?? '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => openEdit(record)} />
          <Popconfirm
            title='Delete this category?'
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
          <Typography.Title level={4}>Categories</Typography.Title>
          <Typography.Text type='secondary'>
            Create, update, and organize category hierarchy.
          </Typography.Text>
        </div>
        <Button type='primary' icon={<PlusOutlined />} onClick={openCreate}>
          New Category
        </Button>
      </div>

      <Table rowKey='id' loading={loading} columns={columns} dataSource={rows} />

      <Modal
        title={editing ? 'Edit Category' : 'Create Category'}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => void submit()}
      >
        <Form form={form} layout='vertical'>
          <Form.Item name='name' label='Name' rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name='description' label='Description'>
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name='parentId' label='Parent ID'>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
