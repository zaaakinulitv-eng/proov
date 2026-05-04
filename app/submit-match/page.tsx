'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function SubmitMatch() {
  const [formData, setFormData] = useState({
    opponent_team: '',
    played_at: '',
    score_us: '',
    score_them: '',
    goals: '',
    assists: '',
    yellow_cards: '',
    red_card: false,
    minutes_played: ''
  })
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    // Check auth
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
      }
    }
    checkAuth()
  }, [router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    })
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPhoto(file)
      const reader = new FileReader()
      reader.onload = () => {
        setPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Не авторизован')

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!profile) throw new Error('Профиль не найден')

      let photoUrl = null
      if (photo) {
        const fileExt = photo.name.split('.').pop()
        const fileName = `${profile.id}_${Date.now()}.${fileExt}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('match-photos')
          .upload(fileName, photo)

        if (uploadError) throw uploadError

        photoUrl = supabase.storage.from('match-photos').getPublicUrl(fileName).data.publicUrl
      }

      const { error: insertError } = await supabase
        .from('matches')
        .insert({
          player_id: profile.id,
          opponent_team: formData.opponent_team,
          score_us: parseInt(formData.score_us),
          score_them: parseInt(formData.score_them),
          goals: parseInt(formData.goals) || 0,
          assists: parseInt(formData.assists) || 0,
          yellow_cards: parseInt(formData.yellow_cards) || 0,
          red_cards: formData.red_card ? 1 : 0,
          minutes_played: parseInt(formData.minutes_played),
          photo_url: photoUrl,
          status: 'pending',
          played_at: formData.played_at
        })

      if (insertError) throw insertError

      setSuccess(true)
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-[#22c55e] text-6xl mb-4">✓</div>
          <h2 className="text-2xl font-bold mb-2">Матч отправлен на верификацию!</h2>
          <p className="text-gray-400">Перенаправление на дашборд...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-[430px] mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="mr-4 text-[#22c55e] text-2xl"
          >
            ←
          </button>
          <h1 className="text-xl font-bold">Добавить матч</h1>
        </div>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Opponent Team */}
          <div>
            <label className="block text-sm font-medium mb-2">Команда соперника</label>
            <input
              type="text"
              name="opponent_team"
              value={formData.opponent_team}
              onChange={handleChange}
              required
              className="w-full p-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-[#22c55e] focus:outline-none"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium mb-2">Дата матча</label>
            <input
              type="date"
              name="played_at"
              value={formData.played_at}
              onChange={handleChange}
              required
              className="w-full p-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-[#22c55e] focus:outline-none"
            />
          </div>

          {/* Score */}
          <div>
            <label className="block text-sm font-medium mb-2">Счёт</label>
            <div className="flex space-x-4">
              <div className="flex-1">
                <label className="block text-xs text-gray-400 mb-1">Мы</label>
                <input
                  type="number"
                  name="score_us"
                  value={formData.score_us}
                  onChange={handleChange}
                  min="0"
                  max="99"
                  required
                  className="w-full p-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-[#22c55e] focus:outline-none"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-400 mb-1">Они</label>
                <input
                  type="number"
                  name="score_them"
                  value={formData.score_them}
                  onChange={handleChange}
                  min="0"
                  max="99"
                  required
                  className="w-full p-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-[#22c55e] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Goals */}
          <div>
            <label className="block text-sm font-medium mb-2">Голы</label>
            <input
              type="number"
              name="goals"
              value={formData.goals}
              onChange={handleChange}
              min="0"
              className="w-full p-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-[#22c55e] focus:outline-none"
            />
          </div>

          {/* Assists */}
          <div>
            <label className="block text-sm font-medium mb-2">Передачи</label>
            <input
              type="number"
              name="assists"
              value={formData.assists}
              onChange={handleChange}
              min="0"
              className="w-full p-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-[#22c55e] focus:outline-none"
            />
          </div>

          {/* Yellow Cards */}
          <div>
            <label className="block text-sm font-medium mb-2">Жёлтые карточки</label>
            <input
              type="number"
              name="yellow_cards"
              value={formData.yellow_cards}
              onChange={handleChange}
              min="0"
              max="2"
              className="w-full p-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-[#22c55e] focus:outline-none"
            />
          </div>

          {/* Red Card */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="red_card"
                checked={formData.red_card}
                onChange={handleChange}
                className="mr-2"
              />
              <span className="text-sm font-medium">Красная карточка</span>
            </label>
          </div>

          {/* Minutes Played */}
          <div>
            <label className="block text-sm font-medium mb-2">Минуты сыграно</label>
            <input
              type="number"
              name="minutes_played"
              value={formData.minutes_played}
              onChange={handleChange}
              min="1"
              max="120"
              required
              className="w-full p-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-[#22c55e] focus:outline-none"
            />
          </div>

          {/* Photo Upload */}
          <div>
            <label className="block text-sm font-medium mb-2">Фото результата</label>
            <div
              onClick={() => document.getElementById('photo-input')?.click()}
              className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-[#22c55e] transition-colors"
            >
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="max-h-32 mx-auto rounded" />
              ) : (
                <>
                  <div className="text-4xl text-gray-400 mb-2">📷</div>
                  <p className="text-gray-400">Загрузить фото результата</p>
                  <p className="text-xs text-gray-500 mt-1">Фото табло, скрин WhatsApp или протокол</p>
                </>
              )}
            </div>
            <input
              id="photo-input"
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#22c55e] text-black font-bold py-4 rounded-lg hover:bg-[#1ea34a] disabled:opacity-50 transition-colors"
          >
            {loading ? 'Отправка...' : 'Отправить на верификацию'}
          </button>
        </form>
      </div>
    </div>
  )
}