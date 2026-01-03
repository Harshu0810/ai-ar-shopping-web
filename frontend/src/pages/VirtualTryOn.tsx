import React, { useState, useRef } from 'react'
import { tryOnAPI, productAPI } from '../services/api'
import { useAuth } from '../hooks/useAuth'
import { motion } from 'framer-motion'
import { Upload, Loader } from 'lucide-react'

interface TryOnResult {
  original_image: string
  product_image: string
  generated_image: string
  product_name: string
}

export default function VirtualTryOn() {
  const { user } = useAuth()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<string>('')
  const [products, setProducts] = useState<any[]>([])
  const [result, setResult] = useState<TryOnResult | null>(null)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (!user) return
    const fetchProducts = async () => {
      try {
        const response = await productAPI.getAll({ limit: 20 })
        setProducts(response.data.filter((p: any) => p.category === 'clothing'))
      } catch (error) {
        console.error('Failed to fetch products:', error)
      }
    }
    fetchProducts()
  }, [user])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleGenerate = async () => {
    if (!selectedFile || !selectedProduct) {
      alert('Please select both an image and a product')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('user_image', selectedFile)
      formData.append('product_id', selectedProduct)

      const response = await tryOnAPI.generate(formData)
      setResult(response.data)
    } catch (error) {
      console.error('Try-on generation failed:', error)
      alert('Failed to generate try-on image. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">Please log in to use Virtual Try-On</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-light dark:bg-dark py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-12 text-center text-dark dark:text-light">
          AI Virtual Try-On
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg"
          >
            <h2 className="text-2xl font-bold mb-6">Upload Your Photo</h2>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-primary transition"
            >
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 dark:text-gray-300">
                {selectedFile ? selectedFile.name : 'Click to upload a photo of yourself'}
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            <div className="mt-8">
              <label className="block text-lg font-semibold mb-4">Select a Product</label>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Choose a product...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} - ₹{p.price}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading || !selectedFile || !selectedProduct}
              className="w-full mt-8 bg-primary text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition flex items-center justify-center"
            >
              {loading && <Loader className="w-5 h-5 mr-2 animate-spin" />}
              {loading ? 'Generating...' : 'Generate Try-On'}
            </button>
          </motion.div>

          {/* Result Section */}
          {result && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg"
            >
              <h2 className="text-2xl font-bold mb-6">Your Try-On Result</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Original Photo</p>
                  <img
                    src={result.original_image}
                    alt="Original"
                    className="w-full rounded-lg"
                  />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    You in {result.product_name}
                  </p>
                  <img
                    src={result.generated_image}
                    alt="Try-On Result"
                    className="w-full rounded-lg"
                  />
                </div>
                <button className="w-full bg-secondary text-white py-2 rounded-lg font-semibold hover:bg-yellow-600 transition">
                  Add to Cart
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
