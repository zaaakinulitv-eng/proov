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
  photo_url?: string
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)

  const router = useRouter()

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

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('Error fetching profile:', profileError)
        // Profile not found, set to null
        setProfile(null)
      } else {
        setProfile(profileData)
      }

      // Fetch matches
      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select('*')
        .eq('player_id', user.id)
        .order('played_at', { ascending: false })

      if (matchesError) {
        setMatches([])
      } else {
        setMatches(matchesData || [])
      }

      setLoading(false)
    }

    if (user) fetchData()
  }, [user])

  const shareProfile = () => {
    if (user) {
      const url = window.location.origin + '/player/' + user.id
      navigator.clipboard.writeText(url)
      alert('Ссылка скопирована в буфер обмена!')
    }
  }

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
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Профиль не найден</h1>
          <p className="text-gray-400 mb-6">Создайте свой профиль чтобы начать</p>
          <Link
            href="/register"
            className="bg-[#22c55e] text-black px-6 py-3 rounded-lg font-medium hover:bg-[#16a34a] transition-colors inline-block"
          >
            Создать профиль
          </Link>
        </div>
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
      {/* Desktop Navigation */}
      <nav className="hidden lg:flex fixed left-0 top-0 h-full w-64 bg-gray-900 p-6 flex-col">
        <div className="text-2xl font-bold text-[#22c55e] mb-8">Proov</div>
        <div className="space-y-4">
          <Link href="/dashboard" className="block text-[#22c55e] font-medium">Дашборд</Link>
          <Link href="/submit-match" className="block text-gray-400 hover:text-white">Добавить матч</Link>
          {user?.email === 'admin@proov.com' && (
            <Link href="/admin" className="block text-gray-400 hover:text-white">Админ</Link>
          )}
        </div>
        <div className="mt-auto">
          <button
            onClick={async () => { await supabase.auth.signOut(); router.push('/login') }}
            className="text-gray-400 hover:text-white"
          >
            Выйти
          </button>
        </div>
      </nav>

      {/* Mobile Header */}
      <header className="lg:hidden flex justify-between items-center p-6 bg-gray-900">
        <div className="text-2xl font-bold text-[#22c55e]">Proov</div>
        <button
          onClick={() => supabase.auth.signOut()}
          className="text-gray-400 hover:text-white"
        >
          Выйти
        </button>
      </header>

      <div className="lg:ml-64 p-6">
        {/* Hero Section */}
        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6 mb-8">
          <div className="w-16 h-16 bg-[#22c55e] rounded-full flex items-center justify-center text-xl font-bold text-black">
            {avatarLetter}
          </div>
          <div className="text-center lg:text-left">
            <h1 className="text-2xl font-bold mb-2">Привет, {profile.full_name}!</h1>
            <p className="text-gray-400">{profile.position} • {profile.city}, {profile.country}</p>
            {profile.is_founder_verified && (
              <span className="bg-yellow-500 text-black px-2 py-1 rounded text-sm font-medium mt-2 inline-block">
                ⭐ Founder Verified
              </span>
            )}
          </div>
          <div className="lg:ml-auto">
            <button
              onClick={shareProfile}
              className="bg-[#22c55e] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#16a34a] transition-colors"
            >
              Поделиться профилем
            </button>
          </div>
        </div>

        {/* Trust Score */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-400">Trust Score</span>
            <span className="text-sm">{profile.trust_score}/100</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-[#22c55e] h-2 rounded-full"
              style={{ width: `${Math.min(profile.trust_score, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-[#22c55e]">{totalMatches}</div>
            <div className="text-sm text-gray-400">Верифицированных матчей</div>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-[#22c55e]">{totalGoals}</div>
            <div className="text-sm text-gray-400">Голов</div>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-[#22c55e]">{totalAssists}</div>
            <div className="text-sm text-gray-400">Передач</div>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-[#22c55e]">{totalMinutes}</div>
            <div className="text-sm text-gray-400">Минут</div>
          </div>
        </div>

        {/* Recent Matches */}
        <div>
          <h2 className="text-xl font-bold mb-4">Последние матчи</h2>
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
      </div>
    </div>
  )
}