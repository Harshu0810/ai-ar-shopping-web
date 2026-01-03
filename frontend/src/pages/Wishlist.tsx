// frontend/src/pages/Wishlist.tsx
// ============================================================================

import React, { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { wishlistAPI } from '../services/api'
import ProductCard from '../components/ProductCard'
import { Heart } from 'lucide-react'
import { motion } from 'framer-motion'

interface WishlistItem {
  id: string
  product_id: string
  products: {
    id: string
    name: string
    price: number
    image_url: string
    rating: number
    reviews_count: number
  }
}

export default function Wishlist() {
  const { user } = useAuth()
  const [items, setItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const fetchWishlist = async () => {
      try {
        const response = await wishlistAPI.get()
        setItems(response.data)
      } catch (error) {
        console.error('Failed to fetch wishlist:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchWishlist()
  }, [user])

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">Please log in to view wishlist</p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-light dark:bg-dark py-12 px-4"
    >
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-dark dark:text-light">My Wishlist</h1>

        {loading ? (
          <p className="text-center text-gray-500">Loading...</p>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-xl text-gray-500">Your wishlist is empty</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {items.map((item) => (
              <ProductCard key={item.id} product={item.products} />
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
