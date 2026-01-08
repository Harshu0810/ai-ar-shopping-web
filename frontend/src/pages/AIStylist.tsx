// frontend/src/pages/AIStylist.tsx
// ============================================================================

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import { stylistAPI } from '../services/api' // Import the real API
import { Sparkles, AlertCircle } from 'lucide-react'

export default function AIStylist() {
  const { user } = useAuth()
  const [skinTone, setSkinTone] = useState('')
  const [occasion, setOccasion] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const handleGetSuggestions = async () => {
    if (!skinTone || !occasion) {
      alert('Please select both skin tone and occasion')
      return
    }

    setLoading(true)
    try {
      // CHANGED: Call the Real Backend API instead of mock
      const response = await stylistAPI.getSuggestions(skinTone, occasion)
      
      if (response.data && response.data.suggestions) {
        setSuggestions(response.data.suggestions)
      } else {
        setSuggestions(["Could not generate suggestions. Please try again."])
      }
    } catch (error) {
      console.error('Failed to get suggestions:', error)
      alert('Failed to connect to AI Stylist. Check backend.')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">Please log in to use AI Stylist</p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-light dark:bg-dark py-12 px-4"
    >
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 flex items-center justify-center text-dark dark:text-light">
            <Sparkles className="w-8 h-8 text-secondary mr-3" />
            AI Personal Stylist
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Get personalized fashion advice based on your skin tone and occasion
          </p>
        </div>

        <motion.div
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8"
        >
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Your Skin Tone
              </label>
              <select
                value={skinTone}
                onChange={(e) => setSkinTone(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Select skin tone...</option>
                <option value="fair">Fair / Pale</option>
                <option value="light">Light</option>
                <option value="medium">Medium / Wheatish</option>
                <option value="olive">Olive</option>
                <option value="tan">Tan</option>
                <option value="dark">Dark</option>
                <option value="deep">Deep / Ebony</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Occasion
              </label>
              <select
                value={occasion}
                onChange={(e) => setOccasion(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Select occasion...</option>
                <option value="casual">Casual Day Out</option>
                <option value="professional">Office / Professional</option>
                <option value="party">Party / Night Out</option>
                <option value="wedding">Wedding / Festive</option>
                <option value="formal">Formal Event</option>
              </select>
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleGetSuggestions}
              disabled={loading}
              className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition"
            >
              {loading ? 'Analyzing...' : 'Get Style Suggestions'}
            </motion.button>
          </div>

          {suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-8 space-y-4"
            >
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Your Style Suggestions</h2>
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="p-4 bg-gradient-to-r from-primary to-secondary text-white rounded-lg shadow-md"
                >
                  {suggestion}
                </div>
              ))}
            </motion.div>
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}
