import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sgwdsilzvvbipvzvlucd.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnd2RzaWx6dnZiaXB2enZsdWNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MjI2OTgsImV4cCI6MjA5NDM5ODY5OH0.hE1Gt7IrWnoeKgNMa-ThCxp0wVC3_Wf7h8Rb4fdYRMM'

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
)