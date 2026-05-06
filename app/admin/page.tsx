'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [playerCount, setPlayerCount] = useState(0)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
    supabase.from('profiles').select('id', { count: 'exact' }).then(({ count }) => {
      setPlayerCount(count || 0)
    })
  }, [])

  return (
    <div className="min-h-screen bg-[#080808] text-white overflow-x-hidden">

      {/* NAV */}
      <nav className="header-base h-16 flex items-center px-6 md:px-12 border-b border-[#161616]">
        <span className="text-xl font-black text-[#AAFF00] tracking-tight">Proov</span>
        <div className="flex-1" />
        <div className="flex gap-3 items-center">
          <Link href="/scout" className="text-sm text-[#888] hover:text-white transition-colors hidden md:block">
            Найти игрока
          </Link>
          {user ? (
            <Link href="/dashboard" className="btn-primary text-sm px-5 py-2">
              Мой профиль
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-sm text-[#888] hover:text-white transition-colors">
                Войти
              </Link>
              <Link href="/register" className="btn-primary text-sm px-5 py-2">
                Начать
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* HERO */}
      <section className="relative flex flex-col items-center justify-center text-center px-6 pt-24 pb-20 md:pt-36 md:pb-32">
        {/* Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#AAFF00] opacity-[0.04] blur-[120px] pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#AAFF0030] bg-[#AAFF0008] mb-8">
          <span className="w-2 h-2 rounded-full bg-[#AAFF00] animate-pulse" />
          <span className="text-xs font-semibold text-[#AAFF00] uppercase tracking-widest">
            {playerCount > 0 ? `${playerCount} игроков уже в базе` : 'Бесплатно для игроков'}
          </span>
        </div>

        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-none tracking-tight mb-6 max-w-4xl">
          Докажи что<br />
          <span className="text-[#AAFF00]">ты игрок</span>
        </h1>

        <p className="text-lg md:text-xl text-[#888888] max-w-xl mb-10 leading-relaxed">
          Верифицированный цифровой паспорт футболиста. Реальная статистика, рейтинг, видимость для скаутов.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <Link href="/register" className="btn-primary text-base px-8 py-4 font-bold w-full sm:w-auto">
            Создать профиль — бесплатно
          </Link>
          <Link href="/scout" className="btn-secondary text-base px-8 py-4 w-full sm:w-auto">
            Найти игрока →
          </Link>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="border-y border-[#161616] py-8 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-4 text-center">
          {[
            { num: '200M+', label: 'любителей без профиля' },
            { num: '100%', label: 'верифицированные данные' },
            { num: '0₽', label: 'для игроков навсегда' },
          ].map((s, i) => (
            <div key={i}>
              <div className="text-2xl md:text-4xl font-black text-[#AAFF00]">{s.num}</div>
              <div className="text-xs md:text-sm text-[#666] mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="px-6 py-20 md:py-32 max-w-5xl mx-auto">
        <p className="text-xs font-semibold text-[#AAFF00] uppercase tracking-widest mb-4 text-center">Как это работает</p>
        <h2 className="text-3xl md:text-5xl font-black text-center mb-16 tracking-tight">
          Три шага до профиля
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              num: '01',
              title: 'Регистрируйся',
              desc: 'Создай профиль за 2 минуты. Укажи позицию, клуб, город.',
              icon: '🪪'
            },
            {
              num: '02',
              title: 'Добавляй матчи',
              desc: 'После каждой игры вноси статистику и фото результата.',
              icon: '⚽'
            },
            {
              num: '03',
              title: 'Получи рейтинг',
              desc: 'После верификации — карточка с рейтингом и видимость для скаутов.',
              icon: '🏆'
            },
          ].map((step, i) => (
            <div key={i} className="card bg-[#111] border border-[#1A1A1A] p-8 rounded-2xl hover:border-[#AAFF0030] transition-all">
              <div className="text-4xl mb-4">{step.icon}</div>
              <div className="text-xs font-bold text-[#AAFF00] uppercase tracking-widest mb-2">{step.num}</div>
              <h3 className="text-xl font-bold mb-2">{step.title}</h3>
              <p className="text-[#888] leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FOR SCOUTS */}
      <section className="px-6 py-16 border-t border-[#161616]">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1">
            <p className="text-xs font-semibold text-[#AAFF00] uppercase tracking-widest mb-4">Для скаутов</p>
            <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tight">
              85% будущих<br />профи — здесь
            </h2>
            <p className="text-[#888] text-lg mb-8 leading-relaxed">
              Игроки которых нет на Transfermarkt. Верифицированная статистика. Прямой контакт без агентов.
            </p>
            <Link href="/scout" className="btn-primary inline-block px-8 py-4 font-bold">
              Найти игрока →
            </Link>
          </div>
          <div className="flex-1 grid grid-cols-2 gap-4 w-full">
            {[
              { label: 'Фильтр по позиции', icon: '🎯' },
              { label: 'Trust Score', icon: '✅' },
              { label: 'Прямой контакт', icon: '💬' },
              { label: 'Реальная статистика', icon: '📊' },
            ].map((f, i) => (
              <div key={i} className="bg-[#111] border border-[#1A1A1A] rounded-xl p-5 hover:border-[#AAFF0030] transition-all">
                <div className="text-2xl mb-2">{f.icon}</div>
                <div className="text-sm font-semibold">{f.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24 text-center">
        <div className="max-w-2xl mx-auto bg-[#AAFF00] rounded-3xl p-12">
          <h2 className="text-3xl md:text-5xl font-black text-black mb-4 tracking-tight">
            Готов доказать?
          </h2>
          <p className="text-black/70 mb-8 text-lg">
            Создай профиль бесплатно и получи свою карточку.
          </p>
          <Link href="/register" className="inline-block bg-black text-[#AAFF00] font-black px-10 py-4 rounded-xl text-lg hover:bg-[#111] transition-colors">
            Создать профиль
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#161616] px-6 py-8 text-center">
        <p className="text-[#444] text-sm">
          © 2026 Proov · <Link href="/scout" className="hover:text-[#AAFF00] transition-colors">Найти игрока</Link> · <Link href="/register" className="hover:text-[#AAFF00] transition-colors">Регистрация</Link>
        </p>
      </footer>

    </div>
  )
}
