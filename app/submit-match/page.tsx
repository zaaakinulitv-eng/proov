'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'

export default function SubmitMatch() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoUrl, setPhotoUrl] = useState<string>('')
  const [formData, setFormData] = useState({
    opponent_team: '',
    score_us: '',
    score_them: '',
    goals: '',
    assists: '',
    minutes_played: '',
    played_at: new Date().toISOString().split('T')[0]
  })
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPhotoFile(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      setPhotoFile(file)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    setError('')

    try {
      const minutesVal = Math.max(1, Math.min(90, parseInt(formData.minutes_played) || 0))

      // Вариант А: без фото - self-reported (auto_pending)
      if (!photoFile) {
        const { error: matchError } = await supabase
          .from('matches')
          .insert({
            player_id: user.id,
            opponent_team: formData.opponent_team,
            score_us: parseInt(formData.score_us),
            score_them: parseInt(formData.score_them),
            goals: parseInt(formData.goals),
            assists: parseInt(formData.assists),
            minutes_played: minutesVal,
            played_at: formData.played_at,
            status: 'auto_pending',
            verification_type: 'self_reported',
            photo_url: null
          })

        if (matchError) throw matchError

        alert('✓ Матч добавлен! Засчитается через 48 часов.')
        router.push('/dashboard')
        return
      }

      // Вариант Б: с фото - photo verification
      const fileExt = photoFile.name.split('.').pop()
      const fileName = `${user.id}_${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from('match-photos')
        .upload(fileName, photoFile)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('match-photos')
        .getPublicUrl(fileName)

      setPhotoUrl(publicUrl)

      // Verify photo with AI
      const verifyResponse = await fetch('/api/verify-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoUrl: publicUrl,
          scoreUs: formData.score_us,
          scoreThem: formData.score_them,
          opponentTeam: formData.opponent_team
        })
      })

      const verifyResult = await verifyResponse.json()
      const matchStatus = verifyResult.auto_approve ? 'approved' : 'pending'

      // Insert match with photo verification
      const { error: matchError } = await supabase
        .from('matches')
        .insert({
          player_id: user.id,
          opponent_team: formData.opponent_team,
          score_us: parseInt(formData.score_us),
          score_them: parseInt(formData.score_them),
          goals: parseInt(formData.goals),
          assists: parseInt(formData.assists),
          minutes_played: minutesVal,
          played_at: formData.played_at,
          status: matchStatus,
          verification_type: 'photo',
          photo_url: publicUrl
        })

      if (matchError) throw matchError

      // Update trust score if auto-approved
      if (verifyResult.auto_approve) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('trust_score')
          .eq('id', user.id)
          .single()

        if (profile) {
          await supabase
            .from('profiles')
            .update({ trust_score: profile.trust_score + 20 })
            .eq('id', user.id)
        }
      }

      if (verifyResult.auto_approve) {
        alert('✓ Матч верифицирован автоматически! Trust Score обновлён.')
      } else {
        alert('⏳ Матч отправлен на проверку. Обычно занимает до 24 часов.')
      }

      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#080808] has-mobile-nav page-enter">
      {/* Header */}
      <header className="header-base h-20 flex items-center px-4 md:px-8 border-b border-[#1A1A1A]">
        <Link href="/dashboard" className="text-[#AAFF00] font-black text-xl">
          ←
        </Link>
        <div className="flex-1" />
        <button
          onClick={async () => {
            await supabase.auth.signOut()
            window.location.href = '/login'
          }}
          className="btn-secondary text-sm flex items-center gap-2"
        >
          <span className="md:hidden">⏏</span>
          <span className="hidden md:inline">Выход</span>
        </button>
      </header>

      <main className="max-w-2xl w-full mx-auto px-4 md:px-8 py-6 md:py-12">
        <div className="page-enter">
          <h1 className="text-4xl font-black mb-2">Добавить матч</h1>
          <p className="text-[#888888] mb-12">Введи данные матча. Без фото матч будет засчитан через 48 часов. Загруженное фото ускорит верификацию.</p>

          {error && (
            <div className="bg-[#FF333315] border border-[#FF333330] rounded-lg p-4 mb-8 text-[#FF3333] text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Opponent */}
            <div>
              <label className="block text-sm font-medium text-[#AAFF00] mb-3 uppercase tracking-widest">
                ⚽ Соперник
              </label>
              <input
                type="text"
                name="opponent_team"
                placeholder="Название команды или имя противника"
                value={formData.opponent_team}
                onChange={handleChange}
                required
                className="input-field w-full"
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-[#AAFF00] mb-3 uppercase tracking-widest">
                📅 Дата матча
              </label>
              <input
                type="date"
                name="played_at"
                value={formData.played_at}
                onChange={handleChange}
                required
                className="input-field w-full"
              />
            </div>

            {/* Score - Large Number Fields */}
            <div>
              <label className="block text-sm font-medium text-[#AAFF00] mb-3 uppercase tracking-widest">
                🎯 Счёт
              </label>
              {/* Mobile: 2-column flex layout */}
              <div className="md:hidden flex gap-4 items-end">
                <div className="flex-1">
                  <input
                    type="number"
                    name="score_us"
                    min="0"
                    max="99"
                    placeholder="0"
                    value={formData.score_us}
                    onChange={handleChange}
                    required
                    className="input-field w-full text-center text-4xl font-black"
                  />
                  <p className="text-xs text-[#888888] text-center mt-2 uppercase">Мы</p>
                </div>
                <div className="flex-1">
                  <input
                    type="number"
                    name="score_them"
                    min="0"
                    max="99"
                    placeholder="0"
                    value={formData.score_them}
                    onChange={handleChange}
                    required
                    className="input-field w-full text-center text-4xl font-black"
                  />
                  <p className="text-xs text-[#888888] text-center mt-2 uppercase">Они</p>
                </div>
              </div>
              {/* Desktop: 5-column grid with separator */}
              <div className="hidden md:grid grid-cols-5 gap-3 items-end">
                <div>
                  <input
                    type="number"
                    name="score_us"
                    min="0"
                    max="99"
                    placeholder="0"
                    value={formData.score_us}
                    onChange={handleChange}
                    required
                    className="input-field w-full text-center text-3xl font-black"
                  />
                  <p className="text-xs text-[#888888] text-center mt-2 uppercase">Мы</p>
                </div>
                <div className="text-center text-2xl font-black text-[#AAFF00]">:</div>
                <div>
                  <input
                    type="number"
                    name="score_them"
                    min="0"
                    max="99"
                    placeholder="0"
                    value={formData.score_them}
                    onChange={handleChange}
                    required
                    className="input-field w-full text-center text-3xl font-black"
                  />
                  <p className="text-xs text-[#888888] text-center mt-2 uppercase">Они</p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#AAFF00] mb-3 uppercase tracking-widest">
                  ⚽ Голы
                </label>
                <input
                  type="number"
                  name="goals"
                  min="0"
                  placeholder="0"
                  value={formData.goals}
                  onChange={handleChange}
                  required
                  className="input-field w-full text-center text-2xl font-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#AAFF00] mb-3 uppercase tracking-widest">
                  🎯 Передачи
                </label>
                <input
                  type="number"
                  name="assists"
                  min="0"
                  placeholder="0"
                  value={formData.assists}
                  onChange={handleChange}
                  required
                  className="input-field w-full text-center text-2xl font-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#AAFF00] mb-3 uppercase tracking-widest">
                  ⏱ Минут
                </label>
                <input
                  type="number"
                  name="minutes_played"
                  min="0"
                  max="90"
                  placeholder="90"
                  value={formData.minutes_played}
                  onChange={handleChange}
                  required
                  className="input-field w-full text-center text-2xl font-black"
                />
              </div>
            </div>

            {/* Upload Zone */}
            <div>
              <label className="block text-sm font-medium text-[#AAFF00] mb-3 uppercase tracking-widest">
                📸 Фото результата матча (опционально)
              </label>
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById('photo-input')?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 md:p-8 text-center transition-all duration-200 cursor-pointer ${
                  dragActive
                    ? 'border-[#AAFF00] bg-[#AAFF0010]'
                    : photoFile
                    ? 'border-[#AAFF00] bg-[#AAFF0005]'
                    : 'border-[#AAFF0040] bg-[#AAFF0005]'
                }`}
              >
                {photoFile ? (
                  <>
                    <p className="text-2xl mb-2">✅</p>
                    <p className="text-sm text-[#AAFF00] font-medium mb-1">{photoFile.name}</p>
                    <p className="text-xs text-[#888888]">Нажми чтобы выбрать другое фото</p>
                  </>
                ) : (
                  <>
                    <p className="text-2xl mb-2">📸</p>
                    <p className="text-sm text-[#AAFF00] font-medium mb-1">Перетащи фото матча сюда</p>
                    <p className="text-xs text-[#888888]">или нажми чтобы выбрать файл</p>
                  </>
                )}
              </div>
              <input
                id="photo-input"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Обработка...' : 'Отправить матч'}
            </button>

            <p className="text-xs text-center text-[#888888]">
              {photoFile 
                ? 'AI автоматически верифицирует матч по фото. Если фото чёткое — Trust Score +20 сразу!'
                : 'Матч будет засчитан через 48 часов. Загруженное фото ускорит проверку.'}
            </p>
          </form>
        </div>
      </main>
    </div>
  )
}
