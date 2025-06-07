import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const dataSource = import.meta.env.VITE_DATA_SOURCE

// Only require Supabase credentials if not using mock data
if (dataSource !== 'mock' && (!supabaseUrl || !supabaseAnonKey)) {
  throw new Error('Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.')
}

// Create a mock client when using mock data source
const createMockClient = () => {
  const createChainableQuery = () => ({
    eq: () => createChainableQuery(),
    select: () => createChainableQuery(),
    single: () => Promise.resolve({ data: null, error: null }),
    then: (resolve: any) => resolve({ data: null, error: null })
  });

  return {
    from: () => ({
      select: () => createChainableQuery(),
      insert: () => createChainableQuery(),
      update: () => createChainableQuery(),
      delete: () => createChainableQuery(),
    }),
    auth: {
      signUp: () => Promise.resolve({ data: null, error: null }),
      signIn: () => Promise.resolve({ data: null, error: null }),
      signOut: () => Promise.resolve({ error: null }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    },
  }
}

export const supabase = dataSource === 'mock' 
  ? createMockClient() as any
  : createClient(supabaseUrl!, supabaseAnonKey!)