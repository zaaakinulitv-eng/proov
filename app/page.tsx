import { redirect } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default async function Home() {
  // Временно убираем проверку сессии для упрощения
  redirect('/login')
}
