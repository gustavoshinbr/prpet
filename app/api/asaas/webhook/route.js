import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// Webhook do Asaas - configure em: https://www.asaas.com/integracoes/webhooks
// URL: {SEU_DOMINIO}/api/asaas/webhook
// Token: defina ASAAS_WEBHOOK_TOKEN no .env e em "Token Authorization" no Asaas
export async function POST(request) {
  try {
    const token = request.headers.get('asaas-access-token')
    if (process.env.ASAAS_WEBHOOK_TOKEN && token !== process.env.ASAAS_WEBHOOK_TOKEN) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }
    const body = await request.json()
    const event = body?.event
    const payment = body?.payment
    if (!payment) return NextResponse.json({ ok: true })

    const admin = createAdminClient()
    const subId = payment.subscription
    if (!subId) return NextResponse.json({ ok: true })

    let status = payment.status // PENDING, CONFIRMED, RECEIVED, OVERDUE, REFUNDED
    if (event === 'PAYMENT_DELETED' || event === 'PAYMENT_REFUNDED') status = 'CANCELLED'

    await admin.from('establishments').update({ subscription_status: status }).eq('asaas_subscription_id', subId)

    return NextResponse.json({ ok: true, status })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
