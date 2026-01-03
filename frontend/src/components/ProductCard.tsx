import React from 'react'
import { Link } from 'react-router-dom'
import { Heart, ShoppingCart } from 'lucide-react'
import { motion } from 'framer-motion'

interface Product {
  id: string
  name: string
  price: number
  image_url: string
  rating: number
  reviews_count: number
}

export default function ProductCard({ product }: { product: Product }) {
  const [isWishlisted, setIsWishlisted] = React.useState(false)

  return (
    <motion.div
      whileHover={{ y: -8 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-xl transition"
    >
      <Link to={`/product/${product.id}`} className="block relative overflow-hidden bg-gray-200 h-64">
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-cover hover:scale-110 transition duration-300"
        />
      </Link>

      <div className="p-4">
        <Link to={`/product/${product.id}`} className="text-gray-900 dark:text-white font-semibold hover:text-primary line-clamp-2">
          {product.name}
        </Link>

        <div className="flex items-center mt-2 mb-3">
          <div className="flex text-yellow-400">
            {Array(5).fill(0).map((_, i) => (
              <span key={i} className={i < Math.round(product.rating) ? '★' : '☆'}>
                ★
              </span>
            ))}
          </div>
          <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
            ({product.reviews_count})
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-dark dark:text-light">
            ₹{product.price}
          </span>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsWishlisted(!isWishlisted)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Heart
              className={`w-6 h-6 ${
                isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400'
              }`}
            />
          </motion.button>
        </div>

        <motion.button
          whileTap={{ scale: 0.95 }}
          className="w-full mt-4 bg-primary text-white py-2 rounded-lg hover:bg-blue-700 transition flex items-center justify-center"
        >
          <ShoppingCart className="w-5 h-5 mr-2" />
          Add to Cart
        </motion.button>
      </div>
    </motion.div>
  )
}
