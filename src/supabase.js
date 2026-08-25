import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://uppsarzjmyzoetzioqhd.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwcHNhcnpqbXl6b2V0emlvcWhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2NTMyMTAsImV4cCI6MjEwMzIyOTIxMH0.W28SLLn81fhdJXGoIHlHlNZDZ1F6Sv3kH58twPLRskg'

export const supabase = createClient(supabaseUrl, supabaseKey)