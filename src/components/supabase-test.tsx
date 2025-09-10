'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export function SupabaseTest() {
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'connected' | 'error'>('testing')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function testConnection() {
      try {
        const { data, error } = await supabase.from('profiles').select('count').limit(1)
        
        if (error) {
          setConnectionStatus('error')
          setError(error.message)
        } else {
          setConnectionStatus('connected')
        }
      } catch (err) {
        setConnectionStatus('error')
        setError(err instanceof Error ? err.message : 'Unknown error')
      }
    }

    testConnection()
  }, [])

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-2">Supabase Connection Test</h3>
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${
          connectionStatus === 'testing' ? 'bg-yellow-500' :
          connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'
        }`} />
        <span className="text-sm">
          {connectionStatus === 'testing' && 'Testing connection...'}
          {connectionStatus === 'connected' && 'Connected successfully!'}
          {connectionStatus === 'error' && `Error: ${error}`}
        </span>
      </div>
    </div>
  )
}
