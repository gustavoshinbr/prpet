import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { inviteSchema } from '@/lib/validators'

export async function POST(request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const admin = createAdminClient()
    const { data: prof } = await admin.from('profiles').select('*').eq('id', user.id).single()
    if (!prof || prof.role !== 'admin') return NextResponse.json({ error: 'Apenas admin pode convidar' }, { status: 403 })

    const body = await request.json()
    const parsed = inviteSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    const { email, password, full_name } = parsed.data

    // Cria o usuário direto (admin API)
    const { data: created, error: cErr } = await admin.auth.admin.createUser({
      email, password, email_confirm: true,
      user_metadata: { full_name, business_id: prof.business_id, role: 'user' },
    })
    if (cErr) return NextResponse.json({ error: cErr.message }, { status: 400 })

    // Insere o profile (caso o trigger não tenha criado direito - garantia)
    await admin.from('profiles').upsert({
      id: created.user.id, email, full_name, business_id: prof.business_id, role: 'user',
    })

    return NextResponse.json({ ok: true, user_id: created.user.id })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
