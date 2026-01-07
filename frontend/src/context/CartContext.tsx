// frontend/src/context/CartContext.tsx
// ============================================================================

import React, { createContext, useState, ReactNode } from 'react'
import { cartAPI } from '../services/api'
import { useAuth } from '../hooks/useAuth'

interface CartItem {
  id: string
  product_id: string
  quantity: number
  products?: {
    name: string
    price: number
    image_url: string
  }
}

interface CartContextType {
  items: CartItem[]
  addToCart: (productId: string, quantity: number) => Promise<void>
  removeFromCart: (itemId: string) => Promise<void>
  updateQuantity: (itemId: string, quantity: number) => Promise<void>
  clearCart: () => void
  getTotal: () => number
}

export const CartContext = createContext<CartContextType | undefined>(undefined)

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([])
  const { user } = useAuth()

  const addToCart = async (productId: string, quantity: number) => {
    try {
      const response = await cartAPI.add(productId, quantity)
      setItems([...items, response.data])
    } catch (error) {
      console.error('Failed to add to cart:', error)
    }
  }

  const removeFromCart = async (itemId: string) => {
    try {
      await cartAPI.remove(itemId)
      setItems(items.filter(item => item.id !== itemId))
    } catch (error) {
      console.error('Failed to remove from cart:', error)
    }
  }

  const updateQuantity = async (itemId: string, quantity: number) => {
    try {
      await cartAPI.update(itemId, quantity)
      setItems(items.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      ))
    } catch (error) {
      console.error('Failed to update quantity:', error)
    }
  }

  const clearCart = () => {
    setItems([])
  }

  const getTotal = () => {
    return items.reduce((sum, item) => {
      const price = item.products?.price || 0
      return sum + (price * item.quantity)
    }, 0)
  }
  useEffect(() => {
  const loadCart = async () => {
    if (user) {
      try {
        const response = await cartAPI.get()
        setItems(response.data)
      } catch (error) {
        console.error('Failed to load cart:', error)
      }
    }
  }
  loadCart()
  }, [user])
  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, getTotal }}>
      {children}
    </CartContext.Provider>
  )
}
