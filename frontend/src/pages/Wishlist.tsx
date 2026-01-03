// frontend/src/pages/ProductDetail.tsx
// ============================================================================

import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { productAPI, reviewAPI } from '../services/api'
import { useCart } from '../hooks/useCart'
import { Heart, ShoppingCart, Star } from 'lucide-react'
import { motion } from 'framer-motion'

interface Product {
  id: string
  name: string
  description: string
  price: number
  discount_price: number
  image_url: string
  rating: number
  reviews_count: number
  stock_quantity: number
}

interface Review {
  id: string
  rating: number
  comment: string
}

export default function ProductDetail() {
  const { productId } = useParams()
  const { addToCart } = useCart()
  const [product, setProduct] = useState<Product | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (productId) {
          const productRes = await productAPI.getById(productId)
          setProduct(productRes.data)
          const reviewsRes = await reviewAPI.getByProduct(productId)
          setReviews(reviewsRes.data)
        }
      } catch (error) {
        console.error('Failed to fetch product:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [productId])

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  if (!product) return <div className="min-h-screen flex items-center justify-center">Product not found</div>

  const discount = product.discount_price ? 
    Math.round(((product.price - product.discount_price) / product.price) * 100) : 0

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-light dark:bg-dark py-12 px-4"
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Product Image */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="bg-gray-200 rounded-lg overflow-hidden h-96">
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>

          {/* Product Details */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-4xl font-bold mb-2">{product.name}</h1>

            {/* Rating */}
            <div className="flex items-center mb-4">
              <div className="flex text-yellow-400">
                {Array(5).fill(0).map((_, i) => (
                  <Star key={i} className={`w-5 h-5 ${i < Math.round(product.rating) ? 'fill-current' : ''}`} />
                ))}
              </div>
              <span className="ml-2">({product.reviews_count} reviews)</span>
            </div>

            {/* Price */}
            <div className="mb-6">
              <div className="flex items-center gap-4">
                <span className="text-3xl font-bold text-primary">₹{product.discount_price || product.price}</span>
                {discount > 0 && (
                  <>
                    <span className="text-xl line-through text-gray-500">₹{product.price}</span>
                    <span className="text-lg font-semibold text-red-500">{discount}% OFF</span>
                  </>
                )}
              </div>
            </div>

            {/* Description */}
            <p className="text-gray-600 dark:text-gray-300 mb-6">{product.description}</p>

            {/* Stock Status */}
            <p className={`mb-6 font-semibold ${product.stock_quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : 'Out of stock'}
            </p>

            {/* Quantity Selector */}
            <div className="flex items-center gap-4 mb-6">
              <label className="font-semibold">Quantity:</label>
              <div className="flex items-center border rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-2 hover:bg-gray-100"
                >
                  −
                </button>
                <span className="px-4">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-4 py-2 hover:bg-gray-100"
                >
                  +
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => addToCart(product.id, quantity)}
                disabled={product.stock_quantity === 0}
                className="flex-1 bg-primary text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-5 h-5" />
                Add to Cart
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsWishlisted(!isWishlisted)}
                className="px-6 py-3 border border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition"
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
              </motion.button>
            </div>

            {/* Try On Button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="w-full mt-4 bg-secondary text-white py-3 rounded-lg font-semibold hover:bg-yellow-600 transition"
            >
              Try On Virtually
            </motion.button>
          </motion.div>
        </div>

        {/* Reviews Section */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-12">
          <h2 className="text-3xl font-bold mb-6">Customer Reviews</h2>
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  {Array(5).fill(0).map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                  ))}
                </div>
                <p className="text-gray-700 dark:text-gray-300">{review.comment}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
