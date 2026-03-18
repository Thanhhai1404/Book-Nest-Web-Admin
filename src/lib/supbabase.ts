import { createClient } from '@supabase/supabase-js'

// Bác lấy 2 cái này trong Dashboard Supabase -> Settings -> API nhé
const supabaseUrl = 'https://lckkixvzeykdxiahxweg.supabase.co'
const supabaseAnonKey = 'sb_publishable_Hc28hTSw9w23NLYuesuy9Q_-f8rOgNT' 

export const supabase = createClient(supabaseUrl, supabaseAnonKey)