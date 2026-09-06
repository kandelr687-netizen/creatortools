import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types'

interface AuthState {
  profile: Profile | null
  loading: boolean
  setProfile: (profile: Profile | null) => void
  setLoading: (loading: boolean) => void
  fetchProfile: () => Promise<Profile | null>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  profile: null,
  loading: true,

  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),

  fetchProfile: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      set({ profile: null, loading: false })
      return null
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()
    if (error || !data) {
      set({ profile: null, loading: false })
      return null
    }
    set({ profile: data as Profile, loading: false })
    return data as Profile
  },

  refreshProfile: async () => {
    await get().fetchProfile()
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ profile: null, loading: false })
  },
}))
