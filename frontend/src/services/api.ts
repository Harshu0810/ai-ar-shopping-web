import axios from 'axios'

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Product APIs
export const productAPI = {
  getAll: (params?: any) => apiClient.get('/products', { params }),
  getById: (id: string) => apiClient.get(`/products/${id}`),
  search: (query: string) => apiClient.get(`/products/search?q=${query}`),
  getByCategory: (category: string) => apiClient.get(`/products/category/${category}`)
}

// Auth APIs
export const authAPI = {
  login: (email: string, password: string) => 
    apiClient.post('/auth/login', { email, password }),
  register: (email: string, password: string, name: string) =>
    apiClient.post('/auth/register', { email, password, name }),
  logout: () => apiClient.post('/auth/logout')
}

// Cart APIs
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
  create: (items: any[], paymentMethod: string) =>
    apiClient.post('/orders', { items, payment_method: paymentMethod }),
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
  generate: (formData: FormData) =>
    apiClient.post('/tryOn/generate', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  getHistory: () => apiClient.get('/tryOn/history')
}

// Wishlist APIs
export const wishlistAPI = {
  get: () => apiClient.get('/wishlist'),
  add: (productId: string) => apiClient.post('/wishlist', { product_id: productId }),
  remove: (productId: string) => apiClient.delete(`/wishlist/${productId}`)
}
