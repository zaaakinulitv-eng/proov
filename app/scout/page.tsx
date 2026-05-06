'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { shortPosition } from '../lib/position-utils'

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
  player_id: string
  goals: number
  assists: number
  status: string
}

interface PlayerStats extends Profile {
  matches_count: number
  goals_total: number
  assists_total: number
}

export default function ScoutPage() {
  const [players, setPlayers] = useState<PlayerStats[]>([])
  const [allMatches, setAllMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [totalPlayers, setTotalPlayers] = useState(0)

  // Filters
  const [positionFilter, setPositionFilter] = useState<string>('all')
  const [countryFilter, setCountryFilter] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [minTrustScore, setMinTrustScore] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)

  const itemsPerPage = 12

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all profiles
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('*')
          .order('trust_score', { ascending: false })

        // Fetch all approved matches
        const { data: matchesData } = await supabase
          .from('matches')
          .select('id, player_id, goals, assists, status')
          .eq('status', 'approved')

        if (profilesData && matchesData) {
          setAllMatches(matchesData)

          // Calculate stats and filter players with at least 1 approved match
          const playerStatsMap = new Map<string, { matches: number; goals: number; assists: number }>()

          matchesData.forEach(match => {
            const current = playerStatsMap.get(match.player_id) || { matches: 0, goals: 0, assists: 0 }
            playerStatsMap.set(match.player_id, {
              matches: current.matches + 1,
              goals: current.goals + match.goals,
              assists: current.assists + match.assists
            })
          })

          const playersWithStats: PlayerStats[] = profilesData
            .filter(profile => playerStatsMap.has(profile.id))
            .map(profile => {
              const stats = playerStatsMap.get(profile.id)!
              return {
                ...profile,
                matches_count: stats.matches,
                goals_total: stats.goals,
                assists_total: stats.assists
              }
            })

          setPlayers(playersWithStats)
          setTotalPlayers(playersWithStats.length)
        }
      } catch (error) {
        console.error('Error fetching scout data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Apply filters
  const filteredPlayers = useMemo(() => {
    return players.filter(player => {
      if (positionFilter !== 'all') {
        const candidatePositions = player.positions && player.positions.length > 0
          ? player.positions
          : player.position ? [player.position] : []
        if (!candidatePositions.some(pos => pos === positionFilter)) return false
      }
      if (countryFilter && !player.country.toLowerCase().includes(countryFilter.toLowerCase())) return false
      if (cityFilter && !player.city.toLowerCase().includes(cityFilter.toLowerCase())) return false
      if (player.trust_score < minTrustScore) return false
      return true
    })
  }, [players, positionFilter, countryFilter, cityFilter, minTrustScore])

  // Pagination
  const totalPages = Math.ceil(filteredPlayers.length / itemsPerPage)
  const paginatedPlayers = filteredPlayers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleResetFilters = () => {
    setPositionFilter('all')
    setCountryFilter('')
    setCityFilter('')
    setMinTrustScore(0)
    setCurrentPage(1)
  }

  const positions = [
    'Вратарь (GK)',
    'Правый защитник (RB)',
    'Левый защитник (LB)',
    'Центральный защитник (CB)',
    'Опорный полузащитник (CDM)',
    'Центральный полузащитник (CM)',
    'Атакующий полузащитник (CAM)',
    'Правый вингер (RW)',
    'Левый вингер (LW)',
    'Второй нападающий (CF)',
    'Нападающий (ST)'
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808] has-mobile-nav">
        <header className="header-base h-20 flex items-center px-4 md:px-8 border-b border-[#1A1A1A]">
          <div className="flex-1">
            <h1 className="text-2xl font-black text-[#AAFF00]">Proov</h1>
          </div>
          <Link href="/" className="btn-secondary text-sm flex items-center gap-2">
            <span className="md:hidden">←</span>
            <span className="hidden md:inline">На главную</span>
          </Link>
        </header>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#AAFF0033] border-t-[#AAFF00] rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-[#888888]">Загрузка игроков...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#080808] has-mobile-nav page-enter">
      {/* Header */}
      <header className="header-base h-20 flex items-center px-4 md:px-8 border-b border-[#1A1A1A]">
        <div className="flex-1">
          <h1 className="text-2xl font-black text-[#AAFF00]">Proov</h1>
        </div>
        <Link href="/" className="btn-secondary text-sm flex items-center gap-2">
          <span className="md:hidden">←</span>
          <span className="hidden md:inline">На главную</span>
        </Link>
      </header>

      <main className="max-w-7xl w-full mx-auto px-4 md:px-8 py-6 md:py-12">
        {/* Page Header */}
        <div className="mb-12">
          <h2 className="text-5xl font-black mb-3 text-white">Найти игрока</h2>
          <p className="text-lg text-[#888888] mb-6">База верифицированных футболистов</p>
          <div className="text-2xl font-bold text-[#AAFF00]">
            {totalPlayers} {totalPlayers === 1 ? 'игрок' : totalPlayers < 5 ? 'игрока' : 'игроков'} в базе
          </div>
        </div>

        {/* Filters */}
        <div className="card-elevated mb-12 p-4 md:p-6 lg:p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-6 mb-6">
            {/* Position Filter */}
            <div>
              <label className="block text-sm font-medium text-[#AAFF00] mb-3 uppercase tracking-widest">
                Позиция
              </label>
              <div className="space-y-2">
                {['all', ...positions].map(pos => {
                  const label = pos === 'all' ? 'Все' : pos
                  const isActive = positionFilter === pos
                  return (
                    <button
                      key={pos}
                      onClick={() => {
                        setPositionFilter(pos)
                        setCurrentPage(1)
                      }}
                      className={`w-full px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                        isActive
                          ? 'bg-[#AAFF00] text-black'
                          : 'bg-[#1A1A1A] text-[#888888] hover:border border-[#333333]'
                      }`}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Country Filter */}
            <div>
              <label className="block text-sm font-medium text-[#AAFF00] mb-3 uppercase tracking-widest">
                Страна
              </label>
              <input
                type="text"
                placeholder="Например: Россия"
                value={countryFilter}
                onChange={(e) => {
                  setCountryFilter(e.target.value)
                  setCurrentPage(1)
                }}
                className="input-field w-full"
              />
            </div>

            {/* City Filter */}
            <div>
              <label className="block text-sm font-medium text-[#AAFF00] mb-3 uppercase tracking-widest">
                Город
              </label>
              <input
                type="text"
                placeholder="Например: Москва"
                value={cityFilter}
                onChange={(e) => {
                  setCityFilter(e.target.value)
                  setCurrentPage(1)
                }}
                className="input-field w-full"
              />
            </div>

            {/* Trust Score Filter */}
            <div>
              <label className="block text-sm font-medium text-[#AAFF00] mb-3 uppercase tracking-widest">
                Min Trust Score
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={minTrustScore}
                onChange={(e) => {
                  setMinTrustScore(parseInt(e.target.value))
                  setCurrentPage(1)
                }}
                className="w-full h-2 bg-[#1A1A1A] rounded-full appearance-none cursor-pointer accent-[#AAFF00]"
              />
              <p className="text-xs text-[#888888] mt-2">{minTrustScore}</p>
            </div>

            {/* Reset Button */}
            <div className="flex items-end">
              <button
                onClick={handleResetFilters}
                className="btn-secondary w-full"
              >
                Сбросить
              </button>
            </div>
          </div>
        </div>

        {/* Players Grid */}
        {paginatedPlayers.length === 0 ? (
          <div className="card text-center py-20">
            <p className="text-3xl mb-6">😕</p>
            <p className="text-xl text-[#888888] mb-8">Игроки не найдены</p>
            <button
              onClick={handleResetFilters}
              className="btn-primary inline-block"
            >
              Сбросить фильтры
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {paginatedPlayers.map((player, i) => (
                <Link
                  key={player.id}
                  href={`/player/${player.id}`}
                  className="card-stagger"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <div className="card bg-[#161616] hover:border-[#AAFF0050] cursor-pointer group">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-[#111111] flex items-center justify-center">
                          {player.avatar_url ? (
                            <img src={player.avatar_url} alt={player.full_name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="font-bold text-[#AAFF00] text-lg">{player.full_name.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-white">{player.full_name}</p>
                          <p className="text-sm text-[#888888] truncate max-w-[200px] md:max-w-none">
                            {player.positions && player.positions.length > 0
                              ? player.positions.map(shortPosition).join(' • ')
                              : shortPosition(player.position || 'Игрок')}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Founder Badge */}
                    {player.is_founder_verified && (
                      <div className="mb-4">
                        <span className="tag-verified">⭐ Founder Verified</span>
                      </div>
                    )}

                    {/* Trust Score */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-[#AAFF00] font-medium uppercase">Trust Score</span>
                        <span className="text-xs text-[#888888]">{player.trust_score}/100</span>
                      </div>
                      <div className="trust-score-track" style={{ height: '4px' }}>
                        <div
                          className="trust-score-fill"
                          style={{ width: `${Math.min(player.trust_score, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 mb-4 py-4 border-y border-[#222222]">
                      <div className="text-center">
                        <p className="text-lg font-black text-[#AAFF00]">{player.matches_count}</p>
                        <p className="text-xs text-[#888888] uppercase font-medium">Матчи</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-black text-[#AAFF00]">{player.goals_total}</p>
                        <p className="text-xs text-[#888888] uppercase font-medium">Голы</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-black text-[#AAFF00]">{player.assists_total}</p>
                        <p className="text-xs text-[#888888] uppercase font-medium">Передачи</p>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-[#888888]">
                        {player.city} • {player.country}
                      </p>
                      <p className="text-sm font-bold text-[#AAFF00] group-hover:text-[#AAFF00] transition-colors">
                        Профиль →
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mb-12">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      currentPage === page
                        ? 'bg-[#AAFF00] text-black'
                        : 'bg-[#1A1A1A] text-[#888888] hover:border border-[#333333]'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
