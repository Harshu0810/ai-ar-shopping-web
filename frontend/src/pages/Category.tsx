// frontend/src/pages/Category.tsx
// ============================================================================

import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
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

export default function Category() {
  const { categoryName } = useParams()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        if (categoryName) {
          const response = await productAPI.getByCategory(categoryName)
          setProducts(response.data)
        }
      } catch (error) {
        console.error('Failed to fetch products:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [categoryName])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-light dark:bg-dark py-12 px-4"
    >
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 capitalize text-dark dark:text-light">
          {categoryName} Products
        </h1>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array(8).fill(0).map((_, i) => <SkeletonLoader key={i} />)}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
