// frontend/src/components/ProductGrid.tsx
// ============================================================================

import React, { useState, useEffect } from 'react'
import { productAPI } from '../services/api'
import ProductCard from './ProductCard'
import SkeletonLoader from './SkeletonLoader'
import { motion } from 'framer-motion'

interface Product {
  id: string
  name: string
  price: number
  image_url: string
  rating: number
  reviews_count: number
}

interface ProductGridProps {
  limit?: number
  category?: string
}

export default function ProductGrid({ limit = 12, category }: ProductGridProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        let response
        if (category) {
          response = await productAPI.getByCategory(category)
        } else {
          response = await productAPI.getAll({ limit })
        }
        setProducts(response.data)
      } catch (error) {
        console.error('Failed to fetch products:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [limit, category])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array(limit).fill(0).map((_, i) => <SkeletonLoader key={i} />)}
      </div>
    )
  }

  return (
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
  )
}
