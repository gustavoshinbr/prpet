'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CheckCircle2 } from 'lucide-react'
import { formatBRL, formatDateTime } from '@/lib/utils'
import { toast } from 'sonner'

export default function ContasReceberPage() {
  const [items, setItems] = useState([])

  useEffect(() => { load() }, [])
  const load = async () => {
    const sb = createClient()
    const { data } = await sb.from('sales').select('*, client:clients(name)').eq('payment_method', 'A Prazo').order('created_at', { ascending: false })
    setItems(data || [])
  }

  const settle = async (sale) => {
    if (!confirm(`Marcar como liquidado? ${formatBRL(sale.total)}`)) return
    const sb = createClient()
    await sb.from('sales').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', sale.id)
    await sb.from('financial_transactions').insert({
      business_id: sale.business_id, type: 'income', amount: sale.total,
      payment_method: 'A Prazo (liquidado)', sale_id: sale.id,
      description: `Liquidação venda #${sale.id.slice(0,8)}`,
    })
    toast.success('Liquidado!')
    load()
  }

  const pending = items.filter(i => i.status === 'pending')
  const paid = items.filter(i => i.status === 'paid')

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold">Contas a Receber</h1><p className="text-gray-500">Vendas a prazo</p></div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="text-sm text-gray-500">Total Pendente</div>
          <div className="text-3xl font-bold text-red-600">{formatBRL(pending.reduce((s, i) => s + Number(i.total), 0))}</div>
          <div className="text-sm text-gray-500">{pending.length} vendas</div>
        </Card>
        <Card className="p-5">
          <div className="text-sm text-gray-500">Total Liquidado</div>
          <div className="text-3xl font-bold text-green-600">{formatBRL(paid.reduce((s, i) => s + Number(i.total), 0))}</div>
        </Card>
      </div>

      <h2 className="text-xl font-bold">Pendentes</h2>
      <div className="grid gap-3">
        {pending.map(s => (
          <Card key={s.id} className="p-4 flex items-center justify-between">
            <div>
              <div className="font-bold">{s.client?.name || 'Sem cliente'}</div>
              <div className="text-sm text-gray-500">{formatDateTime(s.created_at)}</div>
              <div className="text-orange-600 font-bold text-lg">{formatBRL(s.total)}</div>
            </div>
            <Button onClick={() => settle(s)} className="bg-green-500 hover:bg-green-600"><CheckCircle2 className="w-4 h-4 mr-2" /> Liquidar</Button>
          </Card>
        ))}
        {pending.length === 0 && <p className="text-gray-500">Nenhuma pendência</p>}
      </div>

      {paid.length > 0 && <>
        <h2 className="text-xl font-bold">Liquidadas</h2>
        <div className="grid gap-3 opacity-60">
          {paid.map(s => (
            <Card key={s.id} className="p-4 flex items-center justify-between">
              <div>
                <div className="font-bold">{s.client?.name || 'Sem cliente'}</div>
                <div className="text-sm text-gray-500">{formatDateTime(s.created_at)}</div>
                <div className="text-green-600 font-bold">{formatBRL(s.total)}</div>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">Pago</span>
            </Card>
          ))}
        </div>
      </>}
    </div>
  )
}
