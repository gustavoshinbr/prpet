import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { createCustomer, createSubscription, getLatestPayment } from '@/lib/asaas'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const admin = createAdminClient()
    const { data: prof } = await admin.from('profiles').select('*, establishment:establishments(*)').eq('id', user.id).single()
    if (!prof) return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })

    const est = prof.establishment
    let asaasCustomerId = est?.asaas_customer_id

    if (est?.asaas_subscription_id) {
      const payment = await getLatestPayment(est.asaas_subscription_id)
      return NextResponse.json({
        ok: true,
        invoiceUrl: est.payment_link || payment?.invoiceUrl,
        subscriptionId: est.asaas_subscription_id,
      })
    }

    if (!asaasCustomerId) {
      const customer = await createCustomer({
        name: prof.full_name,
        email: user.email,
        cpfCnpj: prof.cpf_cnpj,
        phone: prof.phone,
      })
      asaasCustomerId = customer.id
      await admin.from('establishments').update({ asaas_customer_id: asaasCustomerId }).eq('id', est.id)
    }

    const value = parseFloat(process.env.SUBSCRIPTION_PRICE || '80.00')
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1)
    const nextDueDate = tomorrow.toISOString().slice(0, 10)

    const sub = await createSubscription({ customer: asaasCustomerId, value, nextDueDate, billingType: 'UNDEFINED' })
    const payment = await getLatestPayment(sub.id)

    await admin.from('establishments').update({
      asaas_subscription_id: sub.id,
      subscription_status: 'PENDING',
      payment_link: payment?.invoiceUrl || null,
    }).eq('id', est.id)

    return NextResponse.json({ ok: true, invoiceUrl: payment?.invoiceUrl, subscriptionId: sub.id })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
