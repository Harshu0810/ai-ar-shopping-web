// frontend/src/pages/VirtualTryOn.tsx
// COMPLETELY FIXED VERSION
// ============================================================================

import React, { useState, useRef, useEffect } from 'react'
import { productAPI } from '../services/api'
import { useAuth } from '../hooks/useAuth'
import { useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Upload, Loader, AlertCircle, CheckCircle, Sparkles } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

// --- CONFIGURATION (using environment variables) ---
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const AI_BACKEND_URL = import.meta.env.VITE_AI_BACKEND_URL || 'http://localhost:3000'

// Validate environment variables
if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration. Please check your .env file.')
}

const supabase = createClient(supabaseUrl!, supabaseKey!)

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
  category: string 
}

export default function VirtualTryOn() {
  const { user } = useAuth()
  const location = useLocation()
  
  // State
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [selectedProduct, setSelectedProduct] = useState<string>('')
  const [products, setProducts] = useState<Product[]>([])
  const [result, setResult] = useState<TryOnResult | null>(null)
  
  // Loading & Progress State
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState<string>('')
  const [error, setError] = useState<string>('')
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load products on mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await productAPI.getAll({ limit: 50 })
        const clothingProducts = response.data.filter((p: Product) => 
          p.category?.toLowerCase() === 'clothing'
        )
        setProducts(clothingProducts)
        
        // Check if product was pre-selected from ProductDetail page
        if (location.state?.productId) {
          setSelectedProduct(location.state.productId)
        }
      } catch (error) {
        console.error('Failed to fetch products:', error)
        setError('Failed to load products. Please refresh the page.')
      }
    }
    fetchProducts()
  }, [location.state])

  // Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB')
        return
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file')
        return
      }
      
      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      setResult(null)
      setError('')
    }
  }

  // Main Generate Function
  const handleGenerate = async () => {
    if (!selectedFile || !selectedProduct) {
      setError('Please upload a photo and select a product')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      // STEP A: Upload User Image to Supabase Storage
      setLoadingStep('Uploading your photo...')
      
      const timestamp = Date.now()
      const sanitizedName = selectedFile.name.replace(/[^a-zA-Z0-9.]/g, '')
      const fileName = `user_${user?.id}_${timestamp}_${sanitizedName}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('try-on-results')
        .upload(fileName, selectedFile, {
          contentType: selectedFile.type,
          upsert: false
        })

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`)
      }

      // Get the public URL
      const { data: publicUrlData } = supabase.storage
        .from('try-on-results')
        .getPublicUrl(fileName)
        
      const userImageUrl = publicUrlData.publicUrl
      console.log('User Image URL:', userImageUrl)

      // STEP B: Get Product Image URL
      const product = products.find(p => p.id === selectedProduct)
      if (!product) {
        throw new Error('Product not found')
      }
      const garmentUrl = product.image_url

      // STEP C: Call AI Backend
      setLoadingStep('AI is generating your try-on (30-60 seconds)...')
      
      const aiResponse = await fetch(`${AI_BACKEND_URL}/generate-tryon`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          personUrl: userImageUrl,
          garmentUrl: garmentUrl
        })
      })

      if (!aiResponse.ok) {
        throw new Error(`AI service error: ${aiResponse.statusText}`)
      }

      const aiData = await aiResponse.json()

      if (!aiData.success) {
        throw new Error(aiData.error || 'AI generation failed')
      }

      // STEP D: Display Result
      setResult({
        success: true,
        original_image: userImageUrl,
        product_image: garmentUrl,
        generated_image: aiData.url,
        product_name: product.name
      })

    } catch (err: any) {
      console.error('Try-on failed:', err)
      setError(err.message || 'Failed to generate try-on. Please try again.')
    } finally {
      setLoading(false)
      setLoadingStep('')
    }
  }

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Virtual Try-On Room
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            See how it fits before you buy. Powered by AI.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Controls */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            {/* Step 1: Upload Photo */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
              <h2 className="text-xl font-bold mb-4 flex items-center text-gray-800 dark:text-white">
                <span className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">1</span>
                Upload Your Photo
              </h2>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-primary transition group"
              >
                {previewUrl ? (
                  <div className="relative h-64 w-full">
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="h-full w-full object-contain rounded-lg"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                      <p className="text-white font-medium">Click to change photo</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                      <Upload className="w-8 h-8 text-primary" />
                    </div>
                    <p className="text-gray-500">Click to upload or drag and drop</p>
                    <p className="text-xs text-gray-400">Supported: JPG, PNG (Max 5MB)</p>
                  </div>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden" 
                />
              </div>
            </div>

            {/* Step 2: Select Product */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
              <h2 className="text-xl font-bold mb-4 flex items-center text-gray-800 dark:text-white">
                <span className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">2</span>
                Select Product
              </h2>
              
              {products.length > 0 ? (
                <div className="grid grid-cols-3 gap-4 max-h-64 overflow-y-auto pr-2">
                  {products.map((product) => (
                    <div 
                      key={product.id}
                      onClick={() => {
                        setSelectedProduct(product.id)
                        setError('')
                      }}
                      className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition ${
                        selectedProduct === product.id 
                          ? 'border-primary ring-2 ring-primary ring-opacity-50' 
                          : 'border-transparent hover:border-gray-300'
                      }`}
                    >
                      <img 
                        src={product.image_url} 
                        alt={product.name} 
                        className="w-full h-24 object-cover"
                      />
                      {selectedProduct === product.id && (
                        <div className="absolute top-1 right-1 bg-primary text-white rounded-full p-1">
                          <CheckCircle className="w-3 h-3" />
                        </div>
                      )}
                      <p className="text-xs p-1 text-center truncate text-gray-700 dark:text-gray-300">
                        {product.name}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">Loading clothing products...</p>
              )}
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Action Button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleGenerate}
              disabled={loading || !selectedFile || !selectedProduct}
              className="w-full bg-gradient-to-r from-primary to-blue-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader className="w-6 h-6 animate-spin mr-2" />
                  {loadingStep}
                </>
              ) : (
                <>
                  <Sparkles className="w-6 h-6 mr-2" />
                  Generate Try-On
                </>
              )}
            </motion.button>
          </motion.div>

          {/* Right Column: Results */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl min-h-[600px] flex flex-col"
          >
            <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white border-b pb-4">
              Result Preview
            </h2>

            {result ? (
              <div className="flex-1 flex flex-col">
                <div className="relative flex-1 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden mb-6">
                  <img 
                    src={result.generated_image} 
                    alt="Virtual Try-On Result" 
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute bottom-4 right-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur px-4 py-2 rounded-full shadow-sm">
                    <p className="text-sm font-semibold text-gray-800 dark:text-white">
                      Wearing: {result.product_name}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Original</p>
                    <img 
                      src={result.original_image} 
                      alt="Original" 
                      className="w-full h-24 object-cover rounded"
                    />
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Product</p>
                    <img 
                      src={selectedProductData?.image_url || result.product_image} 
                      alt="Product" 
                      className="w-full h-24 object-contain rounded bg-white dark:bg-gray-600"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-16">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-8 mb-6">
                  <Sparkles className="w-16 h-16 text-gray-400" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-lg">
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
