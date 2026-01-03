// frontend/src/pages/Orders.tsx
// ============================================================================

import React, { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { orderAPI } from '../services/api'
import { Package, Calendar, DollarSign } from 'lucide-react'
import { motion } from 'framer-motion'

interface Order {
  id: string
  total_amount: number
  order_status: string
  created_at: string
  shipping_address: string
}

export default function Orders() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const fetchOrders = async () => {
      try {
        const response = await orderAPI.getAll()
        setOrders(response.data)
      } catch (error) {
        console.error('Failed to fetch orders:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchOrders()
  }, [user])

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">Please log in to view orders</p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-light dark:bg-dark py-12 px-4"
    >
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-dark dark:text-light">My Orders</h1>

        {loading ? (
          <p className="text-center text-gray-500">Loading orders...</p>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-xl text-gray-500">No orders yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Order ID</p>
                    <p className="font-semibold">{order.id.slice(0, 8)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 flex items-center">
                      <Calendar className="w-4 h-4 mr-1" /> Date
                    </p>
                    <p className="font-semibold">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 flex items-center">
                      <DollarSign className="w-4 h-4 mr-1" /> Amount
                    </p>
                    <p className="font-semibold">₹{order.total_amount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      order.order_status === 'delivered'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.order_status.charAt(0).toUpperCase() + order.order_status.slice(1)}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
