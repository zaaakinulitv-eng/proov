'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'

const positionsList = [
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

interface OnboardingData {
  club: string
  birth_date: string
  nationality: string
  height: string
  strong_foot: string
  positions: string[]
}

export default function Onboarding() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState<OnboardingData>({
    club: '',
    birth_date: '',
    nationality: '',
    height: '',
    strong_foot: '',
    positions: []
  })

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        router.push('/login')
        return
      }

      // Check if onboarding already completed
      const { data: profileData } = await supabase
        .from('profiles')
        .select('onboarding_completed, club, birth_date, nationality, height, strong_foot, positions')
        .eq('id', user.id)
        .single()

      if (profileData?.onboarding_completed) {
        router.push('/dashboard')
        return
      }

      // Load existing data if available
      if (profileData) {
        setData({
          club: profileData.club || '',
          birth_date: profileData.birth_date || '',
          nationality: profileData.nationality || '',
          height: profileData.height ? String(profileData.height) : '',
          strong_foot: profileData.strong_foot || '',
          positions: Array.isArray(profileData.positions) ? profileData.positions : []
        })
      }

      setUser(user)
      setLoading(false)
    }

    checkAuth()
  }, [router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setData(prev => ({ ...prev, [name]: value }))
  }

  const togglePosition = (pos: string) => {
    setData(prev => {
      if (prev.positions.includes(pos)) {
        return { ...prev, positions: prev.positions.filter(p => p !== pos) }
      }
      if (prev.positions.length >= 3) return prev
      return { ...prev, positions: [...prev.positions, pos] }
    })
  }

  const handleNext = async () => {
    setError('')

    if (step === 2) {
      if (!data.club || !data.birth_date || !data.nationality || !data.height || !data.strong_foot) {
        setError('Пожалуйста, заполни все поля')
        return
      }

      setSaving(true)
      try {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            club: data.club,
            birth_date: data.birth_date,
            nationality: data.nationality,
            height: parseInt(data.height, 10),
            strong_foot: data.strong_foot
          })
          .eq('id', user!.id)

        if (updateError) throw updateError
        setStep(3)
      } catch (err: any) {
        setError(err.message || 'Ошибка сохранения')
      } finally {
        setSaving(false)
      }
    } else if (step === 3) {
      if (data.positions.length === 0) {
        setError('Выбери хотя бы одну позицию')
        return
      }

      setSaving(true)
      try {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ positions: data.positions })
          .eq('id', user!.id)

        if (updateError) throw updateError
        setStep(4)
      } catch (err: any) {
        setError(err.message || 'Ошибка сохранения')
      } finally {
        setSaving(false)
      }
    } else {
      setStep(step + 1)
    }
  }

  const handleComplete = async () => {
    setSaving(true)
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user!.id)

      if (updateError) throw updateError
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Ошибка завершения онбординга')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#AAFF0033] border-t-[#AAFF00] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#888888]">Загрузка...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#080808] has-mobile-nav page-enter">
      {/* Progress Bar */}
      <div className="bg-[#111111] border-b border-[#1A1A1A] px-4 md:px-8 py-6 md:py-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-3">
              {[1, 2, 3, 4].map(s => (
                <div
                  key={s}
                  className={`w-3 h-3 rounded-full transition-all ${
                    s <= step ? 'bg-[#AAFF00]' : 'bg-[#333333]'
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-[#888888]">Шаг {step} из 4</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 md:px-8 py-6 md:py-16">
        <div className="w-full max-w-2xl">
          {error && (
            <div className="mb-6 bg-[#FF333315] border border-[#FF333330] rounded-xl p-4 text-[#FF3333]">
              {error}
            </div>
          )}

          {/* STEP 1 */}
          {step === 1 && (
            <div className="text-center space-y-12">
              <div>
                <h1 className="text-5xl font-black text-white mb-4">
                  Добро пожаловать в Proov!
                </h1>
                <p className="text-xl text-[#888888]">
                  Создадим твой цифровой паспорт игрока за 2 минуты
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#111111] border border-[#1A1A1A] rounded-2xl p-4 md:p-6 lg:p-8">
                  <div className="text-4xl mb-4">✅</div>
                  <p className="text-white font-bold">Верифицированная статистика</p>
                </div>
                <div className="bg-[#111111] border border-[#1A1A1A] rounded-2xl p-4 md:p-6 lg:p-8">
                  <div className="text-4xl mb-4">🃏</div>
                  <p className="text-white font-bold">FIFA-рейтинг</p>
                </div>
                <div className="bg-[#111111] border border-[#1A1A1A] rounded-2xl p-4 md:p-6 lg:p-8">
                  <div className="text-4xl mb-4">🔍</div>
                  <p className="text-white font-bold">Видимость для скаутов</p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-4xl font-black text-white mb-2">Расскажи о себе</h2>
                <p className="text-[#888888]">Базовая информация для твоего профиля</p>
              </div>

              <div className="bg-[#111111] border border-[#1A1A1A] rounded-2xl p-4 md:p-6 lg:p-8 space-y-6">
                <div>
                  <label className="block text-sm font-bold text-[#AAFF00] mb-2">Клуб</label>
                  <input
                    type="text"
                    name="club"
                    value={data.club}
                    onChange={handleInputChange}
                    placeholder="Название клуба"
                    className="input-field w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#AAFF00] mb-2">Дата рождения</label>
                  <input
                    type="date"
                    name="birth_date"
                    value={data.birth_date}
                    onChange={handleInputChange}
                    className="input-field w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#AAFF00] mb-2">Национальность</label>
                  <input
                    type="text"
                    name="nationality"
                    value={data.nationality}
                    onChange={handleInputChange}
                    placeholder="Например: Русский"
                    className="input-field w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#AAFF00] mb-2">Рост (см)</label>
                  <input
                    type="number"
                    name="height"
                    min="100"
                    max="250"
                    value={data.height}
                    onChange={handleInputChange}
                    placeholder="180"
                    className="input-field w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#AAFF00] mb-2">Сильная нога</label>
                  <div className="flex gap-3">
                    {['Правая', 'Левая', 'Обе'].map(foot => (
                      <button
                        key={foot}
                        type="button"
                        onClick={() => setData(prev => ({ ...prev, strong_foot: foot }))}
                        className={`flex-1 py-3 rounded-2xl font-medium transition-all ${
                          data.strong_foot === foot
                            ? 'bg-[#AAFF00] text-black'
                            : 'bg-[#1A1A1A] text-[#888888] border border-[#333333] hover:border-[#AAFF00]'
                        }`}
                      >
                        {foot}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-4xl font-black text-white mb-2">Где ты играешь?</h2>
                <p className="text-[#888888]">Выбери от 1 до 3 позиций</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {positionsList.map(position => {
                  const selected = data.positions.includes(position)
                  return (
                    <button
                      key={position}
                      type="button"
                      onClick={() => togglePosition(position)}
                      className={`rounded-2xl px-4 py-3 text-left text-sm font-medium border transition-all ${
                        selected
                          ? 'bg-[#AAFF00] text-black border-transparent'
                          : 'bg-[#111111] text-[#888888] border-[#333333] hover:border-[#AAFF00] hover:text-white'
                      }`}
                    >
                      {position}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <div className="space-y-8 text-center">
              <div>
                <h2 className="text-4xl font-black text-white mb-4">Добавь первый матч</h2>
                <p className="text-lg text-[#888888]">
                  Матчи — основа твоего рейтинга. Добавь хотя бы один.
                </p>
              </div>

              <div className="space-y-4">
                <Link
                  href="/submit-match"
                  className="block btn-primary w-full py-4 text-lg font-bold text-center"
                >
                  Добавить матч сейчас →
                </Link>
                <button
                  type="button"
                  onClick={handleComplete}
                  className="w-full py-4 text-lg font-bold text-[#888888] hover:text-white transition-colors"
                >
                  Сделаю позже
                </button>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          {step < 4 && (
            <div className="mt-16 flex gap-4 justify-center">
              <button
                onClick={() => setStep(Math.max(1, step - 1))}
                disabled={step === 1}
                className="btn-secondary px-4 py-3 md:px-8 md:py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Назад
              </button>
              <button
                onClick={handleNext}
                disabled={saving}
                className="btn-primary px-4 py-3 md:px-8 md:py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Сохраняем...' : 'Далее →'}
              </button>
            </div>
          )}

          {step === 4 && (
            <div className="mt-8 flex gap-4 justify-center">
              <button
                onClick={() => setStep(3)}
                className="btn-secondary px-4 py-3 md:px-8 md:py-3"
              >
                ← Назад
              </button>
              <button
                onClick={handleComplete}
                disabled={saving}
                className="btn-primary px-4 py-3 md:px-8 md:py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Сохраняем...' : 'Готово → Мой профиль'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
