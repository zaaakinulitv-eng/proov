'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const ADMIN_EMAIL = 'erikagi@yandex.ru' // Замени на свой email

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
  yellow_cards: number
  red_cards: number
  minutes_played: number
  photo_url: string | null
  status: string
  admin_note: string | null
  played_at: string
  created_at: string
}

export default function Admin() {
  const [user, setUser] = useState<any>(null)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending')
  const [loading, setLoading] = useState(true)
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || user.email !== ADMIN_EMAIL) {
        router.push('/dashboard')
        return
      }
      setUser(user)

      // Fetch data
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

  const getProfile = (playerId: string) => {
    return profiles.find(p => p.id === playerId)
  }

  const handleApprove = async (match: Match, comment: string = '') => {
    const profile = getProfile(match.player_id)
    if (!profile) return

    await Promise.all([
      supabase.from('matches').update({ status: 'approved', admin_note: comment }).eq('id', match.id),
      supabase.from('profiles').update({ trust_score: profile.trust_score + 20 }).eq('id', profile.id)
    ])

    setMatches(prev => prev.map(m => m.id === match.id ? { ...m, status: 'approved', admin_note: comment } : m))
  }

  const handleReject = async (match: Match, comment: string) => {
    await supabase.from('matches').update({ status: 'rejected', admin_note: comment }).eq('id', match.id)
    setMatches(prev => prev.map(m => m.id === match.id ? { ...m, status: 'rejected', admin_note: comment } : m))
  }

  const filteredMatches = matches.filter(m => m.status === activeTab)
  const pendingCount = matches.filter(m => m.status === 'pending').length

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
      Загрузка...
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-[#22c55e]">Proov Admin</h1>
          <div className="text-gray-400">На проверке: {pendingCount}</div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-8 mb-8 border-b border-gray-700">
          {[
            { key: 'pending', label: 'На проверке' },
            { key: 'approved', label: 'Одобрены' },
            { key: 'rejected', label: 'Отклонены' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`pb-2 px-1 ${
                activeTab === tab.key
                  ? 'text-[#22c55e] border-b-2 border-[#22c55e]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Matches List */}
        <div className="space-y-6">
          {filteredMatches.length === 0 ? (
            <p className="text-gray-400 text-center py-12">Нет матчей в этой категории</p>
          ) : (
            filteredMatches.map(match => {
              const profile = getProfile(match.player_id)
              if (!profile) return null

              return (
                <div key={match.id} className="bg-gray-900 rounded-lg p-6">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold">{profile.full_name}</h3>
                      <p className="text-gray-400 text-sm">{profile.position} • {profile.city}, {profile.country}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-400">
                        {new Date(match.played_at).toLocaleDateString('ru-RU')}
                      </div>
                    </div>
                  </div>

                  {/* Match Info */}
                  <div className="mb-4">
                    <div className="text-xl font-bold mb-2">
                      vs {match.opponent_team} {match.score_us}:{match.score_them}
                    </div>
                    <div className="flex space-x-6 text-sm text-gray-400">
                      <span>Голы: {match.goals}</span>
                      <span>Передачи: {match.assists}</span>
                      <span>Минуты: {match.minutes_played}</span>
                      <span>ЖК: {match.yellow_cards}</span>
                      {match.red_cards > 0 && <span>КК: {match.red_cards}</span>}
                    </div>
                  </div>

                  {/* Photo */}
                  <div className="mb-4">
                    {match.photo_url ? (
                      <img
                        src={match.photo_url}
                        alt="Match photo"
                        className="max-h-48 rounded cursor-pointer"
                        onClick={() => setSelectedPhoto(match.photo_url)}
                      />
                    ) : (
                      <div className="bg-gray-700 h-32 rounded flex items-center justify-center text-gray-400">
                        Фото не загружено
                      </div>
                    )}
                  </div>

                  {/* Actions - only for pending */}
                  {activeTab === 'pending' && (
                    <div className="space-y-4">
                      <textarea
                        placeholder="Комментарий для игрока (необязательно)"
                        className="w-full p-3 bg-gray-800 text-white rounded border border-gray-700 focus:border-[#22c55e] focus:outline-none"
                        id={`comment-${match.id}`}
                      />
                      <div className="flex space-x-4">
                        <button
                          onClick={() => handleApprove(match, (document.getElementById(`comment-${match.id}`) as HTMLTextAreaElement)?.value || '')}
                          className="flex-1 bg-[#22c55e] text-black font-bold py-3 rounded hover:bg-[#1ea34a]"
                        >
                          ✓ Одобрить
                        </button>
                        <button
                          onClick={() => handleReject(match, (document.getElementById(`comment-${match.id}`) as HTMLTextAreaElement)?.value || '')}
                          className="flex-1 bg-red-600 text-white font-bold py-3 rounded hover:bg-red-700"
                        >
                          ✗ Отклонить
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Admin Note - for approved/rejected */}
                  {match.admin_note && (
                    <div className="mt-4 p-3 bg-gray-800 rounded">
                      <div className="text-sm text-gray-400 mb-1">Комментарий админа:</div>
                      <div className="text-sm">{match.admin_note}</div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Photo Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={() => setSelectedPhoto(null)}>
          <img src={selectedPhoto} alt="Full size" className="max-w-full max-h-full" />
        </div>
      )}
    </div>
  )
}