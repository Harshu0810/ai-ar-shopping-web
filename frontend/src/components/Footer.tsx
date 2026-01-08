// frontend/src/components/Footer.tsx
// ============================================================================

import React from 'react'
import { Link } from 'react-router-dom'
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-2xl font-bold mb-4 text-primary">ShopAI</h3>
            <p className="text-gray-400 mb-4">
              Experience the future of online shopping with AI-powered virtual try-on
            </p>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-primary transition">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-primary transition">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-primary transition">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-400 hover:text-white transition">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/virtual-try-on" className="text-gray-400 hover:text-white transition">
                  Virtual Try-On
                </Link>
              </li>
              <li>
                <Link to="/ai-stylist" className="text-gray-400 hover:text-white transition">
                  AI Stylist
                </Link>
              </li>
              <li>
                <Link to="/orders" className="text-gray-400 hover:text-white transition">
                  My Orders
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Categories</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/category/clothing" className="text-gray-400 hover:text-white transition">
                  Clothing
                </Link>
              </li>
              <li>
                <Link to="/category/accessories" className="text-gray-400 hover:text-white transition">
                  Accessories
                </Link>
              </li>
              <li>
                <Link to="/category/footwear" className="text-gray-400 hover:text-white transition">
                  Footwear
                </Link>
              </li>
              <li>
                <Link to="/category/jewelry" className="text-gray-400 hover:text-white transition">
                  Jewelry
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-start">
                <MapPin className="w-5 h-5 mr-2 mt-1 flex-shrink-0" />
                <span className="text-gray-400">
                  123 Shopping Street, Fashion District, NY 10001
                </span>
              </li>
              <li className="flex items-center">
                <Phone className="w-5 h-5 mr-2 flex-shrink-0" />
                <a href="tel:+1234567890" className="text-gray-400 hover:text-white transition">
                  +1 (234) 567-890
                </a>
              </li>
              <li className="flex items-center">
                <Mail className="w-5 h-5 mr-2 flex-shrink-0" />
                <a href="mailto:support@shopai.com" className="text-gray-400 hover:text-white transition">
                  support@shopai.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} ShopAI. All rights reserved.</p>
          <div className="mt-2 space-x-4">
            <Link to="/privacy" className="hover:text-white transition text-sm">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-white transition text-sm">
              Terms of Service
            </Link>
            <Link to="/refund" className="hover:text-white transition text-sm">
              Refund Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
