'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

const positions = [
  'Вратарь (GK)',
  'Правый защитник (RB)',
  'Левый защитник (LB)',
  'Центральный защитник (CB)',
  'Опорный полузащитник (CDM)',
  'Центральный полузащитник (CM)',
  'Атакующий полузащитник (CAM)',
  'Правый вингер (RW)',
  'Левый вингер (LW)',
  'Второй нападающий (CF)',
  'Нападающий (ST)'
]

export default function Register() {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    positions: [] as string[],
    city: '',
    country: '',
    nationality: '',
    birth_date: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const togglePosition = (position: string) => {
    setFormData(prev => {
      const selected = prev.positions.includes(position)
      const nextPositions = selected
        ? prev.positions.filter(item => item !== position)
        : prev.positions.length < 3
        ? [...prev.positions, position]
        : prev.positions

      return { ...prev, positions: nextPositions }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (formData.positions.length === 0) {
      setError('Выберите хотя бы одну позицию')
      setLoading(false)
      return
    }

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
            id: data.user.id,
            full_name: formData.full_name,
            positions: formData.positions,
            city: formData.city,
            country: formData.country,
            nationality: formData.nationality,
            birth_date: formData.birth_date,
            trust_score: 0,
            is_founder_verified: false,
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
    <div className="min-h-screen flex page-enter">
      {/* Left Side - Premium Brand */}
      <div className="hidden md:flex md:w-1/2 bg-[#AAFF00] flex-col justify-center items-center p-12">
        <div className="max-w-md">
          <h1 className="text-7xl font-black text-black mb-8 leading-tight">
            Присоединись к <br />
            <span className="bg-gradient-to-r from-black via-black to-[#FF9900] bg-clip-text text-transparent">
              элите
            </span>
          </h1>
          <p className="text-lg text-black/80 font-medium">
            Верифицированная платформа для скаутов и профессиональных игроков. Начни свой путь к успеху.
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

          <h2 className="text-4xl font-black mb-8 text-white">Регистрация</h2>

          {error && (
            <div className="bg-[#FF333315] border border-[#FF333330] rounded-lg p-4 mb-6 text-[#FF3333] text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#AAFF00] mb-2">Полное имя</label>
              <input
                type="text"
                name="full_name"
                placeholder="Иван Петров"
                value={formData.full_name}
                onChange={handleChange}
                required
                className="input-field w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#AAFF00] mb-2">Email</label>
              <input
                type="email"
                name="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                className="input-field w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#AAFF00] mb-2">Пароль</label>
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                className="input-field w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#AAFF00] mb-3">Твои позиции</label>
              <p className="text-xs text-[#888888] mb-4">Выберите от 1 до 3 позиций</p>
              <div className="grid grid-cols-2 gap-2">
                {positions.map(pos => {
                  const selected = formData.positions.includes(pos)
                  return (
                    <button
                      key={pos}
                      type="button"
                      onClick={() => togglePosition(pos)}
                      className={`rounded-2xl px-3 py-3 text-left text-sm font-medium transition-all border ${
                        selected
                          ? 'bg-[#AAFF00] text-black border-transparent'
                          : 'border-[#333333] text-[#888888] bg-[#111111] hover:border-[#AAFF00] hover:text-white'
                      }`}
                    >
                      {pos}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[#AAFF00] mb-2">Город</label>
                <input
                  type="text"
                  name="city"
                  placeholder="Москва"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#AAFF00] mb-2">Страна</label>
                <input
                  type="text"
                  name="country"
                  placeholder="Россия"
                  value={formData.country}
                  onChange={handleChange}
                  required
                  className="input-field w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[#AAFF00] mb-2">Национальность</label>
                <input
                  type="text"
                  name="nationality"
                  placeholder="Русский"
                  value={formData.nationality}
                  onChange={handleChange}
                  required
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#AAFF00] mb-2">Дата рождения</label>
                <input
                  type="date"
                  name="birth_date"
                  value={formData.birth_date}
                  onChange={handleChange}
                  required
                  className="input-field w-full"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-8 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              {loading ? 'Регистрация...' : 'Зарегистрироваться'}
            </button>
          </form>

          <p className="text-center text-[#888888] mt-8">
            Уже есть аккаунт?{' '}
            <Link href="/login" className="text-[#AAFF00] font-bold hover:underline">
              Войти
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}