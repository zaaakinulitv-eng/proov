'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-900 rounded-lg p-6 shadow-lg">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">Вход в Proov</h1>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-[#22c55e] focus:outline-none"
          />
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full p-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-[#22c55e] focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full p-3 bg-[#22c55e] text-white rounded-lg font-semibold hover:bg-[#1ea34a] disabled:opacity-50"
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>
        <p className="text-gray-400 mt-4 text-center">
          Нет аккаунта? <a href="/register" className="text-[#22c55e] hover:underline">Зарегистрироваться</a>
        </p>
      </div>
    </div>
  )
}