
// frontend/src/services/auth.ts
// ============================================================================

import { supabase } from './supabaseClient'

interface User {
  id: string
  email: string
  name?: string
}

export const authService = {
  async register(email: string, password: string, name: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name }
      }
    })
    if (error) throw error
    return data
  },

  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) throw error
    return data
  },

  async logout() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    return {
      id: user.id,
      email: user.email || '',
      name: user.user_metadata?.name
    }
  },

  async getSession() {
    const { data: { session } } = await supabase.auth.getSession()
    return session
  }
}
