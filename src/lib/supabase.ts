import { createClient } from '@supabase/supabase-js'
import { getInitData } from './telegram'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    headers: {
      'x-telegram-init-data': getInitData(),
    },
  },
})
