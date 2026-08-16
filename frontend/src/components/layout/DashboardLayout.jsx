// src/components/layout/DashboardLayout.jsx
import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

export const DashboardLayout = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <div style={{ flex: 1, display: 'flex' }}>
        <Sidebar />
        <main style={{ flex: 1, backgroundColor: '#f8fafc' }} className="dark:bg-secondary-900/50 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}