'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'

interface Profile {
  id: string
  full_name: string
  position: string
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

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [trustScoreWidth, setTrustScoreWidth] = useState(0)

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
        .eq('player_id', user.id)
        .order('played_at', { ascending: false })

      setMatches(matchesData || [])
      setLoading(false)

      // Animate trust score
      setTimeout(() => {
        setTrustScoreWidth(Math.min(profileData.trust_score, 100))
      }, 300)
    }

    fetchData()
  }, [user])

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

  return (
    <div className="min-h-screen bg-[#080808] page-enter">
      {/* Header */}
      <header className="header-base h-20 flex items-center px-8 border-b border-[#1A1A1A]">
        <div className="flex-1">
          <h1 className="text-2xl font-black text-[#AAFF00]">Proov</h1>
        </div>
        <div className="flex gap-3 items-center">
          <Link href="/scout" className="btn-secondary text-sm">
            🔍 Поиск
          </Link>
          <Link href="/submit-match" className="btn-primary text-sm">
            + Добавить матч
          </Link>
          <button
            onClick={async () => {
              await supabase.auth.signOut()
              window.location.href = '/login'
            }}
            className="btn-secondary text-sm"
          >
            Выход
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-12">
        {/* Profile Card with Gradient Border */}
        <div className="relative mb-12 card-stagger card-elevated p-8 border-2" style={{
          borderImage: 'linear-gradient(135deg, rgba(170, 255, 0, 0.6), rgba(170, 255, 0, 0.1), transparent) 1'
        }}>
          {profile.is_founder_verified && (
            <div className="flex gap-2 mb-4">
              <span className="tag-verified">⭐ Founder Verified</span>
            </div>
          )}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h2 className="text-4xl font-black mb-2 text-white uppercase tracking-tight">
                {profile.full_name}
              </h2>
              <p className="text-lg text-[#888888] font-medium">
                {profile.position} • {profile.city}, {profile.country}
              </p>
            </div>
            <div className="text-right">
              <div className="text-6xl font-black text-[#AAFF00] count-up">{rating}</div>
              <p className="text-sm text-[#888888] uppercase tracking-widest font-medium mt-2">Рейтинг</p>
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
