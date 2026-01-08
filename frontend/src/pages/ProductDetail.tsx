import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { productAPI, reviewAPI } from '../services/api'
import { useCart } from '../hooks/useCart'
import { useAuth } from '../hooks/useAuth'
import { Heart, ShoppingCart, Star, Sparkles, Loader } from 'lucide-react'
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
  category: string
}

interface Review {
  id: string
  rating: number
  comment: string
  created_at: string
}

export default function ProductDetail() {
  const { productId } = useParams()
  const { user } = useAuth()
  const { addToCart } = useCart()
  const navigate = useNavigate()
  
  const [product, setProduct] = useState<Product | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [addingToCart, setAddingToCart] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (productId) {
          const productRes = await productAPI.getById(productId)
          setProduct(productRes.data)
          
          try {
            const reviewsRes = await reviewAPI.getByProduct(productId)
            setReviews(reviewsRes.data || [])
          } catch (err) {
            console.log('No reviews found')
          }
        }
      } catch (error) {
        console.error('Failed to fetch product:', error)
        alert('Product not found')
        navigate('/')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [productId, navigate])

  const handleAddToCart = async () => {
    if (!user) {
      navigate('/login')
      return
    }

    setAddingToCart(true)
    try {
      await addToCart(product!.id, quantity)
      alert('Added to cart successfully!')
    } catch (error) {
      console.error('Failed to add to cart:', error)
      alert('Failed to add to cart. Please try again.')
    } finally {
      setAddingToCart(false)
    }
  }

  const handleTryOn = () => {
    if (!user) {
      alert('Please login to use Virtual Try-On')
      navigate('/login')
      return
    }
    
    // Navigate to try-on page with product info
    navigate('/virtual-try-on', { 
      state: { 
        productId: product?.id,
        productName: product?.name,
        productImage: product?.image_url
      } 
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Loading product...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Product not found</h2>
          <button
            onClick={() => navigate('/')}
            className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-700"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  const discount = product.discount_price ? 
    Math.round(((product.price - product.discount_price) / product.price) * 100) : 0
  
  const displayPrice = product.discount_price || product.price

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gray-50 py-12 px-4"
    >
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
            {/* Product Image */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }} 
              animate={{ opacity: 1, x: 0 }}
              className="relative"
            >
              <div className="bg-gray-100 rounded-lg overflow-hidden aspect-square">
                {!imageError ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                    <div className="text-center">
                      <ShoppingCart className="w-24 h-24 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-500">Image not available</p>
                    </div>
                  </div>
                )}
              </div>
              
              {discount > 0 && (
                <div className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-full text-lg font-bold shadow-lg">
                  {discount}% OFF
                </div>
              )}
            </motion.div>

            {/* Product Details */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col"
            >
              <h1 className="text-4xl font-bold mb-4 text-gray-900">{product.name}</h1>

              {/* Category */}
              <span className="inline-block bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-medium mb-4 w-fit capitalize">
                {product.category}
              </span>

              {/* Rating */}
              <div className="flex items-center mb-6">
                <div className="flex text-yellow-400">
                  {Array(5).fill(0).map((_, i) => (
                    <Star 
                      key={i} 
                      className={`w-6 h-6 ${i < Math.round(product.rating) ? 'fill-current' : ''}`}
                    />
                  ))}
                </div>
                <span className="ml-3 text-gray-700 font-medium">
                  {product.rating.toFixed(1)} ({product.reviews_count} reviews)
                </span>
              </div>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline gap-4">
                  <span className="text-4xl font-bold text-primary">
                    ₹{displayPrice}
                  </span>
                  {discount > 0 && (
                    <>
                      <span className="text-2xl line-through text-gray-500">
                        ₹{product.price}
                      </span>
                      <span className="text-xl font-semibold text-red-600">
                        Save ₹{product.price - displayPrice}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Description */}
              <p className="text-gray-700 mb-6 text-lg leading-relaxed">
                {product.description}
              </p>

              {/* Stock Status */}
              <p className={`mb-6 font-semibold text-lg ${product.stock_quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {product.stock_quantity > 0 
                  ? `✓ In Stock (${product.stock_quantity} available)` 
                  : '✗ Out of Stock'}
              </p>

              {/* Quantity Selector */}
              <div className="flex items-center gap-6 mb-6">
                <label className="font-semibold text-gray-900 text-lg">Quantity:</label>
                <div className="flex items-center border-2 border-gray-300 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-5 py-3 hover:bg-gray-100 text-xl font-bold transition"
                  >
                    −
                  </button>
                  <span className="px-6 py-3 font-semibold text-lg border-x-2 border-gray-300 min-w-[60px] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                    className="px-5 py-3 hover:bg-gray-100 text-xl font-bold transition"
                    disabled={quantity >= product.stock_quantity}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-4">
                <div className="flex gap-4">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleAddToCart}
                    disabled={addingToCart || product.stock_quantity === 0}
                    className="flex-1 bg-primary text-white py-4 rounded-lg font-semibold text-lg hover:bg-primary-700 disabled:bg-gray-400 transition flex items-center justify-center gap-3 shadow-lg"
                  >
                    {addingToCart ? (
                      <>
                        <Loader className="w-6 h-6 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-6 h-6" />
                        Add to Cart
                      </>
                    )}
                  </motion.button>
                  
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsWishlisted(!isWishlisted)}
                    className="px-6 py-4 border-2 border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition shadow-lg"
                  >
                    <Heart className={`w-6 h-6 ${isWishlisted ? 'fill-current' : ''}`} />
                  </motion.button>
                </div>

                {/* Try On Button */}
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleTryOn}
                  className="w-full bg-gradient-to-r from-secondary to-yellow-500 text-white py-4 rounded-lg font-semibold text-lg hover:from-secondary-600 hover:to-yellow-600 transition flex items-center justify-center gap-3 shadow-lg"
                >
                  <Sparkles className="w-6 h-6" />
                  Try On Virtually
                </motion.button>
              </div>
            </motion.div>
          </div>

          {/* Reviews Section */}
          <div className="border-t border-gray-200 p-8 bg-gray-50">
            <h2 className="text-3xl font-bold mb-6 text-gray-900">Customer Reviews</h2>
            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center mb-3">
                      {Array(5).fill(0).map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-5 h-5 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                        />
                      ))}
                      <span className="ml-3 text-sm text-gray-500">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No reviews yet. Be the first to review!</p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
