import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Layout from '../../components/Layout'

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const renderWithRouter = (component: React.ReactNode) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('Layout Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.getItem = vi.fn().mockReturnValue('mock_token')
    localStorage.removeItem = vi.fn()
  })

  it('should render navigation items', () => {
    renderWithRouter(<Layout />)
    
    expect(screen.getByText('仪表盘')).toBeInTheDocument()
    expect(screen.getByText('学生管理')).toBeInTheDocument()
    expect(screen.getByText('课程管理')).toBeInTheDocument()
    expect(screen.getByText('系统设置')).toBeInTheDocument()
  })

  it('should render logout button', () => {
    renderWithRouter(<Layout />)
    
    expect(screen.getByText('退出登录')).toBeInTheDocument()
  })

  it('should call navigate when nav item is clicked', () => {
    renderWithRouter(<Layout />)
    
    const dashboardButton = screen.getByText('仪表盘')
    fireEvent.click(dashboardButton)
    
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
  })

  it('should handle logout', () => {
    renderWithRouter(<Layout />)
    
    const logoutButton = screen.getByText('退出登录')
    fireEvent.click(logoutButton)
    
    expect(localStorage.removeItem).toHaveBeenCalledWith('token')
    expect(mockNavigate).toHaveBeenCalledWith('/login')
  })

  it('should redirect to login when no token', () => {
    localStorage.getItem = vi.fn().mockReturnValue(null)
    
    // Mock window.location
    const originalLocation = window.location
    const mockLocation = { href: '' }
    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true,
    })
    
    renderWithRouter(<Layout />)
    
    expect(mockLocation.href).toBe('/login')
    
    // Restore
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
    })
  })
})
