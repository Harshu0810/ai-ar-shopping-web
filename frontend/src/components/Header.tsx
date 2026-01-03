// frontend/src/components/Header.tsx (CONTINUED)
// ============================================================================

import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, Heart, User, LogOut, Menu, X } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useCart } from '../hooks/useCart'

export default function Header() {
  const { user, logout } = useAuth()
  const { items } = useCart()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <header className="bg-white dark:bg-gray-800 shadow sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="text-2xl font-bold text-primary">
            ShopAI
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-gray-600 hover:text-primary transition">
              Home
            </Link>
            <Link to="/virtual-try-on" className="text-gray-600 hover:text-primary transition">
              Try-On
            </Link>
            <Link to="/ai-stylist" className="text-gray-600 hover:text-primary transition">
              Stylist
            </Link>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center space-x-4">
            <Link to="/wishlist" className="relative p-2 text-gray-600 hover:text-primary">
              <Heart className="w-6 h-6" />
            </Link>
            <Link to="/cart" className="relative p-2 text-gray-600 hover:text-primary">
              <ShoppingCart className="w-6 h-6" />
              {items.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {items.length}
                </span>
              )}
            </Link>

            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">{user.email}</span>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-600 hover:text-red-600 transition"
                  title="Logout"
                >
                  <LogOut className="w-6 h-6" />
                </button>
              </div>
            ) : (
              <Link to="/login" className="p-2 text-gray-600 hover:text-primary">
                <User className="w-6 h-6" />
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <nav className="md:hidden mt-4 space-y-2">
            <Link
              to="/"
              className="block py-2 text-gray-600 hover:text-primary transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/virtual-try-on"
              className="block py-2 text-gray-600 hover:text-primary transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              Try-On
            </Link>
            <Link
              to="/ai-stylist"
              className="block py-2 text-gray-600 hover:text-primary transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              Stylist
            </Link>
          </nav>
        )}
      </div>
    </header>
  )
}
