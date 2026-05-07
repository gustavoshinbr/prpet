'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, Calendar, Users } from 'lucide-react'
import { formatBRL, formatDateTime } from '@/lib/utils'

export default function DashboardPage() {
  const [stats, setStats] = useState({ today: 0, yesterday: 0, count: 0, lastSale: null, appointments: 0, clients: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  const load = async () => {
    const supabase = createClient()
    const today = new Date(); today.setHours(0,0,0,0)
    const yest = new Date(today); yest.setDate(yest.getDate() - 1)
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1)

    const { data: salesToday } = await supabase.from('sales').select('total, created_at').gte('created_at', today.toISOString()).order('created_at', { ascending: false })
    const { data: salesYest } = await supabase.from('sales').select('total').gte('created_at', yest.toISOString()).lt('created_at', today.toISOString())
    const { count: apt } = await supabase.from('appointments').select('id', { count: 'exact', head: true }).gte('scheduled_at', today.toISOString()).lt('scheduled_at', tomorrow.toISOString())
    const { count: cli } = await supabase.from('clients').select('id', { count: 'exact', head: true })

    const todayTotal = (salesToday || []).reduce((s, x) => s + Number(x.total), 0)
    const yestTotal = (salesYest || []).reduce((s, x) => s + Number(x.total), 0)
    setStats({
      today: todayTotal,
      yesterday: yestTotal,
      count: salesToday?.length || 0,
      lastSale: salesToday?.[0]?.created_at,
      appointments: apt || 0,
      clients: cli || 0,
    })
    setLoading(false)
  }

  const growth = stats.yesterday === 0 ? (stats.today > 0 ? 100 : 0) : ((stats.today - stats.yesterday) / stats.yesterday * 100)
  const up = growth >= 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-500">Visão geral do seu petshop hoje</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Vendas Hoje</span>
            <DollarSign className="w-5 h-5 text-orange-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{formatBRL(stats.today)}</div>
          <div className={`text-sm flex items-center gap-1 mt-1 ${up ? 'text-green-600' : 'text-red-600'}`}>
            {up ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {Math.abs(growth).toFixed(1)}% vs ontem ({formatBRL(stats.yesterday)})
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between mb-2"><span className="text-sm text-gray-500">Vendas (qtd)</span><ShoppingBag className="w-5 h-5 text-blue-500" /></div>
          <div className="text-3xl font-bold">{stats.count}</div>
          <div className="text-sm text-gray-500 mt-1">{stats.lastSale ? `Última: ${formatDateTime(stats.lastSale)}` : 'Nenhuma venda hoje'}</div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between mb-2"><span className="text-sm text-gray-500">Agendamentos Hoje</span><Calendar className="w-5 h-5 text-purple-500" /></div>
          <div className="text-3xl font-bold">{stats.appointments}</div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between mb-2"><span className="text-sm text-gray-500">Clientes</span><Users className="w-5 h-5 text-green-500" /></div>
          <div className="text-3xl font-bold">{stats.clients}</div>
        </Card>
      </div>

      {loading && <p className="text-gray-500">Carregando...</p>}
    </div>
  )
}
