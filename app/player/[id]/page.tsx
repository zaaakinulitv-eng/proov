'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
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

export default function PlayerProfile() {
  const params = useParams()
  const userId = params.id as string

  const [profile, setProfile] = useState<Profile | null>(null)
  const [matches, setMatches] = useState<Match[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

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

      // Fetch profile
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

      // Fetch matches
      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select('*')
        .eq('player_id', userId)
        .order('played_at', { ascending: false })

      if (matchesError) {
        setMatches([])
      } else {
        setMatches(matchesData || [])
      }

      setLoading(false)
    }

    fetchData()
  }, [userId])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-xl">Загрузка...</div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-xl">Игрок не найден</div>
      </div>
    )
  }

  // Calculate stats from approved matches only
  const approvedMatches = matches.filter(m => m.status === 'approved')
  const totalMatches = approvedMatches.length
  const totalGoals = approvedMatches.reduce((sum, m) => sum + m.goals, 0)
  const totalAssists = approvedMatches.reduce((sum, m) => sum + m.assists, 0)
  const totalMinutes = approvedMatches.reduce((sum, m) => sum + m.minutes_played, 0)

  // Last 5 matches
  const last5Matches = matches.slice(0, 5)

  const avatarLetter = profile?.full_name.charAt(0).toUpperCase()

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="flex justify-between items-center p-6 border-b border-gray-800">
        <Link href="/" className="text-2xl font-bold text-[#22c55e]">
          Proov
        </Link>
        {!user && (
          <Link
            href="/login"
            className="bg-[#22c55e] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#16a34a] transition-colors"
          >
            Войти
          </Link>
        )}
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-[#22c55e] rounded-full flex items-center justify-center text-3xl font-bold text-black">
              {avatarLetter}
            </div>
          </div>
          {profile.is_founder_verified && (
            <div className="flex justify-center mb-4">
              <span className="bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                ⭐ Founder Verified
              </span>
            </div>
          )}
          <h1 className="text-3xl font-bold mb-2">{profile.full_name}</h1>
          <p className="text-gray-400 mb-6">
            {profile.position} • {profile.city}, {profile.country}
          </p>
          <div className="max-w-xs mx-auto">
            <div className="text-sm text-gray-400 mb-2">Trust Score</div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-[#22c55e] h-2 rounded-full"
                style={{ width: `${Math.min(profile.trust_score, 100)}%` }}
              ></div>
            </div>
            <div className="text-sm mt-1">{profile.trust_score}/100</div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="bg-gray-800 p-6 rounded-lg text-center">
            <div className="text-2xl font-bold text-[#22c55e]">{totalMatches}</div>
            <div className="text-sm text-gray-400">Верифицированных матчей</div>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg text-center">
            <div className="text-2xl font-bold text-[#22c55e]">{totalGoals}</div>
            <div className="text-sm text-gray-400">Голов</div>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg text-center">
            <div className="text-2xl font-bold text-[#22c55e]">{totalAssists}</div>
            <div className="text-sm text-gray-400">Передач</div>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg text-center">
            <div className="text-2xl font-bold text-[#22c55e]">{totalMinutes}</div>
            <div className="text-sm text-gray-400">Минут</div>
          </div>
        </div>

        {/* Progress Chart (Last 5 Matches) */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Последние матчи</h2>
          <div className="space-y-4">
            {last5Matches.map((match) => (
              <div key={match.id} className="bg-gray-800 p-4 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-medium">{new Date(match.played_at).toLocaleDateString('ru-RU')}</div>
                    <div className="text-gray-400">vs {match.opponent_team}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold">{match.score_us}:{match.score_them}</div>
                    <div className="text-sm text-gray-400">
                      {match.goals}G + {match.assists}A
                    </div>
                  </div>
                </div>
                <div className={`text-sm ${match.status === 'approved' ? 'text-[#22c55e]' : 'text-gray-400'}`}>
                  {match.status === 'approved' ? '✓ Верифицирован' : '⏳ На проверке'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gray-800 p-8 rounded-lg text-center">
          <h3 className="text-xl font-bold mb-4">Хочешь такой же профиль?</h3>
          <p className="text-gray-400 mb-6">Зарегистрируйся на Proov бесплатно</p>
          <Link
            href="/register"
            className="bg-[#22c55e] text-black px-6 py-3 rounded-lg font-medium hover:bg-[#16a34a] transition-colors inline-block"
          >
            Создать профиль
          </Link>
        </div>
      </div>
    </div>
  )
}