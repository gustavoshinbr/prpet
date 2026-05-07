'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatBRL } from '@/lib/utils'
import { todayISO } from '@/lib/utils'

export default function FechamentoPage() {
  const [date, setDate] = useState(todayISO())
  const [data, setData] = useState({ byMethod: {}, total: 0, count: 0 })

  useEffect(() => { load() }, [date])
  const load = async () => {
    const sb = createClient()
    const start = new Date(date + 'T00:00:00')
    const end = new Date(start); end.setDate(end.getDate() + 1)
    const { data: tx } = await sb.from('financial_transactions').select('*').gte('created_at', start.toISOString()).lt('created_at', end.toISOString()).eq('type', 'income')
    const byMethod = {}
    let total = 0
    for (const t of tx || []) {
      const m = t.payment_method || 'Outros'
      byMethod[m] = (byMethod[m] || 0) + Number(t.amount)
      total += Number(t.amount)
    }
    setData({ byMethod, total, count: tx?.length || 0 })
  }

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold">Fechamento de Caixa</h1><p className="text-gray-500">Resumo diário de entradas</p></div>

      <div className="max-w-xs">
        <Label>Data</Label>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="text-sm text-gray-500">Total do Dia</div>
          <div className="text-3xl font-bold text-orange-600">{formatBRL(data.total)}</div>
          <div className="text-sm text-gray-500">{data.count} transações</div>
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="font-bold text-lg mb-4">Entradas por forma de pagamento</h2>
        <div className="space-y-3">
          {Object.entries(data.byMethod).map(([k, v]) => (
            <div key={k} className="flex items-center justify-between border-b pb-2">
              <span className="font-medium">{k}</span>
              <span className="font-bold text-green-600">{formatBRL(v)}</span>
            </div>
          ))}
          {Object.keys(data.byMethod).length === 0 && <p className="text-gray-500">Nenhuma entrada nesse dia</p>}
        </div>
      </Card>
    </div>
  )
}
