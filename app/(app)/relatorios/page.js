'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { formatBRL } from '@/lib/utils'
import { todayISO } from '@/lib/utils'

export default function RelatoriosPage() {
  const [from, setFrom] = useState(() => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().slice(0,10) })
  const [to, setTo] = useState(todayISO())
  const [data, setData] = useState({ revenue: 0, sales: 0, topServices: [], topProducts: [] })

  const load = async () => {
    const sb = createClient()
    const start = new Date(from + 'T00:00:00')
    const end = new Date(to + 'T23:59:59')
    const { data: sales } = await sb.from('sales').select('total').gte('created_at', start.toISOString()).lte('created_at', end.toISOString()).eq('status', 'paid')
    const { data: items } = await sb.from('sale_items').select('name, quantity, total, product_id, service_id').gte('created_at', start.toISOString()).lte('created_at', end.toISOString())

    const revenue = (sales || []).reduce((s, x) => s + Number(x.total), 0)
    const services = {}, products = {}
    for (const it of items || []) {
      if (it.service_id) services[it.name] = (services[it.name] || { qty: 0, total: 0 }), services[it.name].qty += it.quantity, services[it.name].total += Number(it.total)
      if (it.product_id) products[it.name] = (products[it.name] || { qty: 0, total: 0 }), products[it.name].qty += it.quantity, products[it.name].total += Number(it.total)
    }
    const topServices = Object.entries(services).map(([n, v]) => ({ name: n, ...v })).sort((a, b) => b.qty - a.qty).slice(0, 10)
    const topProducts = Object.entries(products).map(([n, v]) => ({ name: n, ...v })).sort((a, b) => b.qty - a.qty).slice(0, 10)
    setData({ revenue, sales: sales?.length || 0, topServices, topProducts })
  }
  useEffect(() => { load() }, [])

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold">Relatórios</h1><p className="text-gray-500">Análise por período</p></div>

      <Card className="p-4 flex flex-wrap items-end gap-3">
        <div><Label>De</Label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
        <div><Label>Até</Label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
        <Button onClick={load} className="bg-orange-500 hover:bg-orange-600">Filtrar</Button>
      </Card>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-5"><div className="text-sm text-gray-500">Receita Bruta</div><div className="text-3xl font-bold text-green-600">{formatBRL(data.revenue)}</div></Card>
        <Card className="p-5"><div className="text-sm text-gray-500">Vendas</div><div className="text-3xl font-bold">{data.sales}</div></Card>
        <Card className="p-5"><div className="text-sm text-gray-500">Ticket Médio</div><div className="text-3xl font-bold text-orange-600">{formatBRL(data.sales ? data.revenue / data.sales : 0)}</div></Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-5">
          <h2 className="font-bold mb-3">Serviços mais realizados</h2>
          <div className="space-y-2">
            {data.topServices.map((s, i) => (
              <div key={i} className="flex items-center justify-between border-b pb-2">
                <span>{s.name}</span>
                <div className="text-right"><div className="font-bold">{s.qty}x</div><div className="text-xs text-gray-500">{formatBRL(s.total)}</div></div>
              </div>
            ))}
            {data.topServices.length === 0 && <p className="text-gray-500">Sem dados</p>}
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="font-bold mb-3">Produtos mais vendidos</h2>
          <div className="space-y-2">
            {data.topProducts.map((p, i) => (
              <div key={i} className="flex items-center justify-between border-b pb-2">
                <span>{p.name}</span>
                <div className="text-right"><div className="font-bold">{p.qty}x</div><div className="text-xs text-gray-500">{formatBRL(p.total)}</div></div>
              </div>
            ))}
            {data.topProducts.length === 0 && <p className="text-gray-500">Sem dados</p>}
          </div>
        </Card>
      </div>
    </div>
  )
}
