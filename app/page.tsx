'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [playerCount, setPlayerCount] = useState(0)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
    supabase.from('profiles').select('id', { count: 'exact', head: true }).then(({ count }) => {
      setPlayerCount(count || 0)
    })
  }, [])

  return (
    <div className="min-h-screen bg-[#080808] text-white overflow-x-hidden">

      <nav className="sticky top-0 z-50 h-16 flex items-center px-6 md:px-12 border-b border-[#161616] bg-[#080808]/90 backdrop-blur-xl">
        <span className="text-xl font-black text-[#AAFF00] tracking-tight">Proov</span>
        <div className="flex-1" />
        <div className="flex gap-3 items-center">
          <Link href="/scout" className="text-sm text-[#888] hover:text-white transition-colors hidden md:block">
            Найти игрока
          </Link>
          {user ? (
            <Link href="/dashboard" className="bg-[#AAFF00] text-black font-bold px-5 py-2 rounded-xl text-sm hover:brightness-110 transition-all">
              Мой профиль
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-sm text-[#888] hover:text-white transition-colors">
                Войти
              </Link>
              <Link href="/register" className="bg-[#AAFF00] text-black font-bold px-5 py-2 rounded-xl text-sm hover:brightness-110 transition-all">
                Начать
              </Link>
            </>
          )}
        </div>
      </nav>

      <section className="relative flex flex-col items-center justify-center text-center px-6 pt-24 pb-20 md:pt-36 md:pb-32">
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
          Верифицированный цифровой паспорт футболиста. Реальная статистика, FIFA-рейтинг, видимость для скаутов.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <Link href="/register" className="bg-[#AAFF00] text-black font-black px-8 py-4 rounded-xl text-base hover:brightness-110 transition-all w-full sm:w-auto">
            Создать профиль — бесплатно
          </Link>
          <Link href="/scout" className="border border-[#333] text-white font-bold px-8 py-4 rounded-xl text-base hover:border-[#AAFF00] hover:text-[#AAFF00] transition-all w-full sm:w-auto">
            Найти игрока →
          </Link>
        </div>
      </section>

      <section className="border-y border-[#161616] py-8 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl md:text-4xl font-black text-[#AAFF00]">200M+</div>
            <div className="text-xs md:text-sm text-[#666] mt-1">любителей без профиля</div>
          </div>
          <div>
            <div className="text-2xl md:text-4xl font-black text-[#AAFF00]">100%</div>
            <div className="text-xs md:text-sm text-[#666] mt-1">верифицированные данные</div>
          </div>
          <div>
            <div className="text-2xl md:text-4xl font-black text-[#AAFF00]">0₽</div>
            <div className="text-xs md:text-sm text-[#666] mt-1">для игроков навсегда</div>
          </div>
        </div>
      </section>

      <section className="px-6 py-20 md:py-32 max-w-5xl mx-auto">
        <p className="text-xs font-semibold text-[#AAFF00] uppercase tracking-widest mb-4 text-center">Как это работает</p>
        <h2 className="text-3xl md:text-5xl font-black text-center mb-16 tracking-tight">
          Три шага до профиля
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-[#111] border border-[#1A1A1A] p-8 rounded-2xl hover:border-[#AAFF0030] transition-all">
            <div className="text-4xl mb-4">🪪</div>
            <div className="text-xs font-bold text-[#AAFF00] uppercase tracking-widest mb-2">01</div>
            <h3 className="text-xl font-bold mb-2">Регистрируйся</h3>
            <p className="text-[#888] leading-relaxed">Создай профиль за 2 минуты. Укажи позицию, клуб, город.</p>
          </div>
          <div className="bg-[#111] border border-[#1A1A1A] p-8 rounded-2xl hover:border-[#AAFF0030] transition-all">
            <div className="text-4xl mb-4">⚽</div>
            <div className="text-xs font-bold text-[#AAFF00] uppercase tracking-widest mb-2">02</div>
            <h3 className="text-xl font-bold mb-2">Добавляй матчи</h3>
            <p className="text-[#888] leading-relaxed">После каждой игры вноси статистику и фото результата.</p>
          </div>
          <div className="bg-[#111] border border-[#1A1A1A] p-8 rounded-2xl hover:border-[#AAFF0030] transition-all">
            <div className="text-4xl mb-4">🏆</div>
            <div className="text-xs font-bold text-[#AAFF00] uppercase tracking-widest mb-2">03</div>
            <h3 className="text-xl font-bold mb-2">Получи рейтинг</h3>
            <p className="text-[#888] leading-relaxed">После верификации — FIFA-карточка и видимость для скаутов.</p>
          </div>
        </div>
      </section>

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
            <Link href="/scout" className="bg-[#AAFF00] text-black font-black inline-block px-8 py-4 rounded-xl hover:brightness-110 transition-all">
              Найти игрока →
            </Link>
          </div>
          <div className="flex-1 grid grid-cols-2 gap-4 w-full">
            <div className="bg-[#111] border border-[#1A1A1A] rounded-xl p-5 hover:border-[#AAFF0030] transition-all">
              <div className="text-2xl mb-2">🎯</div>
              <div className="text-sm font-semibold">Фильтр по позиции</div>
            </div>
            <div className="bg-[#111] border border-[#1A1A1A] rounded-xl p-5 hover:border-[#AAFF0030] transition-all">
              <div className="text-2xl mb-2">✅</div>
              <div className="text-sm font-semibold">Trust Score</div>
            </div>
            <div className="bg-[#111] border border-[#1A1A1A] rounded-xl p-5 hover:border-[#AAFF0030] transition-all">
              <div className="text-2xl mb-2">💬</div>
              <div className="text-sm font-semibold">Прямой контакт</div>
            </div>
            <div className="bg-[#111] border border-[#1A1A1A] rounded-xl p-5 hover:border-[#AAFF0030] transition-all">
              <div className="text-2xl mb-2">📊</div>
              <div className="text-sm font-semibold">Реальная статистика</div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-24 text-center">
        <div className="max-w-2xl mx-auto bg-[#AAFF00] rounded-3xl p-12">
          <h2 className="text-3xl md:text-5xl font-black text-black mb-4 tracking-tight">
            Готов доказать?
          </h2>
          <p className="text-black/70 mb-8 text-lg">
            Создай профиль бесплатно и получи свою FIFA-карточку.
          </p>
          <Link href="/register" className="inline-block bg-black text-[#AAFF00] font-black px-10 py-4 rounded-xl text-lg hover:bg-[#111] transition-colors">
            Создать профиль
          </Link>
        </div>
      </section>

      <footer className="border-t border-[#161616] px-6 py-8 text-center">
        <p className="text-[#444] text-sm">
          © 2026 Proov ·{' '}
          <Link href="/scout" className="hover:text-[#AAFF00] transition-colors">Найти игрока</Link>
          {' · '}
          <Link href="/register" className="hover:text-[#AAFF00] transition-colors">Регистрация</Link>
        </p>
      </footer>

    </div>
  )
}
