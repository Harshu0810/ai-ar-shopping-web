import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { useAuth } from './hooks/useAuth'
import Home from './pages/Home'
import VirtualTryOn from './pages/VirtualTryOn'
import AIStylist from './pages/AIStylist'
import Login from './pages/Login'
import Register from './pages/Register'
import CartPage from './pages/Cart'
import Wishlist from './pages/Wishlist'
import Orders from './pages/Orders'
import ProductDetail from './pages/ProductDetail'
import Category from './pages/Category'
import Header from './components/Header'
import Footer from './components/Footer'
import NavigationBar from './components/NavigationBar'

// Protected Route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    )
  }
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <div className="flex flex-col min-h-screen bg-gray-50">
            <Header />
            <NavigationBar />
            <main className="flex-grow">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/product/:productId" element={<ProductDetail />} />
                <Route path="/category/:categoryName" element={<Category />} />
                
                {/* Protected Routes */}
                <Route 
                  path="/virtual-try-on" 
                  element={
                    <ProtectedRoute>
                      <VirtualTryOn />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/ai-stylist" 
                  element={
                    <ProtectedRoute>
                      <AIStylist />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/cart" 
                  element={
                    <ProtectedRoute>
                      <CartPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/wishlist" 
                  element={
                    <ProtectedRoute>
                      <Wishlist />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/orders" 
                  element={
                    <ProtectedRoute>
                      <Orders />
                    </ProtectedRoute>
                  } 
                />
                
                {/* 404 Route */}
                <Route 
                  path="*" 
                  element={
                    <div className="min-h-screen flex items-center justify-center bg-gray-50">
                      <div className="text-center">
                        <h1 className="text-8xl font-bold text-gray-300 mb-4">404</h1>
                        <p className="text-2xl text-gray-600 mb-8">Page not found</p>
                        <Link 
                          to="/" 
                          className="inline-block bg-primary text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition"
                        >
                          Go Home
                        </Link>
                      </div>
                    </div>
                  } 
                />
              </Routes>
            </main>
            <Footer />
          </div>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
