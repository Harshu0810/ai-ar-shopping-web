import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { cartAPI } from '../services/api'
import { useAuth } from '../hooks/useAuth'
import { Trash2, ShoppingBag } from 'lucide-react'
import { motion } from 'framer-motion'

export default function CartPage() {
  const { user } = useAuth()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const fetchCart = async () => {
      try {
        const response = await cartAPI.get()
        setItems(response.data)
      } catch (error) {
        console.error('Failed to fetch cart:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchCart()
  }, [user])

  const handleRemove = async (itemId: string) => {
    await cartAPI.remove(itemId)
    setItems(items.filter(i => i.id !== itemId))
  }

  const total = items.reduce((sum, item) => sum + (item.products.price * item.quantity), 0)

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Link to="/login" className="text-primary hover:underline">
          Please log in to view your cart
        </Link>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen flex flex-col items-center justify-center"
      >
        <ShoppingBag className="w-16 h-16 text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
        <Link to="/" className="text-primary hover:underline">
          Continue shopping
        </Link>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-light dark:bg-dark py-12 px-4"
    >
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-12">Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white dark:bg-gray-800 p-4 rounded-lg flex gap-4"
                >
                  <img
                    src={item.products.image_url}
                    alt={item.products.name}
                    className="w-24 h-24 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{item.products.name}</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      ₹{item.products.price} × {item.quantity}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemove(item.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-6 h-6" />
                  </button>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg h-fit"
          >
            <h2 className="text-2xl font-bold mb-4">Order Summary</h2>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping:</span>
                <span>₹50</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>₹{(total + 50).toFixed(2)}</span>
              </div>
            </div>
            <button className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition">
              Proceed to Checkout
            </button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
