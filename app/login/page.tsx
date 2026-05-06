'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
    <div className="min-h-screen flex page-enter">
      {/* Left Side - Premium Brand */}
      <div className="hidden md:flex md:w-1/2 bg-[#AAFF00] flex-col justify-center items-center p-12">
        <div className="max-w-md">
          <h1 className="text-7xl font-black text-black mb-8 leading-tight">
            Докажи что ты <br />
            <span className="bg-gradient-to-r from-black via-black to-[#FF9900] bg-clip-text text-transparent">
              игрок
            </span>
          </h1>
          <p className="text-lg text-black/80 font-medium">
            Верифицированная платформа для скаутов и профессиональных игроков. Твоя реальная статистика в одном месте.
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full md:w-1/2 bg-[#080808] flex flex-col justify-center items-center p-8">
        <div className="w-full max-w-sm">
          {/* Header */}
          <div className="mb-12 md:hidden">
            <h1 className="text-3xl font-black text-[#AAFF00] mb-2">Proov</h1>
            <p className="text-[#888888]">Докажи что ты игрок</p>
          </div>

          <h2 className="text-4xl font-black mb-8 text-white">Вход</h2>

          {error && (
            <div className="bg-[#FF333315] border border-[#FF333330] rounded-lg p-4 mb-6 text-[#FF3333] text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#AAFF00] mb-2">Email</label>
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-field w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#AAFF00] mb-2">Пароль</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input-field w-full"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-8 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              {loading ? 'Вход...' : 'Войти'}
            </button>
          </form>

          <p className="text-center text-[#888888] mt-8">
            Нет аккаунта?{' '}
            <Link href="/register" className="text-[#AAFF00] font-bold hover:underline">
              Зарегистрироваться
            </Link>
          </p>

          <div className="mt-12 pt-8 border-t border-[#222222]">
            <p className="text-center text-[#888888] mb-4 text-sm">Ты скаут?</p>
            <Link href="/scout" className="btn-secondary w-full text-center">
              Найти игрока →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}