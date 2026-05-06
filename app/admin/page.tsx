'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

const ADMIN_EMAIL = 'erikagi@yandex.ru'

interface Profile {
  id: string
  full_name: string
  position: string
  city: string
  country: string
  trust_score: number
}

interface Match {
  id: string
  player_id: string
  opponent_team: string
  score_us: number
  score_them: number
  goals: number
  assists: number
  minutes_played: number
  status: string
  played_at: string
  created_at: string
}

export default function Admin() {
  const [user, setUser] = useState<any>(null)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending')
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || user.email !== ADMIN_EMAIL) {
        router.push('/dashboard')
        return
      }
      setUser(user)

      const [profilesRes, matchesRes] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('matches').select('*').order('created_at', { ascending: false })
      ])

      if (profilesRes.data) setProfiles(profilesRes.data)
      if (matchesRes.data) setMatches(matchesRes.data)
      setLoading(false)
    }

    checkAuth()
  }, [router])

  const handleApprove = async (matchId: string) => {
    const { error } = await supabase
      .from('matches')
      .update({ status: 'approved' })
      .eq('id', matchId)

    if (!error) {
      setMatches(matches.map(m => m.id === matchId ? { ...m, status: 'approved' } : m))
    }
  }

  const handleReject = async (matchId: string) => {
    const { error } = await supabase
      .from('matches')
      .update({ status: 'rejected' })
      .eq('id', matchId)

    if (!error) {
      setMatches(matches.map(m => m.id === matchId ? { ...m, status: 'rejected' } : m))
    }
  }

  const getProfileName = (id: string) => {
    const profile = profiles.find(p => p.id === id)
    return profile?.full_name || 'Unknown'
  }

  const filteredMatches = matches.filter(m => m.status === activeTab)

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#AAFF0033] border-t-[#AAFF00] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#888888]">Загрузка админ-панели...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#080808] page-enter">
      {/* Header */}
      <header className="header-base h-20 flex items-center px-8 border-b border-[#1A1A1A]">
        <h1 className="text-2xl font-black text-[#AAFF00]">Admin</h1>
        <div className="flex-1" />
        <div className="flex gap-3 items-center">
          <Link href="/dashboard" className="btn-secondary text-sm">
            Dashboard
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
        {/* Tabs */}
        <div className="flex gap-4 mb-12 border-b border-[#222222] pb-4">
          {(['pending', 'approved', 'rejected'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 font-bold uppercase tracking-widest rounded-lg transition-all ${
                activeTab === tab
                  ? 'bg-[#AAFF00] text-black'
                  : 'text-[#888888] hover:text-[#AAFF00]'
              }`}
            >
              {tab === 'pending' && `На проверке (${matches.filter(m => m.status === 'pending').length})`}
              {tab === 'approved' && `Одобрено (${matches.filter(m => m.status === 'approved').length})`}
              {tab === 'rejected' && `Отклонено (${matches.filter(m => m.status === 'rejected').length})`}
            </button>
          ))}
        </div>

        {/* Matches List */}
        {filteredMatches.length === 0 ? (
          <div className="card text-center py-16">
            <p className="text-[#888888] text-lg">
              {activeTab === 'pending' && 'Нет матчей на проверке'}
              {activeTab === 'approved' && 'Нет одобренных матчей'}
              {activeTab === 'rejected' && 'Нет отклоненных матчей'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMatches.map((match, i) => (
              <div
                key={match.id}
                className="card-stagger card bg-[#111111] p-6 hover:bg-[#161616] transition-colors"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="grid grid-cols-12 gap-6 items-center">
                  {/* Player Info */}
                  <div className="col-span-3">
                    <p className="text-xs text-[#888888] uppercase tracking-widest font-medium mb-1">Игрок</p>
                    <p className="text-lg font-bold text-white">{getProfileName(match.player_id)}</p>
                    <p className="text-sm text-[#888888]">
                      {new Date(match.played_at).toLocaleDateString('ru-RU')}
                    </p>
                  </div>

                  {/* Match Info */}
                  <div className="col-span-3">
                    <p className="text-xs text-[#888888] uppercase tracking-widest font-medium mb-1">Матч</p>
                    <p className="text-lg font-bold text-white">
                      {match.score_us}:{match.score_them} vs {match.opponent_team}
                    </p>
                    <p className="text-sm text-[#888888]">
                      {match.goals}G + {match.assists}A, {match.minutes_played} мин
                    </p>
                  </div>

                  {/* Status Badge */}
                  <div className="col-span-2 flex justify-center">
                    {activeTab === 'pending' && <span className="tag-pending">⏳ На проверке</span>}
                    {activeTab === 'approved' && <span className="tag-verified">✓ Одобрено</span>}
                    {activeTab === 'rejected' && <span className="tag-rejected">✗ Отклонено</span>}
                  </div>

                  {/* Actions */}
                  {activeTab === 'pending' && (
                    <div className="col-span-4 flex gap-2 justify-end">
                      <button
                        onClick={() => handleApprove(match.id)}
                        className="btn-primary text-sm px-4 py-2"
                      >
                        Одобрить
                      </button>
                      <button
                        onClick={() => handleReject(match.id)}
                        className="btn-secondary text-sm px-4 py-2 border-[#FF3333] hover:text-[#FF3333]"
                      >
                        Отклонить
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
