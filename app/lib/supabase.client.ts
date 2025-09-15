import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
}

let browserClient: ReturnType<typeof createClient> | undefined

export function getSupabaseBrowserClient() {
    if (typeof window === 'undefined') {
        throw new Error('getSupabaseBrowserClient must be used in the browser')
    }
    if (!browserClient) {
        browserClient = createClient(supabaseUrl, supabaseAnonKey)
    }
    return browserClient
}
