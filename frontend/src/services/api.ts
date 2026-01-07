// frontend/src/services/api.ts
// ============================================================================

import axios, { AxiosError } from 'axios'
import { supabase } from './supabaseClient'

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor - Add JWT token from Supabase session
apiClient.interceptors.request.use(async (config) => {
  try {
    // Get current session from Supabase
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`
    }
  } catch (error) {
    console.error('Failed to get session:', error)
  }
  
  return config
}, (error) => {
  return Promise.reject(error)
})

// Response interceptor - Handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - redirect to login
      await supabase.auth.signOut()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ============================================================================
// API ENDPOINTS
// ============================================================================

// Product APIs
export const productAPI = {
  getAll: (params?: any) => apiClient.get('/products', { params }),
  getById: (id: string) => apiClient.get(`/products/${id}`),
  search: (query: string) => apiClient.get(`/products/search?q=${query}`),
  getByCategory: (category: string) => apiClient.get(`/products/category/${category}`)
}

// Auth APIs (Note: These use Supabase directly, not backend)
export const authAPI = {
  // Backend auth endpoints if you need them for profile management
  getProfile: () => apiClient.get('/auth/profile'),
  updateProfile: (data: any) => apiClient.patch('/auth/profile', data)
}

// Cart APIs (now secure - no user_id needed)
export const cartAPI = {
  get: () => apiClient.get('/cart'),
  add: (productId: string, quantity: number) =>
    apiClient.post('/cart/items', { product_id: productId, quantity }),
  update: (itemId: string, quantity: number) =>
    apiClient.put(`/cart/items/${itemId}`, { quantity }),
  remove: (itemId: string) => apiClient.delete(`/cart/items/${itemId}`)
}

// Order APIs
export const orderAPI = {
  create: (items: any[], paymentMethod: string, shippingAddress: string) =>
    apiClient.post('/orders', { items, payment_method: paymentMethod, shipping_address: shippingAddress }),
  getAll: () => apiClient.get('/orders'),
  getById: (id: string) => apiClient.get(`/orders/${id}`),
  updateStatus: (id: string, status: string) =>
    apiClient.patch(`/orders/${id}`, { status })
}

// Review APIs
export const reviewAPI = {
  create: (productId: string, rating: number, comment: string) =>
    apiClient.post('/reviews', { product_id: productId, rating, comment }),
  getByProduct: (productId: string) =>
    apiClient.get(`/reviews/product/${productId}`)
}

// Virtual Try-On APIs
export const tryOnAPI = {
  generate: (formData: FormData) => {
    // FormData already sets correct content-type with boundary
    return apiClient.post('/tryOn/generate', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  getHistory: () => apiClient.get('/tryOn/history')
}

// Wishlist APIs
export const wishlistAPI = {
  get: () => apiClient.get('/wishlist'),
  add: (productId: string) => apiClient.post('/wishlist', { product_id: productId }),
  remove: (productId: string) => apiClient.delete(`/wishlist/${productId}`)
}

// AI Stylist API
export const stylistAPI = {
  getSuggestions: (skinTone: string, occasion: string, preferences?: any) =>
    apiClient.post('/ai-stylist/suggestions', { skin_tone: skinTone, occasion, preferences })
}
