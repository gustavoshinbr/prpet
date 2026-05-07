import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { isTrialActive } from '@/lib/subscription'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })

    const admin = createAdminClient()
    const { data: prof } = await admin
      .from('profiles')
      .select('*, establishment:establishments(*)')
      .eq('id', user.id)
      .single()

    const est = prof?.establishment
    if (!est) return NextResponse.json({ error: 'Estabelecimento nao encontrado' }, { status: 404 })

    if (est.trial_started_at && !isTrialActive(est)) {
      return NextResponse.json({ error: 'Seu teste gratis ja terminou.' }, { status: 403 })
    }

    const trialStartedAt = est.trial_started_at || new Date().toISOString()
    const { error } = await admin
      .from('establishments')
      .update({
        subscription_status: 'TRIAL',
        trial_started_at: trialStartedAt,
      })
      .eq('id', est.id)

    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
