'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface PendingMatch {
  id: string
  player_id: string
  opponent_team: string
  score_us: number
  score_them: number
  goals: number
  assists: number
  minutes_played: number
  played_at: string
  photo_url?: string
  player_name?: string
  admin_note?: string
}

export default function AdminPage() {
  const [user, setUser] = useState<any>(null)
  const [pendingMatches, setPendingMatches] = useState<PendingMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const loadUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) {
        window.location.href = '/login'
        return
      }
      setUser(user)
    }
    loadUser()
  }, [])

  useEffect(() => {
    const loadPendingMatches = async () => {
      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select('*')
        .eq('status', 'pending')
        .order('played_at', { ascending: false })

      if (matchesError) {
        console.error('Failed to load pending matches', matchesError)
        setLoading(false)
        return
      }

      const playerIds = Array.from(new Set(matchesData?.map(match => match.player_id) || []))
      const { data: playersData } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', playerIds)

      const playersMap = new Map(playersData?.map(player => [player.id, player.full_name]) || [])
      setPendingMatches((matchesData || []).map(match => ({
        ...match,
        player_name: playersMap.get(match.player_id) || 'Игрок'
      })))
      setLoading(false)
    }

    if (user) {
      loadPendingMatches()
    }
  }, [user])

  const handleApprove = async (match: PendingMatch) => {
    setActionLoading(true)
    try {
      const { error: updateError } = await supabase
        .from('matches')
        .update({ status: 'approved' })
        .eq('id', match.id)

      if (updateError) throw updateError

      const { data: profileData } = await supabase
        .from('profiles')
        .select('trust_score')
        .eq('id', match.player_id)
        .single()

      if (profileData) {
        await supabase
          .from('profiles')
          .update({ trust_score: profileData.trust_score + 20 })
          .eq('id', match.player_id)
      }

      await supabase.from('notifications').insert({
        player_id: match.player_id,
        type: 'match_approved',
        title: 'Матч верифицирован ✓',
        message: `Твой матч против ${match.opponent_team} одобрен. Trust Score +20!`
      })

      setPendingMatches(prev => prev.filter(item => item.id !== match.id))
    } catch (error) {
      console.error('Approve match error:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async (match: PendingMatch) => {
    setActionLoading(true)
    try {
      const { error: updateError } = await supabase
        .from('matches')
        .update({ status: 'rejected' })
        .eq('id', match.id)

      if (updateError) throw updateError

      const adminNote = match.admin_note ? ` ${match.admin_note}` : ''
      await supabase.from('notifications').insert({
        player_id: match.player_id,
        type: 'match_rejected',
        title: 'Матч отклонён',
        message: `Матч против ${match.opponent_team} отклонён.${adminNote}`
      })

      setPendingMatches(prev => prev.filter(item => item.id !== match.id))
    } catch (error) {
      console.error('Reject match error:', error)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#AAFF0033] border-t-[#AAFF00] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#888888]">Загрузка админки...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#080808] has-mobile-nav page-enter text-white">
      <header className="header-base h-20 flex items-center px-4 md:px-8 border-b border-[#1A1A1A]">
        <div>
          <h1 className="text-2xl font-black text-[#AAFF00]">Admin</h1>
        </div>
        <div className="flex-1" />
        <Link href="/dashboard" className="btn-secondary text-sm flex items-center gap-2">
          <span className="md:hidden">←</span>
          <span className="hidden md:inline">Вернуться на профиль</span>
        </Link>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-12 space-y-8">
        <section className="bg-[#111111] border border-[#1A1A1A] rounded-2xl p-4 md:p-6 lg:p-8">
          <h2 className="text-3xl font-black text-white mb-4">Заявки на матчи</h2>
          <p className="text-sm text-[#888888] mb-6">Одобряй или отклоняй заявки игроков.</p>

          {pendingMatches.length === 0 ? (
            <div className="rounded-2xl border border-[#222] bg-[#0F0F0F] p-6 md:p-8 text-center text-[#888888]">
              Нет ожидающих матчей.
            </div>
          ) : (
            <div className="space-y-4">
              {pendingMatches.map(match => (
                <div key={match.id} className="rounded-2xl border border-[#222] bg-[#0F0F0F] p-4 md:p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <div className="text-sm text-[#888888] mb-2">Игрок: {match.player_name}</div>
                      <div className="text-xl font-bold text-white mb-1">{match.opponent_team}</div>
                      <div className="text-sm text-[#888888]">{match.goals} гол(ов), {match.assists} пас(ов), {match.minutes_played} мин.</div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => handleApprove(match)}
                        disabled={actionLoading}
                        className="btn-primary px-5 py-3"
                      >
                        Одобрить
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReject(match)}
                        disabled={actionLoading}
                        className="btn-secondary px-5 py-3"
                      >
                        Отклонить
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
