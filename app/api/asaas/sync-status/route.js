import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getLatestPayment, getSubscription } from '@/lib/asaas'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const admin = createAdminClient()
    const { data: prof } = await admin.from('profiles').select('*, establishment:establishments(*)').eq('id', user.id).single()
    const est = prof?.establishment
    if (!est?.asaas_subscription_id) return NextResponse.json({ error: 'Sem assinatura' }, { status: 400 })

    const payment = await getLatestPayment(est.asaas_subscription_id)
    const status = payment?.status || 'PENDING'
    await admin.from('establishments').update({ subscription_status: status }).eq('id', est.id)

    return NextResponse.json({ ok: true, status })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
