import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { productAPI } from '../services/api'
import ProductCard from '../components/ProductCard'
import SkeletonLoader from '../components/SkeletonLoader'
import { motion } from 'framer-motion'

interface Product {
  id: string
  name: string
  price: number
  image_url: string
  rating: number
  reviews_count: number
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await productAPI.getAll({ limit: 12 })
        setProducts(response.data)
      } catch (error) {
        console.error('Failed to fetch products:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [])

  return (
    <div className="min-h-screen bg-light dark:bg-dark">
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-gradient-to-r from-primary to-secondary text-white py-20 px-4"
      >
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-4">AI Virtual Try-On</h1>
          <p className="text-xl mb-8">Try before you buy with our AI-powered virtual fitting room</p>
          <Link
            to="/virtual-try-on"
            className="bg-white text-primary px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
          >
            Try Now
          </Link>
        </div>
      </motion.section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold mb-8 text-dark dark:text-light">Featured Products</h2>
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array(8).fill(0).map((_, i) => <SkeletonLoader key={i} />)}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ staggerChildren: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </motion.div>
        )}
      </section>
    </div>
  )
}
