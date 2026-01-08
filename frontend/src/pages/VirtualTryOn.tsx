import React, { useState, useRef, useEffect } from 'react'
import { tryOnAPI, productAPI } from '../services/api'
import { useAuth } from '../hooks/useAuth'
import { useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Upload, Loader, AlertCircle, CheckCircle, Sparkles } from 'lucide-react'

interface TryOnResult {
  success: boolean
  original_image: string
  product_image?: string
  generated_image: string
  product_name: string
  error?: string
}

interface Product {
  id: string
  name: string
  price: number
  image_url: string
}

export default function VirtualTryOn() {
  const { user } = useAuth()
  const location = useLocation()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [selectedProduct, setSelectedProduct] = useState<string>('')
  const [products, setProducts] = useState<Product[]>([])
  const [result, setResult] = useState<TryOnResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load products on mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await productAPI.getAll({ limit: 50 })
        const clothingProducts = response.data.filter((p: Product) => 
          p.category === 'clothing'
        )
        setProducts(clothingProducts)

        // Auto-select product if passed from product detail page
        const productId = location.state?.productId
        if (productId && clothingProducts.some((p: Product) => p.id === productId)) {
          setSelectedProduct(productId)
        }
      } catch (error) {
        console.error('Failed to fetch products:', error)
        setError('Failed to load products. Please refresh.')
      }
    }

    if (user) {
      fetchProducts()
    }
  }, [user, location.state])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file (JPG, PNG)')
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB')
        return
      }

      setSelectedFile(file)
      setError('')
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleGenerate = async () => {
    if (!selectedFile || !selectedProduct) {
      setError('Please select both an image and a product')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('user_image', selectedFile)
      formData.append('product_id', selectedProduct)

      console.log('Sending try-on request...')
      const response = await tryOnAPI.generate(formData)
      
      console.log('Try-on response:', response.data)

      if (response.data.success === false) {
        setError(response.data.error || 'Try-on generation failed')
      } else {
        setResult(response.data)
      }
    } catch (err: any) {
      console.error('Try-on generation error:', err)
      const errorMessage = err.response?.data?.detail || 
                          err.message || 
                          'Failed to generate try-on. Please try again.'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const selectedProductData = products.find(p => p.id === selectedProduct)

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-xl text-gray-600">Please log in to use Virtual Try-On</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center bg-primary/10 px-6 py-3 rounded-full mb-4"
          >
            <Sparkles className="w-5 h-5 text-primary mr-2" />
            <span className="font-semibold text-primary">AI-Powered Virtual Try-On</span>
          </motion.div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Try Before You Buy
          </h1>
          <p className="text-xl text-gray-600">
            Upload your photo and see how our products look on you
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-3xl mx-auto mb-8 bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg flex items-start"
          >
            <AlertCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {/* Left Panel - Upload & Select */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl shadow-lg p-8"
          >
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Step 1: Upload Your Photo</h2>

            {/* File Upload Area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-3 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
                previewUrl 
                  ? 'border-primary bg-primary/5' 
                  : 'border-gray-300 hover:border-primary hover:bg-gray-50'
              }`}
            >
              {previewUrl ? (
                <div className="space-y-4">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-h-64 mx-auto rounded-lg shadow-md"
                  />
                  <p className="text-sm text-gray-600">
                    Click to change photo
                  </p>
                </div>
              ) : (
                <div>
                  <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-semibold text-gray-700 mb-2">
                    Click to upload your photo
                  </p>
                  <p className="text-sm text-gray-500">
                    JPG or PNG • Max 5MB • Full body photos work best
                  </p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Product Selection */}
            <div className="mt-8">
              <h2 className="text-2xl font-bold mb-6 text-gray-900">
                Step 2: Select a Product
              </h2>
              
              {products.length > 0 ? (
                <div className="space-y-4">
                  <select
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                    className="w-full p-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-lg"
                  >
                    <option value="">Choose a clothing item...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} - ₹{p.price}
                      </option>
                    ))}
                  </select>

                  {/* Product Preview */}
                  {selectedProductData && (
                    <div className="bg-gray-50 p-4 rounded-lg flex items-center space-x-4">
                      <img
                        src={selectedProductData.image_url}
                        alt={selectedProductData.name}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <div>
                        <p className="font-semibold text-gray-900">
                          {selectedProductData.name}
                        </p>
                        <p className="text-primary font-bold">
                          ₹{selectedProductData.price}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Loader className="w-8 h-8 animate-spin mx-auto mb-2" />
                  <p>Loading products...</p>
                </div>
              )}
            </div>

            {/* Generate Button */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleGenerate}
              disabled={loading || !selectedFile || !selectedProduct}
              className="w-full mt-8 bg-gradient-to-r from-primary to-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:from-primary-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all shadow-lg flex items-center justify-center space-x-3"
            >
              {loading ? (
                <>
                  <Loader className="w-6 h-6 animate-spin" />
                  <span>Generating... This may take 30-60 seconds</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-6 h-6" />
                  <span>Generate Virtual Try-On</span>
                </>
              )}
            </motion.button>

            {loading && (
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800 flex items-center">
                  <Loader className="w-4 h-4 animate-spin mr-2" />
                  AI is processing your image... Please wait patiently.
                </p>
              </div>
            )}
          </motion.div>

          {/* Right Panel - Results */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl shadow-lg p-8"
          >
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Your Virtual Try-On Result</h2>

            {result ? (
              <div className="space-y-6">
                {result.success ? (
                  <>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                      <p className="text-green-800 font-semibold">
                        Try-on generated successfully!
                      </p>
                    </div>

                    {/* Generated Result */}
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2">
                        You wearing: {result.product_name}
                      </p>
                      <div className="relative rounded-lg overflow-hidden shadow-xl">
                        <img
                          src={result.generated_image}
                          alt="Try-on result"
                          className="w-full"
                          onError={(e) => {
                            console.error('Failed to load generated image')
                            e.currentTarget.src = result.original_image
                          }}
                        />
                        <div className="absolute top-4 right-4 bg-primary text-white px-3 py-1 rounded-full text-sm font-bold">
                          AI Generated
                        </div>
                      </div>
                    </div>

                    {/* Comparison */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-2">Original Photo</p>
                        <img
                          src={result.original_image}
                          alt="Original"
                          className="w-full rounded-lg"
                        />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-2">Product Image</p>
                        <img
                          src={selectedProductData?.image_url || result.product_image}
                          alt="Product"
                          className="w-full rounded-lg"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                    <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
                    <p className="text-yellow-800 font-semibold mb-2">
                      AI Service Temporarily Unavailable
                    </p>
                    <p className="text-sm text-yellow-700">
                      {result.error || 'Please try again in a few moments'}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-16">
                <div className="bg-gray-100 rounded-full p-8 mb-6">
                  <Sparkles className="w-16 h-16 text-gray-400" />
                </div>
                <p className="text-gray-500 text-lg">
                  Upload your photo and select a product to see the magic! ✨
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
