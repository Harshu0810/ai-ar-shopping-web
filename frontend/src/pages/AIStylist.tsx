// frontend/src/pages/AIStylist.tsx
// ============================================================================

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
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
      // Mock AI suggestions (in production, call backend)
      const mockSuggestions = [
        `Warm colors like ${skinTone === 'fair' ? 'rose gold and jewel tones' : 'coral and gold'} would complement your ${skinTone} skin tone`,
        `For ${occasion}, consider elegant layers and neutral base colors`,
        `Metallic accents in ${skinTone === 'fair' ? 'silver' : 'gold'} would enhance your overall look`,
        `Try a ${skinTone === 'fair' ? 'burgundy or navy' : 'emerald or rust'} color for a sophisticated appearance`
      ]
      setSuggestions(mockSuggestions)
    } catch (error) {
      console.error('Failed to get suggestions:', error)
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
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center text-dark dark:text-light">
          <Sparkles className="w-10 h-10 inline mr-2" />
          AI Stylist
        </h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg"
        >
          <div className="space-y-6">
            <div>
              <label className="block text-lg font-semibold mb-3">Skin Tone</label>
              <select
                value={skinTone}
                onChange={(e) => setSkinTone(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select your skin tone...</option>
                <option value="fair">Fair</option>
                <option value="medium">Medium</option>
                <option value="olive">Olive</option>
                <option value="deep">Deep</option>
              </select>
            </div>

            <div>
              <label className="block text-lg font-semibold mb-3">Occasion</label>
              <select
                value={occasion}
                onChange={(e) => setOccasion(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select occasion...</option>
                <option value="casual">Casual</option>
                <option value="professional">Professional</option>
                <option value="party">Party</option>
                <option value="formal">Formal</option>
                <option value="wedding">Wedding</option>
              </select>
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleGetSuggestions}
              disabled={loading}
              className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition"
            >
              {loading ? 'Getting Suggestions...' : 'Get Style Suggestions'}
            </motion.button>
          </div>

          {suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-8 space-y-4"
            >
              <h2 className="text-2xl font-bold mb-4">Your Style Suggestions</h2>
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="p-4 bg-gradient-to-r from-primary to-secondary text-white rounded-lg"
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
