import React from 'react'
import { Link } from 'react-router-dom'
import { Facebook, Twitter, Instagram, Mail } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-dark text-light py-12 px-4 mt-20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        <div>
          <h3 className="text-xl font-bold mb-4">ShopAI</h3>
          <p className="text-gray-400">
            AI-powered virtual try-on shopping experience
          </p>
        </div>

        <div>
          <h4 className="font-semibold mb-4">Quick Links</h4>
          <ul className="space-y-2 text-gray-400">
            <li><Link to="/" className="hover:text-primary">Home</Link></li>
            <li><Link to="/virtual-try-on" className="hover:text-primary">Try-On</Link></li>
            <li><Link to="/orders" className="hover:text-primary">Orders</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-4">Help</h4>
          <ul className="space-y-2 text-gray-400">
            <li><a href="#" className="hover:text-primary">Contact Us</a></li>
            <li><a href="#" className="hover:text-primary">FAQ</a></li>
            <li><a href="#" className="hover:text-primary">Shipping Info</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-4">Follow Us</h4>
          <div className="flex space-x-4">
            <Facebook className="w-6 h-6 hover:text-primary cursor-pointer" />
            <Twitter className="w-6 h-6 hover:text-primary cursor-pointer" />
            <Instagram className="w-6 h-6 hover:text-primary cursor-pointer" />
            <Mail className="w-6 h-6 hover:text-primary cursor-pointer" />
          </div>
        </div>
      </div>

      <div className="border-t border-gray-700 pt-8 text-center text-gray-400">
        <p>&copy; 2024 ShopAI. All rights reserved.</p>
      </div>
    </footer>
  )
}
