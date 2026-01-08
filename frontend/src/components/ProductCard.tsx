import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Heart, ShoppingCart, Star } from 'lucide-react'
import { motion } from 'framer-motion'
import { useCart } from '../hooks/useCart'
import { useAuth } from '../hooks/useAuth'

interface Product {
  id: string
  name: string
  price: number
  discount_price?: number
  image_url: string
  rating: number
  reviews_count: number
}

export default function ProductCard({ product }: { product: Product }) {
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [loading, setLoading] = useState(false)
  const { addToCart } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!user) {
      navigate('/login')
      return
    }

    setLoading(true)
    try {
      await addToCart(product.id, 1)
      // Show success message
      alert('Added to cart!')
    } catch (error) {
      console.error('Failed to add to cart:', error)
      alert('Failed to add to cart. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleImageError = () => {
    setImageError(true)
  }

  const displayPrice = product.discount_price || product.price
  const hasDiscount = product.discount_price && product.discount_price < product.price

  return (
    <motion.div
      whileHover={{ y: -8 }}
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-2xl transition-all duration-300 border border-gray-200"
    >
      <Link to={`/product/${product.id}`} className="block relative overflow-hidden bg-gray-100 h-72">
        {!imageError ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover hover:scale-110 transition duration-300"
            onError={handleImageError}
            loading="lazy"
          />
        ) : (
          // Fallback placeholder
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
            <div className="text-center">
              <ShoppingCart className="w-16 h-16 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-500 text-sm">Image not available</p>
            </div>
          </div>
        )}
        
        {hasDiscount && (
          <div className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
            {Math.round(((product.price - product.discount_price!) / product.price) * 100)}% OFF
          </div>
        )}
      </Link>

      <div className="p-4">
        <Link 
          to={`/product/${product.id}`} 
          className="text-gray-900 font-semibold text-lg hover:text-primary line-clamp-2 mb-2 block min-h-[3.5rem]"
        >
          {product.name}
        </Link>

        {/* Rating */}
        <div className="flex items-center mt-2 mb-3">
          <div className="flex text-yellow-400">
            {Array(5).fill(0).map((_, i) => (
              <Star 
                key={i} 
                className={`w-4 h-4 ${i < Math.round(product.rating) ? 'fill-current' : ''}`}
              />
            ))}
          </div>
          <span className="text-sm text-gray-600 ml-2">
            ({product.reviews_count || 0})
          </span>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-2xl font-bold text-gray-900">
              ₹{displayPrice}
            </span>
            {hasDiscount && (
              <span className="text-sm line-through text-gray-500 ml-2">
                ₹{product.price}
              </span>
            )}
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setIsWishlisted(!isWishlisted)
            }}
            className="p-2 rounded-full hover:bg-gray-100 transition"
          >
            <Heart
              className={`w-6 h-6 ${
                isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400'
              }`}
            />
          </motion.button>
        </div>

        {/* Add to Cart Button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleAddToCart}
          disabled={loading}
          className="w-full bg-primary text-white py-3 rounded-lg hover:bg-primary-700 transition flex items-center justify-center font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Adding...
            </>
          ) : (
            <>
              <ShoppingCart className="w-5 h-5 mr-2" />
              Add to Cart
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  )
}
