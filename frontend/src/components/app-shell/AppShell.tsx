import { AppstoreOutlined, EnvironmentOutlined, TagsOutlined } from '@ant-design/icons'
import { Layout, Menu, Typography } from 'antd'
import { useMemo, useState } from 'react'

import { CategoriesView } from '../categories-view/CategoriesView'
import { InventoryView } from '../inventory-view/InventoryView'
import { LocationsView } from '../locations-view/LocationsView'

const { Header, Content } = Layout

type ViewKey = 'inventory' | 'locations' | 'categories'

export function AppShell() {
  const [activeView, setActiveView] = useState<ViewKey>('inventory')

  const content = useMemo(() => {
    if (activeView === 'locations') {
      return <LocationsView />
    }
    if (activeView === 'categories') {
      return <CategoriesView />
    }
    return <InventoryView />
  }, [activeView])

  return (
    <Layout className='app-layout'>
      <Header className='app-header'>
        <div className='title-wrap'>
          <Typography.Title level={3} className='title'>
            Inventory Manager
          </Typography.Title>
          <Typography.Text className='subtitle'>
            Readable, consistent inventory operations
          </Typography.Text>
        </div>
        <Menu
          theme='dark'
          mode='horizontal'
          selectedKeys={[activeView]}
          onClick={(e) => setActiveView(e.key as ViewKey)}
          items={[
            { key: 'inventory', icon: <AppstoreOutlined />, label: 'Inventory' },
            { key: 'locations', icon: <EnvironmentOutlined />, label: 'Locations' },
            { key: 'categories', icon: <TagsOutlined />, label: 'Categories' },
          ]}
        />
      </Header>
      <Content className='app-content'>{content}</Content>
    </Layout>
  )
}
