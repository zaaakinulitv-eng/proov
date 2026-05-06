'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'

interface Profile {
  id: string
  full_name: string
  club?: string
  city: string
  country: string
  avatar_url?: string
  positions?: string[]
  birth_year?: number
  birth_date?: string
  height?: number
  strong_foot?: string
  nationality?: string
  trust_score: number
  is_founder_verified: boolean
  onboarding_completed?: boolean
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

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [trustScoreWidth, setTrustScoreWidth] = useState(0)
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notificationsLoading, setNotificationsLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) {
        window.location.href = '/login'
        return
      }
      setUser(user)
    }
    getUser()
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (profileError || !profileData) {
        router.push('/onboarding')
        return
      }

      setProfile(profileData)

      const { data: matchesData } = await supabase
        .from('matches')
        .select('*')
        .eq('player_id', user.id)
        .order('created_at', { ascending: false })

      setMatches(matchesData || [])
      setLoading(false)

      // Animate trust score
      setTimeout(() => {
        setTrustScoreWidth(Math.min(profileData.trust_score, 100))
      }, 300)
    }

    fetchData()
  }, [user, router])

  useEffect(() => {
    if (!user) return

    const fetchNotifications = async () => {
      const { data: notificationsData, error: notificationsError } = await supabase
        .from('notifications')
        .select('*')
        .eq('player_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (!notificationsError) {
        setNotifications(notificationsData || [])
      }

      const { count } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('player_id', user.id)
        .eq('is_read', false)

      setUnreadCount(count || 0)
      setNotificationsLoading(false)
    }

    fetchNotifications()

    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `player_id=eq.${user.id}`
        },
        payload => {
          setNotifications(prev => [payload.new, ...prev].slice(0, 10))
          setUnreadCount(prev => prev + 1)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  const handleMarkRead = async (notificationId: string) => {
    if (!user) return

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)

    setNotifications(prev => prev.map(item => item.id === notificationId ? { ...item, is_read: true } : item))
    setUnreadCount(prev => Math.max(prev - 1, 0))
  }

  const handleMarkAllRead = async () => {
    if (!user) return

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('player_id', user.id)
      .eq('is_read', false)

    setNotifications(prev => prev.map(item => ({ ...item, is_read: true })))
    setUnreadCount(0)
  }

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center page-enter">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#AAFF0033] border-t-[#AAFF00] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#888888]">Загрузка профиля...</p>
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

  const positionText = profile.positions?.join(' • ') || 'Игрок'

  const avatarLetter = profile.full_name.charAt(0).toUpperCase()

  // Check if banner should show
  const filledFields = [
    profile.club,
    profile.birth_date,
    profile.nationality,
    profile.height,
    profile.strong_foot
  ].filter(Boolean).length
  
  const showOnboardingBanner = !profile.onboarding_completed || (approvedMatches.length === 0 && filledFields < 4)

  return (
    <div className="min-h-screen bg-[#080808] has-mobile-nav page-enter">
      {/* Header */}
      <header className="header-base h-20 flex items-center px-4 md:px-8 border-b border-[#1A1A1A]">
        <div className="flex-1">
          <h1 className="text-2xl font-black text-[#AAFF00]">Proov</h1>
        </div>
        <div className="flex gap-2 md:gap-3 items-center">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications(prev => !prev)}
              className="btn-secondary text-sm relative flex items-center gap-2"
            >
              <span>🔔</span>
              <span className="hidden md:inline">Уведомления</span>
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 inline-flex items-center justify-center rounded-full bg-[#FF3333] px-2 text-[10px] font-black text-white">
                  {unreadCount}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-3 w-[360px] max-w-full rounded-3xl border border-[#222] bg-[#090909] shadow-2xl z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-4 border-b border-[#1A1A1A]">
                  <div>
                    <p className="text-sm font-bold text-white">Уведомления</p>
                    <p className="text-xs text-[#888888]">Последние 10</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="text-xs text-[#AAFF00]"
                  >
                    Прочитать все
                  </button>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notificationsLoading ? (
                    <div className="p-6 text-center text-[#888888]">Загрузка...</div>
                  ) : notifications.length === 0 ? (
                    <div className="p-6 text-center text-[#888888]">Нет уведомлений</div>
                  ) : (
                    notifications.map(notification => (
                      <button
                        key={notification.id}
                        type="button"
                        onClick={() => handleMarkRead(notification.id)}
                        className={`w-full text-left px-4 py-4 border-b border-[#111] transition-colors ${notification.is_read ? 'bg-[#090909]' : 'bg-[#111111]'}`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-bold text-white">{notification.title}</p>
                            <p className="text-sm text-[#888888] mt-1">{notification.message}</p>
                          </div>
                          <span className="text-[11px] text-[#666666]">
                            {new Date(notification.created_at).toLocaleString('ru-RU', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          <Link href="/scout" className="btn-secondary text-sm flex items-center gap-2">
            <span>🔍</span>
            <span className="hidden md:inline">Поиск</span>
          </Link>
          <Link href="/submit-match" className="btn-primary text-sm flex items-center gap-2">
            <span>+</span>
            <span className="hidden md:inline">Добавить</span>
          </Link>
          <button
            onClick={async () => {
              await supabase.auth.signOut()
              window.location.href = '/login'
            }}
            className="btn-secondary text-sm flex items-center gap-2"
          >
            <span>⏏</span>
            <span className="hidden md:inline">Выход</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl w-full mx-auto px-4 md:px-8 py-6 md:py-12">
        {/* Onboarding Banner */}
        {showOnboardingBanner && (
          <div className="mb-8 bg-[#AAFF00] rounded-2xl px-6 py-4 flex items-center justify-between">
            <div>
              <p className="text-black font-bold text-lg">Заверши настройку профиля</p>
              <p className="text-black/70 text-sm">Заполни все данные и добавь свой первый матч</p>
            </div>
            <Link href="/onboarding" className="btn-primary bg-black text-[#AAFF00] hover:bg-[#1A1A1A] px-6 py-2 whitespace-nowrap">
              Продолжить →
            </Link>
          </div>
        )}
        {/* Profile Card with Gradient Border */}
        <div className="relative mb-12 card-stagger card-elevated p-8 border-2" style={{
          borderImage: 'linear-gradient(135deg, rgba(170, 255, 0, 0.6), rgba(170, 255, 0, 0.1), transparent) 1'
        }}>
          {profile.is_founder_verified && (
            <div className="flex gap-2 mb-4">
              <span className="tag-verified">⭐ Founder Verified</span>
            </div>
          )}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#AAFF00] to-[#66FF00] flex items-center justify-center text-3xl font-black text-black">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  avatarLetter
                )}
              </div>
              <div>
                <h2 className="text-4xl font-black mb-2 text-white uppercase tracking-tight">
                  {profile.full_name}
                </h2>
                <p className="text-lg text-[#888888] font-medium">
                  {positionText} • {profile.city}, {profile.country}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/profile/edit" className="btn-secondary text-sm px-4 py-2 flex items-center gap-2">
                ✏️ Редактировать профиль
              </Link>
              <div className="text-right">
                <div className="text-6xl font-black text-[#AAFF00] count-up">{rating}</div>
                <p className="text-sm text-[#888888] uppercase tracking-widest font-medium mt-2">Рейтинг</p>
              </div>
            </div>
          </div>

          {/* Trust Score Bar */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium text-[#AAFF00] uppercase">Trust Score</span>
              <span className="text-sm text-[#888888]">{profile.trust_score}/100</span>
            </div>
            <div className="trust-score-track">
              <div
                className="trust-score-fill"
                style={{ width: `${trustScoreWidth}%` }}
              />
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {[
            { num: totalMatches, label: 'Матчей' },
            { num: totalGoals, label: 'Голов' },
            { num: totalAssists, label: 'Передач' },
            { num: totalMinutes, label: 'Минут' }
          ].map((stat, i) => (
            <div key={i} className="card-stagger stat-block">
              <div className="stat-number count-up">{stat.num}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Advanced Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            { num: goalsPerMatch, label: 'Голов за матч', icon: '⚽' },
            { num: assistsPerMatch, label: 'Передач за матч', icon: '🎯' },
            { num: averageMinutes, label: 'Минут за матч', icon: '⏱' }
          ].map((stat, i) => (
            <div key={i} className="card-stagger card bg-[#111111]">
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl">{stat.icon}</span>
                <div className="text-right">
                  <div className="text-3xl font-black text-[#AAFF00]">{stat.num}</div>
                </div>
              </div>
              <p className="text-sm text-[#888888] uppercase tracking-widest">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Recent Matches */}
        <div>
          <h3 className="text-2xl font-black mb-6 flex items-center gap-3">
            <span>Последние матчи</span>
            {matches.length > 0 && (
              <span className="text-sm bg-[#AAFF0015] text-[#AAFF00] px-3 py-1 rounded-full font-medium">
                {matches.length}
              </span>
            )}
          </h3>

          {matches.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-[#888888] mb-6">Нет матчей</p>
              <Link href="/submit-match" className="btn-primary inline-block">
                Добавить первый матч
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {matches.slice(0, 5).map((match, i) => (
                <div key={match.id} className="card-stagger card bg-[#111111]" style={{ animationDelay: `${0.3 + i * 0.05}s` }}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#AAFF00]">
                        {new Date(match.played_at).toLocaleDateString('ru-RU', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                      <p className="text-lg font-bold text-white">vs {match.opponent_team}</p>
                    </div>
                    <div className="text-right mr-6">
                      <p className="text-2xl font-black text-white">
                        {match.score_us}:{match.score_them}
                      </p>
                      <p className="text-sm text-[#888888]">
                        {match.goals}G + {match.assists}A
                      </p>
                    </div>
                    <div>
                      {match.status === 'approved' ? (
                        <span className="tag-verified">✓ OK</span>
                      ) : (
                        <span className="tag-pending">⏳ На проверке</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
