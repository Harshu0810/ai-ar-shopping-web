// frontend/src/pages/AIStylist.tsx
// COMPLETELY FIXED VERSION - Calls Backend API
// ============================================================================

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import { stylistAPI } from '../services/api'
import { Sparkles, AlertCircle, Loader } from 'lucide-react'

export default function AIStylist() {
  const { user } = useAuth()
  const [skinTone, setSkinTone] = useState('')
  const [occasion, setOccasion] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGetSuggestions = async () => {
    if (!skinTone || !occasion) {
      setError('Please select both skin tone and occasion')
      return
    }

    setLoading(true)
    setError('')
    setSuggestions([])

    try {
      // Call the actual backend API
      const response = await stylistAPI.getSuggestions(skinTone, occasion)
      setSuggestions(response.data.suggestions)
    } catch (err: any) {
      console.error('Failed to get suggestions:', err)
      setError(err.response?.data?.detail || 'Failed to get style suggestions. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-xl text-gray-600">Please log in to use AI Stylist</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4"
    >
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-gradient-to-r from-primary to-secondary p-3 rounded-full mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            AI Style Consultant
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Get personalized fashion advice powered by AI
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg"
        >
          <div className="space-y-6">
            {/* Skin Tone Selection */}
            <div>
              <label className="block text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
                Your Skin Tone
              </label>
              <select
                value={skinTone}
                onChange={(e) => {
                  setSkinTone(e.target.value)
                  setError('')
                }}
                className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Select your skin tone...</option>
                <option value="fair">Fair / Light</option>
                <option value="medium">Medium / Wheatish</option>
                <option value="olive">Olive / Tan</option>
                <option value="dark">Deep / Dark</option>
              </select>
            </div>

            {/* Occasion Selection */}
            <div>
              <label className="block text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
                Occasion
              </label>
              <select
                value={occasion}
                onChange={(e) => {
                  setOccasion(e.target.value)
                  setError('')
                }}
                className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Select occasion...</option>
                <option value="casual">Casual / Day Out</option>
                <option value="professional">Professional / Work</option>
                <option value="party">Party / Night Out</option>
                <option value="formal">Formal Event</option>
                <option value="wedding">Wedding / Festive</option>
              </select>
            </div>

            {/* Error Display */}
            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg flex items-center"
              >
                <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Generate Button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleGetSuggestions}
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary to-blue-600 text-white py-4 rounded-lg font-semibold text-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader className="w-6 h-6 animate-spin mr-2" />
                  Getting Suggestions...
                </>
              ) : (
                <>
                  <Sparkles className="w-6 h-6 mr-2" />
                  Get Style Suggestions
                </>
              )}
            </motion.button>
          </div>

          {/* Results Display */}
          {suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 space-y-4"
            >
              <div className="flex items-center mb-4">
                <div className="bg-gradient-to-r from-primary to-secondary w-1 h-6 rounded-full mr-3"></div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                  Your Personalized Style Guide
                </h2>
              </div>
              
              {suggestions.map((suggestion, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-5 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 rounded-lg border-l-4 border-primary shadow-sm"
                >
                  <div className="flex items-start">
                    <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm mr-3 flex-shrink-0">
                      {index + 1}
                    </div>
                    <p className="text-gray-800 dark:text-gray-100 leading-relaxed flex-1">
                      {suggestion}
                    </p>
                  </div>
                </motion.div>
              ))}

              <div className="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-gray-700 dark:text-gray-300 flex items-center">
                  <Sparkles className="w-4 h-4 mr-2 text-yellow-600" />
                  <span className="font-medium">Pro Tip:</span>&nbsp;
                  Try combining these suggestions with products from our catalog!
                </p>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}
