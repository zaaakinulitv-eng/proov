'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const positions = ['Вратарь', 'Защитник', 'Полузащитник', 'Нападающий']

export default function Register() {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    position: '',
    city: '',
    country: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      })

      if (authError) throw authError

      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: data.user.id,
            full_name: formData.full_name,
            position: formData.position,
            city: formData.city,
            country: formData.country,
          })

        if (profileError) throw profileError

        router.push('/dashboard')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-900 rounded-lg p-6 shadow-lg">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">Регистрация в Proov</h1>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="full_name"
            placeholder="Полное имя"
            value={formData.full_name}
            onChange={handleChange}
            required
            className="w-full p-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-[#22c55e] focus:outline-none"
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full p-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-[#22c55e] focus:outline-none"
          />
          <input
            type="password"
            name="password"
            placeholder="Пароль"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full p-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-[#22c55e] focus:outline-none"
          />
          <select
            name="position"
            value={formData.position}
            onChange={handleChange}
            required
            className="w-full p-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-[#22c55e] focus:outline-none"
          >
            <option value="">Выберите позицию</option>
            {positions.map(pos => (
              <option key={pos} value={pos}>{pos}</option>
            ))}
          </select>
          <input
            type="text"
            name="city"
            placeholder="Город"
            value={formData.city}
            onChange={handleChange}
            required
            className="w-full p-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-[#22c55e] focus:outline-none"
          />
          <input
            type="text"
            name="country"
            placeholder="Страна"
            value={formData.country}
            onChange={handleChange}
            required
            className="w-full p-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-[#22c55e] focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full p-3 bg-[#22c55e] text-white rounded-lg font-semibold hover:bg-[#1ea34a] disabled:opacity-50"
          >
            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
        </form>
        <p className="text-gray-400 mt-4 text-center">
          Уже есть аккаунт? <a href="/login" className="text-[#22c55e] hover:underline">Войти</a>
        </p>
      </div>
    </div>
  )
}