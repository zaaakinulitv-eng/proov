'use client'

import { useEffect, useRef, useState } from 'react'
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

const strongFootOptions = ['Правая', 'Левая', 'Обе']

interface ProfileForm {
  full_name: string
  club: string
  city: string
  country: string
  nationality: string
  birth_date: string
  height: string
  strong_foot: string
  positions: string[]
  avatar_url: string
}

export default function EditProfile() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [photoSaving, setPhotoSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [selectedPositions, setSelectedPositions] = useState<string[]>([])
  const [profile, setProfile] = useState<ProfileForm>({
    full_name: '',
    club: '',
    city: '',
    country: '',
    nationality: '',
    birth_date: '',
    height: '',
    strong_foot: '',
    positions: [],
    avatar_url: ''
  })

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        router.push('/login')
        return
      }

      setUser(user)

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError || !profileData) {
        setError('Не удалось загрузить профиль')
        setLoading(false)
        return
      }

      setProfile({
        full_name: profileData.full_name || '',
        club: profileData.club || '',
        city: profileData.city || '',
        country: profileData.country || '',
        nationality: profileData.nationality || '',
        birth_date: profileData.birth_date || '',
        height: profileData.height ? String(profileData.height) : '',
        strong_foot: profileData.strong_foot || '',
        positions: Array.isArray(profileData.positions) ? profileData.positions : profileData.position ? [profileData.position] : [],
        avatar_url: profileData.avatar_url || ''
      })
      setSelectedPositions(Array.isArray(profileData.positions) ? profileData.positions : profileData.position ? [profileData.position] : [])
      setPhotoPreview(profileData.avatar_url || '')
      setLoading(false)
    }

    loadProfile()
  }, [router])

  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value })
  }

  const togglePosition = (pos: string) => {
    setSelectedPositions(prev => {
      if (prev.includes(pos)) {
        return prev.filter(p => p !== pos)
      }
      if (prev.length >= 3) return prev
      return [...prev, pos]
    })
  }

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setError('Можно загружать только JPG или PNG')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Файл должен быть не более 5MB')
      return
    }
    setError('')
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const handlePhotoSave = async () => {
    if (!photoFile || !user) return
    setPhotoSaving(true)
    
    const fileExt = photoFile.name.split('.').pop()
    const fileName = `${user.id}-${Date.now()}.${fileExt}`
    
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(fileName, photoFile, {
        cacheControl: '3600',
        upsert: true,
        contentType: photoFile.type
      })
    
    if (error) {
      setError('Ошибка загрузки фото: ' + error.message)
      setPhotoSaving(false)
      return
    }
    
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName)
    
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: urlData.publicUrl })
      .eq('id', user.id)
    
    if (!updateError) {
      setProfile(prev => ({ ...prev, avatar_url: urlData.publicUrl }))
      setSuccess('Фото обновлено!')
      setPhotoFile(null)
      setTimeout(() => setSuccess(''), 2000)
    }
    setPhotoSaving(false)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    setError('')

    if (selectedPositions.length === 0) {
      setError('Выберите хотя бы одну позицию')
      setSaving(false)
      return
    }

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          club: profile.club,
          city: profile.city,
          country: profile.country,
          nationality: profile.nationality,
          birth_date: profile.birth_date,
          height: profile.height ? parseInt(profile.height, 10) : null,
          strong_foot: profile.strong_foot,
          positions: selectedPositions,
          avatar_url: profile.avatar_url
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      setSuccess('✓ Профиль обновлён')
      setTimeout(() => router.push('/dashboard'), 1200)
    } catch (err: any) {
      setError(err.message || 'Не удалось сохранить профиль')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center page-enter">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#AAFF0033] border-t-[#AAFF00] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#888888]">Загрузка профиля...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#080808] page-enter">
      <header className="header-base h-20 flex items-center px-8 border-b border-[#1A1A1A]">
        <Link href="/dashboard" className="text-[#AAFF00] font-black text-xl">
          ← Назад
        </Link>
        <div className="flex-1" />
        <h1 className="text-xl font-black text-white">Редактировать профиль</h1>
      </header>

      <main className="max-w-3xl mx-auto px-8 py-12 space-y-10">
        {error && (
          <div className="bg-[#FF333315] border border-[#FF333330] rounded-xl p-4 text-[#FF3333]">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-[#0F3900] border border-[#3E7B00] rounded-xl p-4 text-[#AAFF00]">
            {success}
          </div>
        )}

        <section className="bg-[#111111] border border-[#1A1A1A] rounded-3xl p-8">
          <div className="flex flex-col items-center gap-6">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-[#080808] border border-[#AAFF00] flex items-center justify-center text-4xl font-black text-[#AAFF00]">
              {photoPreview ? (
                <img src={photoPreview} alt="Аватар" className="w-full h-full object-cover" />
              ) : (
                profile.full_name.charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn-secondary px-6 py-3"
              >
                Изменить фото
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                className="hidden"
                onChange={handlePhotoSelect}
              />
              {photoFile && (
                <button
                  type="button"
                  onClick={handlePhotoSave}
                  disabled={photoSaving}
                  className="btn-primary px-6 py-3"
                >
                  {photoSaving ? 'Сохраняем...' : 'Сохранить фото'}
                </button>
              )}
            </div>
          </div>
        </section>

        <form onSubmit={handleSave} className="space-y-8">
          <section className="bg-[#111111] border border-[#1A1A1A] rounded-3xl p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-[#AAFF00] mb-2">Имя</label>
                <input
                  name="full_name"
                  value={profile.full_name}
                  onChange={handleFieldChange}
                  className="input-field w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#AAFF00] mb-2">Клуб</label>
                <input
                  name="club"
                  value={profile.club}
                  onChange={handleFieldChange}
                  className="input-field w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-bold text-[#AAFF00] mb-2">Город</label>
                <input
                  name="city"
                  value={profile.city}
                  onChange={handleFieldChange}
                  className="input-field w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#AAFF00] mb-2">Страна</label>
                <input
                  name="country"
                  value={profile.country}
                  onChange={handleFieldChange}
                  className="input-field w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#AAFF00] mb-2">Национальность</label>
                <input
                  name="nationality"
                  value={profile.nationality}
                  onChange={handleFieldChange}
                  className="input-field w-full"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-bold text-[#AAFF00] mb-2">Дата рождения</label>
                <input
                  name="birth_date"
                  type="date"
                  value={profile.birth_date}
                  onChange={handleFieldChange}
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#AAFF00] mb-2">Рост (см)</label>
                <input
                  name="height"
                  type="number"
                  min="100"
                  max="250"
                  value={profile.height}
                  onChange={handleFieldChange}
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#AAFF00] mb-2">Сильная нога</label>
                <div className="space-y-2">
                  {strongFootOptions.map(foot => (
                    <label key={foot} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="strong_foot"
                        value={foot}
                        checked={profile.strong_foot === foot}
                        onChange={handleFieldChange}
                        className="form-radio h-4 w-4 text-[#AAFF00] bg-[#111111] border-[#333333]"
                      />
                      <span className="text-sm text-white">{foot}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="bg-[#111111] border border-[#1A1A1A] rounded-3xl p-8">
            <div className="mb-6">
              <h3 className="text-2xl font-black text-white">Твои позиции</h3>
              <p className="text-sm text-[#888888]">Можно выбрать от 1 до 3 позиций</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {positionsList.map(position => {
                const selected = selectedPositions.includes(position)
                return (
                  <button
                    key={position}
                    type="button"
                    onClick={() => togglePosition(position)}
                    className={`rounded-2xl px-4 py-3 text-left text-sm font-medium border transition-all ${selected ? 'bg-[#AAFF00] text-black border-transparent' : 'bg-[#111111] text-[#888888] border-[#333333] hover:border-[#AAFF00] hover:text-white'}`}
                  >
                    {position}
                  </button>
                )
              })}
            </div>
          </section>

          <button
            type="submit"
            disabled={saving}
            className="btn-primary w-full py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Сохраняем...' : 'Сохранить изменения'}
          </button>
        </form>
      </main>
    </div>
  )
}
