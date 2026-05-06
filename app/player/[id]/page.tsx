'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'

interface Profile {
  id: string
  full_name: string
  avatar_url?: string
  positions?: string[]
  position?: string
  city: string
  country: string
  trust_score: number
  is_founder_verified: boolean
}

interface Match {
  id: string
  played_at: string
  opponent_team: string
  score_us: number
  score_them: number
  goals: number
  assists: number
  minutes_played: number
  status: string
}

export default function PlayerProfile() {
  const params = useParams()
  const userId = params.id as string

  const [profile, setProfile] = useState<Profile | null>(null)
  const [matches, setMatches] = useState<Match[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Contact modal state
  const [showContactModal, setShowContactModal] = useState(false)
  const [contactForm, setContactForm] = useState({
    scout_name: '',
    scout_email: '',
    message: ''
  })
  const [contactLoading, setContactLoading] = useState(false)
  const [contactSuccess, setContactSuccess] = useState(false)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileError) {
        console.error('Error fetching profile:', profileError)
        setLoading(false)
        return
      }

      setProfile(profileData)

      const { data: matchesData } = await supabase
        .from('matches')
        .select('*')
        .eq('player_id', userId)
        .order('played_at', { ascending: false })

      setMatches(matchesData || [])
      setLoading(false)
    }

    fetchData()
  }, [userId])

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setContactLoading(true)

    try {
      const response = await fetch('/api/contact-player', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          player_id: userId,
          ...contactForm
        }),
      })

      if (response.ok) {
        setContactSuccess(true)
        setTimeout(() => {
          setShowContactModal(false)
          setContactSuccess(false)
          setContactForm({ scout_name: '', scout_email: '', message: '' })
        }, 2000)
      } else {
        alert('Ошибка отправки сообщения')
      }
    } catch (error) {
      alert('Ошибка отправки сообщения')
    } finally {
      setContactLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center page-enter">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#AAFF0033] border-t-[#AAFF00] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#888888]">Загрузка профиля...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center page-enter">
        <div className="text-center">
          <p className="text-2xl font-bold text-white mb-6">Игрок не найден</p>
          <Link href="/" className="btn-primary">
            На главную
          </Link>
        </div>
      </div>
    )
  }

  const approvedMatches = matches.filter(m => m.status === 'approved')
  const totalMatches = approvedMatches.length
  const totalGoals = approvedMatches.reduce((sum, m) => sum + m.goals, 0)
  const totalAssists = approvedMatches.reduce((sum, m) => sum + m.assists, 0)
  const totalMinutes = approvedMatches.reduce((sum, m) => sum + m.minutes_played, 0)

  const goalsPerMatch = totalMatches > 0 ? (totalGoals / totalMatches).toFixed(1) : '0.0'
  const assistsPerMatch = totalMatches > 0 ? (totalAssists / totalMatches).toFixed(1) : '0.0'
  const averageMinutes = totalMatches > 0 ? Math.round(totalMinutes / totalMatches) : 0

  let rating = 40
  if (profile.trust_score > 50) rating += 20
  rating += Math.min(totalMatches, 20)
  if (parseFloat(goalsPerMatch) > 0.5) rating += 5
  if (parseFloat(assistsPerMatch) > 1) rating += 5
  rating = Math.min(rating, 90)

  const last5Matches = approvedMatches.slice(0, 5)

  return (
    <div className="min-h-screen bg-[#080808]">
      {/* Header */}
      <header className="header-base h-20 flex items-center px-8 border-b border-[#1A1A1A]">
        <Link href="/" className="text-[#AAFF00] font-black text-xl">
          ← Proov
        </Link>
        <div className="flex-1" />
        {!user && (
          <Link href="/login" className="btn-secondary text-sm">
            Войти
          </Link>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-8 py-12 page-enter">
        {/* Profile Header */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-[#111111] flex items-center justify-center text-4xl font-black text-black">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
              ) : (
                profile.full_name.charAt(0).toUpperCase()
              )}
            </div>
          </div>
          {profile.is_founder_verified && (
            <div className="flex justify-center mb-6">
              <span className="tag-verified text-base px-4 py-2">⭐ Founder Verified</span>
            </div>
          )}
          <h1 className="text-5xl font-black mb-3 text-white uppercase tracking-tighter">
            {profile.full_name}
          </h1>
          <p className="text-xl text-[#888888] font-medium">
            {profile.positions?.join(' • ') || profile.position || 'Игрок'} • {profile.city}, {profile.country}
          </p>
        </div>

        {/* FIFA-Style Golden Card */}
        <div className="relative mb-16 p-12 rounded-3xl overflow-hidden" style={{
          background: 'linear-gradient(135deg, #1A1200 0%, #3D2B00 50%, #6B4A00 100%)',
          border: '2px solid #AAFF00'
        }}>
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#AAFF0020] to-transparent pointer-events-none"></div>

          <div className="relative z-10">
            <div className="grid grid-cols-4 gap-8 text-center mb-12">
              {/* Rating Circle */}
              <div className="flex flex-col items-center">
                <div className="relative w-40 h-40 mb-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#AAFF00] to-[#FFD700] rounded-full flex items-center justify-center">
                    <div className="absolute inset-2 bg-gradient-to-br from-[#1A1200] to-[#3D2B00] rounded-full flex items-center justify-center">
                      <span className="text-6xl font-black text-[#AAFF00]">{rating}</span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-[#FFD700] font-bold uppercase tracking-widest">Рейтинг</p>
              </div>

              {/* Stats */}
              <div>
                <div className="text-5xl font-black text-[#AAFF00] mb-3">{totalMatches}</div>
                <p className="text-sm text-[#FFD700] font-bold uppercase tracking-widest">Матчей</p>
              </div>

              <div>
                <div className="text-5xl font-black text-[#AAFF00] mb-3">{totalGoals}</div>
                <p className="text-sm text-[#FFD700] font-bold uppercase tracking-widest">Голов</p>
              </div>

              <div>
                <div className="text-5xl font-black text-[#AAFF00] mb-3">{totalAssists}</div>
                <p className="text-sm text-[#FFD700] font-bold uppercase tracking-widest">Передач</p>
              </div>
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-3 gap-6 mt-12 pt-12 border-t border-[#AAFF0040]">
              <div className="text-center">
                <div className="text-3xl font-black text-[#AAFF00]">{goalsPerMatch}</div>
                <p className="text-xs text-[#FFD700] font-bold uppercase tracking-widest mt-2">Голов/Матч</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-black text-[#AAFF00]">{assistsPerMatch}</div>
                <p className="text-xs text-[#FFD700] font-bold uppercase tracking-widest mt-2">Передач/Матч</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-black text-[#AAFF00]">{averageMinutes}</div>
                <p className="text-xs text-[#FFD700] font-bold uppercase tracking-widest mt-2">Минут/Матч</p>
              </div>
            </div>
          </div>
        </div>

        {/* Trust Score */}
        <div className="card-elevated mb-16 p-8">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-bold text-[#AAFF00] uppercase tracking-widest">Trust Score</span>
            <span className="text-sm text-[#888888]">{profile.trust_score}/100</span>
          </div>
          <div className="trust-score-track" style={{ height: '8px' }}>
            <div
              className="trust-score-fill"
              style={{ width: `${Math.min(profile.trust_score, 100)}%` }}
            />
          </div>
        </div>

        {/* Contact Button */}
        <div className="mb-16 text-center">
          <button
            onClick={() => setShowContactModal(true)}
            className="btn-contact text-lg px-8 py-4"
          >
            📩 Связаться с игроком
          </button>
        </div>

        {/* Recent Matches */}
        <div>
          <h2 className="text-3xl font-black mb-8 flex items-center gap-3">
            Последние верифицированные матчи
            {last5Matches.length > 0 && (
              <span className="text-lg bg-[#AAFF0015] text-[#AAFF00] px-4 py-2 rounded-lg font-bold">
                {approvedMatches.length}
              </span>
            )}
          </h2>

          {last5Matches.length === 0 ? (
            <div className="card text-center py-16">
              <p className="text-[#888888] text-lg">Пока нет верифицированных матчей</p>
            </div>
          ) : (
            <div className="space-y-4">
              {last5Matches.map((match, i) => (
                <div
                  key={match.id}
                  className="card-stagger card bg-[#111111]"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <div className="grid grid-cols-12 gap-6 items-center">
                    <div className="col-span-4">
                      <p className="text-xs text-[#888888] uppercase tracking-widest font-medium mb-2">
                        {new Date(match.played_at).toLocaleDateString('ru-RU', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                      <p className="text-lg font-bold text-white">vs {match.opponent_team}</p>
                    </div>

                    <div className="col-span-4 text-center">
                      <p className="text-3xl font-black text-white">
                        {match.score_us}:{match.score_them}
                      </p>
                      <p className="text-sm text-[#888888] mt-1">
                        {match.goals}G + {match.assists}A • {match.minutes_played}мин
                      </p>
                    </div>

                    <div className="col-span-4 flex justify-end items-center gap-4">
                      <span className="tag-verified">✓ Верифицирован</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CTA Section */}
        <div className="mt-20 card-elevated p-12 text-center rounded-3xl">
          <h3 className="text-3xl font-black mb-4 text-white">Хочешь такой же профиль?</h3>
          <p className="text-lg text-[#888888] mb-8 max-w-xl mx-auto">
            Зарегистрируйся на Proov прямо сейчас и начни верифицировать свои матчи.
          </p>
          <Link href="/register" className="btn-primary text-lg inline-block">
            Создать профиль
          </Link>
        </div>
      </main>

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#161616] border border-[#222] rounded-3xl max-w-md w-full p-8 relative">
            <button
              onClick={() => setShowContactModal(false)}
              className="absolute top-4 right-4 text-[#888888] hover:text-white text-2xl"
            >
              ×
            </button>

            <h2 className="text-2xl font-black mb-6 text-white">Написать игроку</h2>

            {contactSuccess ? (
              <div className="text-center">
                <div className="text-4xl mb-4">✓</div>
                <p className="text-[#AAFF00] font-bold mb-2">Сообщение отправлено!</p>
                <p className="text-[#888888] text-sm">Игрок получит уведомление.</p>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-[#AAFF00] mb-2 uppercase tracking-widest">
                    Твоё имя / организация *
                  </label>
                  <input
                    type="text"
                    required
                    value={contactForm.scout_name}
                    onChange={(e) => setContactForm(prev => ({ ...prev, scout_name: e.target.value }))}
                    className="input-field w-full"
                    placeholder="Иван Петров / ФК Спартак"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#AAFF00] mb-2 uppercase tracking-widest">
                    Твой email *
                  </label>
                  <input
                    type="email"
                    required
                    value={contactForm.scout_email}
                    onChange={(e) => setContactForm(prev => ({ ...prev, scout_email: e.target.value }))}
                    className="input-field w-full"
                    placeholder="ivan@sparta.ru"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#AAFF00] mb-2 uppercase tracking-widest">
                    Сообщение *
                  </label>
                  <textarea
                    required
                    minLength={50}
                    value={contactForm.message}
                    onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                    className="input-field w-full h-32 resize-none"
                    placeholder="Расскажите о себе и предложении для игрока..."
                  />
                  <p className="text-xs text-[#888888] mt-1">
                    Минимум 50 символов ({contactForm.message.length}/50)
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={contactLoading}
                  className="btn-primary w-full text-lg py-4 disabled:opacity-50"
                >
                  {contactLoading ? 'Отправка...' : 'Отправить'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
