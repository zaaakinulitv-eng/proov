'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    getUser()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center page-enter">
        <div className="animate-pulse text-[#AAFF00] text-xl font-bold">Proov</div>
      </div>
    )
  }

  if (user) {
    return (
      <div className="min-h-screen bg-[#080808] page-enter">
        {/* Header */}
        <header className="header-base h-16 flex items-center px-8">
          <div className="flex-1">
            <h1 className="text-2xl font-black text-[#AAFF00]">Proov</h1>
          </div>
          <div className="flex gap-4">
            <Link href="/dashboard" className="btn-primary text-sm">
              Мой профиль
            </Link>
            <button 
              onClick={async () => {
                await supabase.auth.signOut()
                window.location.reload()
              }}
              className="btn-secondary text-sm"
            >
              Выход
            </button>
          </div>
        </header>

        {/* Hero */}
        <main className="max-w-7xl mx-auto px-8 py-20">
          <div className="text-center mb-20">
            <h1 className="text-6xl font-black mb-6 text-white">
              Докажи что ты <span className="text-[#AAFF00]">игрок</span>
            </h1>
            <p className="text-xl text-[#888888] max-w-2xl mx-auto mb-12">
              Платформа для скаутов и игроков. Верифицированные матчи, прозрачная статистика, реальная оценка.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/submit-match" className="btn-primary">
                Добавить матч
              </Link>
              <Link href="/dashboard" className="btn-secondary">
                Мой рейтинг
              </Link>
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20">
            {[
              {
                title: 'Верифицированные матчи',
                desc: 'Только реальные данные. Каждый матч проходит модерацию.',
                icon: '✓'
              },
              {
                title: 'FIFA-рейтинг',
                desc: 'Твой реальный рейтинг на основе статистики матчей.',
                icon: '⭐'
              },
              {
                title: 'Для скаутов',
                desc: 'Откройте свой профиль — скауты смогут оценить твои возможности.',
                icon: '👁'
              }
            ].map((feature, i) => (
              <div key={i} className="card-stagger card-elevated">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                <p className="text-[#888888]">{feature.desc}</p>
              </div>
            ))}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#080808] page-enter">
      {/* Header */}
      <header className="header-base h-16 flex items-center px-8">
        <h1 className="text-2xl font-black text-[#AAFF00]">Proov</h1>
        <div className="flex-1" />
        <div className="flex gap-4">
          <Link href="/login" className="btn-secondary">
            Войти
          </Link>
          <Link href="/register" className="btn-primary">
            Регистрация
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-7xl mx-auto px-8 py-20 text-center">
        <h1 className="text-6xl md:text-7xl font-black mb-6">
          Докажи что ты <span className="text-[#AAFF00]">игрок</span>
        </h1>
        <p className="text-xl text-[#888888] max-w-2xl mx-auto mb-12">
          Верифицированная платформа для скаутов и игроков. Твоя реальная статистика в одном месте.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/register" className="btn-primary text-lg px-8 py-4">
            Начать
          </Link>
          <Link href="/scout" className="btn-secondary text-lg px-8 py-4">
            Поиск игроков
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mt-32 max-w-2xl mx-auto">
          {[
            { num: '1000+', label: 'Игроков' },
            { num: '5000+', label: 'Матчей' },
            { num: '100+', label: 'Скаутов' }
          ].map((stat, i) => (
            <div key={i} className="card-stagger">
              <div className="text-3xl font-black text-[#AAFF00]">{stat.num}</div>
              <div className="text-sm text-[#888888]">{stat.label}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
