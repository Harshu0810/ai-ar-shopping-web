// frontend/src/components/NavigationBar.tsx
// ============================================================================

import React from 'react'
import { Link } from 'react-router-dom'
import { Home, ShoppingBag, Sparkles, Heart, Package } from 'lucide-react'

const categories = ['Clothing', 'Accessories', 'Footwear', 'Jewelry']

export default function NavigationBar() {
  return (
    <nav className="bg-white dark:bg-gray-800 border-b">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center space-x-8 overflow-x-auto">
          <Link to="/" className="flex items-center space-x-1 text-gray-600 hover:text-primary transition">
            <Home className="w-5 h-5" />
            <span>Home</span>
          </Link>

          {categories.map((category) => (
            <Link
              key={category}
              to={`/category/${category.toLowerCase()}`}
              className="text-gray-600 hover:text-primary transition whitespace-nowrap"
            >
              {category}
            </Link>
          ))}

          <Link to="/orders" className="flex items-center space-x-1 text-gray-600 hover:text-primary transition">
            <Package className="w-5 h-5" />
            <span>Orders</span>
          </Link>
        </div>
      </div>
    </nav>
  )
}
