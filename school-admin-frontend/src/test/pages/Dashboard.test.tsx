import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Dashboard from '../../pages/Dashboard'
import axios from 'axios'

// Mock axios
const mockAxios = axios as jest.Mocked<typeof axios>

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage })

const renderWithRouter = (component: React.ReactNode) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('Dashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue('mock_token')
    mockAxios.get = vi.fn().mockResolvedValue({
      data: {
        requestId: 'req_123',
        success: true,
        data: {
          students: 256,
          teachers: 32,
          courses: 48,
          attendance: 95,
        },
      },
    })
  })

  it('should render dashboard title', () => {
    renderWithRouter(<Dashboard />)
    
    expect(screen.getByText('仪表盘')).toBeInTheDocument()
  })

  it('should render stat cards', () => {
    renderWithRouter(<Dashboard />)
    
    expect(screen.getByText('学生总数')).toBeInTheDocument()
    expect(screen.getByText('教师总数')).toBeInTheDocument()
    expect(screen.getByText('课程总数')).toBeInTheDocument()
    expect(screen.getByText('今日出勤率')).toBeInTheDocument()
  })

  it('should display loading state initially', () => {
    renderWithRouter(<Dashboard />)
    
    // 在数据加载前显示占位符
    const loadingIndicators = screen.getAllByText('—')
    expect(loadingIndicators.length).toBeGreaterThan(0)
  })

  it('should fetch and display stats', async () => {
    renderWithRouter(<Dashboard />)
    
    await waitFor(() => {
      expect(mockAxios.get).toHaveBeenCalled()
    })
  })

  it('should redirect to login when no token', () => {
    mockLocalStorage.getItem.mockReturnValue(null)
    
    const mockLocation = { href: '' }
    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true,
    })
    
    renderWithRouter(<Dashboard />)
    
    expect(mockLocation.href).toBe('/login')
  })
})
