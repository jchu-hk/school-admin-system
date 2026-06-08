import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Login from '../../pages/Login'
import axios from 'axios'

// Mock axios
const mockAxios = axios as jest.Mocked<typeof axios>

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

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAxios.post = vi.fn()
  })

  it('should render login form', () => {
    renderWithRouter(<Login />)
    
    expect(screen.getByText('智慧校园管理系统')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('admin')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('••••••')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /登录/i })).toBeInTheDocument()
  })

  it('should show validation error for empty username', async () => {
    renderWithRouter(<Login />)
    
    const submitButton = screen.getByRole('button', { name: /登录/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('请输入用户名')).toBeInTheDocument()
    })
  })

  it('should show validation error for short password', async () => {
    renderWithRouter(<Login />)
    
    const usernameInput = screen.getByPlaceholderText('admin')
    const passwordInput = screen.getByPlaceholderText('••••••')
    const submitButton = screen.getByRole('button', { name: /登录/i })
    
    fireEvent.change(usernameInput, { target: { value: 'testuser' } })
    fireEvent.change(passwordInput, { target: { value: '123' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('密码至少6位')).toBeInTheDocument()
    })
  })

  it('should toggle password visibility', () => {
    renderWithRouter(<Login />)
    
    const passwordInput = screen.getByPlaceholderText('••••••')
    expect(passwordInput).toHaveProperty('type', 'password')
    
    const toggleButton = screen.getByRole('button', { name: '' }) // Eye icon button
    fireEvent.click(toggleButton)
    
    expect(passwordInput).toHaveProperty('type', 'text')
  })

  it('should submit form with valid data', async () => {
    mockAxios.post.mockResolvedValueOnce({
      data: { access_token: 'mock_token' },
    })
    
    renderWithRouter(<Login />)
    
    const usernameInput = screen.getByPlaceholderText('admin')
    const passwordInput = screen.getByPlaceholderText('••••••')
    const submitButton = screen.getByRole('button', { name: /登录/i })
    
    fireEvent.change(usernameInput, { target: { value: 'admin' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockAxios.post).toHaveBeenCalledWith('/api/auth/login', {
        username: 'admin',
        password: 'password123',
      })
    })
  })

  it('should show error message on login failure', async () => {
    mockAxios.post.mockRejectedValueOnce(new Error('Invalid credentials'))
    
    renderWithRouter(<Login />)
    
    const usernameInput = screen.getByPlaceholderText('admin')
    const passwordInput = screen.getByPlaceholderText('••••••')
    const submitButton = screen.getByRole('button', { name: /登录/i })
    
    fireEvent.change(usernameInput, { target: { value: 'admin' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('用户名或密码错误')).toBeInTheDocument()
    })
  })
})
