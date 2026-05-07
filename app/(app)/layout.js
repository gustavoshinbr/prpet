import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/sidebar'

export default async function AppLayout({ children }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*, establishment:establishments(*)').eq('id', user.id).single()
  if (!profile) redirect('/login')

  const est = profile?.establishment
  const ok = ['CONFIRMED', 'RECEIVED', 'ACTIVE'].includes(est?.subscription_status)
  if (!ok) redirect('/checkout')

  const profileFlat = { ...profile, business_name: est?.name }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar profile={profileFlat} />
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  )
}
