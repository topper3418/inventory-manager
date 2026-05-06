import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import {
  Button,
  Card,
  Collapse,
  Form,
  Input,
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

import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from '../../services/categories/service'
import type { Category } from '../../types/models'

type CategoryNode = Category & { children: CategoryNode[] }
type ViewMode = 'tree' | 'table'

function buildTree(categories: Category[]): CategoryNode[] {
  const byId = new Map<number, CategoryNode>()
  categories.forEach((cat) => byId.set(cat.id, { ...cat, children: [] }))

  const roots: CategoryNode[] = []
  byId.forEach((node) => {
    if (node.parent_id && byId.has(node.parent_id)) {
      byId.get(node.parent_id)?.children.push(node)
    } else {
      roots.push(node)
    }
  })

  return roots
}

export function CategoriesView() {
  const [rows, setRows] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('tree')
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

  const idToName = useMemo(() => {
    const map = new Map<number, string>()
    rows.forEach((row) => map.set(row.id, row.name))
    return map
  }, [rows])

  const treeRoots = useMemo(() => buildTree(rows), [rows])

  const createParentOptions = rows.map((row) => ({
    value: row.id,
    label: row.name,
  }))

  const editParentOptions = rows
    .filter((row) => row.id !== editing?.id)
    .map((row) => ({
      value: row.id,
      label: row.name,
    }))

  const columns: ColumnsType<Category> = [
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
      title: 'Parent',
      dataIndex: 'parent_id',
      render: (value: number | null) => (value ? idToName.get(value) ?? '-' : '-'),
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

  function renderTree(nodes: CategoryNode[], depth = 0): ReactNode[] {
    return nodes.flatMap((node) => {
      const content = (
        <Card
          key={node.id}
          size='small'
          style={{ marginLeft: depth * 20, marginBottom: 10 }}
          title={node.name}
        >
          <Typography.Paragraph style={{ marginBottom: 8 }}>
            {node.description || 'No description'}
          </Typography.Paragraph>
          {node.parent_id && (
            <Typography.Text type='secondary'>
              Parent: {idToName.get(node.parent_id) ?? '-'}
            </Typography.Text>
          )}
          <div style={{ marginTop: 10 }}>
            <Space>
              <Button icon={<EditOutlined />} size='small' onClick={() => openEdit(node)}>
                Edit
              </Button>
              <Popconfirm
                title='Delete this category?'
                onConfirm={() => void remove(node)}
                okText='Delete'
                okButtonProps={{ danger: true }}
              >
                <Button danger icon={<DeleteOutlined />} size='small' />
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
      )
      return [content]
    })
  }

  return (
    <div className='panel'>
      <div className='panel-head'>
        <div>
          <Typography.Title level={4}>Categories</Typography.Title>
          <Typography.Text type='secondary'>
            Create, update, and organize category hierarchy.
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
          <Button type='primary' icon={<PlusOutlined />} onClick={openCreate}>
            New Category
          </Button>
        </Space>
      </div>

      {viewMode === 'tree' ? (
        <div>{renderTree(treeRoots)}</div>
      ) : (
        <Table rowKey='id' loading={loading} columns={columns} dataSource={rows} />
      )}

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
          <Form.Item name='parentId' label='Parent'>
            <Select
              allowClear
              options={editing ? editParentOptions : createParentOptions}
              placeholder='No parent'
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
