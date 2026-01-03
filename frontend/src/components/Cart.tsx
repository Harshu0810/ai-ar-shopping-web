// frontend/src/components/Cart.tsx
// ============================================================================

import React from 'react'
import { useCart } from '../hooks/useCart'
import { Trash2 } from 'lucide-react'
import { motion } from 'framer-motion'

export default function CartComponent() {
  const { items, removeFromCart, updateQuantity, getTotal } = useCart()

  if (items.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-500">Cart is empty</p>
      </div>
    )
  }

  return (
    <motion.div className="space-y-4">
      {items.map((item) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg"
        >
          <img
            src={item.products?.image_url}
            alt={item.products?.name}
            className="w-20 h-20 object-cover rounded"
          />
          <div className="flex-1">
            <h3 className="font-semibold">{item.products?.name}</h3>
            <p className="text-gray-600 dark:text-gray-300">₹{item.products?.price}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => updateQuantity(item.id, item.quantity - 1)}
              className="px-2 py-1 hover:bg-gray-100 rounded"
            >
              −
            </button>
            <span className="px-2">{item.quantity}</span>
            <button
              onClick={() => updateQuantity(item.id, item.quantity + 1)}
              className="px-2 py-1 hover:bg-gray-100 rounded"
            >
              +
            </button>
            <button
              onClick={() => removeFromCart(item.id)}
              className="text-red-500 hover:text-red-700 ml-2"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      ))}
      <div className="pt-4 border-t">
        <p className="text-lg font-semibold">Total: ₹{getTotal()}</p>
      </div>
    </motion.div>
  )
}
