'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Calendar as CalIcon } from 'lucide-react'
import { formatBRL, formatDateTime } from '@/lib/utils'
import { toast } from 'sonner'

export default function AgendamentosPage() {
  const [items, setItems] = useState([])
  const [clients, setClients] = useState([])
  const [pets, setPets] = useState([])
  const [services, setServices] = useState([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ client_id: '', pet_id: '', service_id: '', scheduled_at: '', notes: '' })
  const [filterDate, setFilterDate] = useState('')

  useEffect(() => { loadAll() }, [])
  useEffect(() => { load() }, [filterDate])

  const loadAll = async () => {
    const sb = createClient()
    const [{ data: c }, { data: p }, { data: s }] = await Promise.all([
      sb.from('clients').select('id, name'),
      sb.from('pets').select('id, name, client_id'),
      sb.from('services').select('id, name, price'),
    ])
    setClients(c || []); setPets(p || []); setServices(s || [])
    load()
  }
  const load = async () => {
    const sb = createClient()
    let q = sb.from('appointments').select('*, client:clients(name), pet:pets(name), service:services(name, price)').order('scheduled_at', { ascending: true })
    if (filterDate) {
      const start = new Date(filterDate + 'T00:00:00')
      const end = new Date(start); end.setDate(end.getDate() + 1)
      q = q.gte('scheduled_at', start.toISOString()).lt('scheduled_at', end.toISOString())
    }
    const { data } = await q
    setItems(data || [])
  }

  const save = async () => {
    if (!form.client_id || !form.pet_id || !form.service_id || !form.scheduled_at) return toast.error('Preencha todos os campos')
    const sb = createClient()
    const { data: { user } } = await sb.auth.getUser()
    const { data: prof } = await sb.from('profiles').select('business_id').eq('id', user.id).single()
    const { error } = await sb.from('appointments').insert({ ...form, business_id: prof.business_id, status: 'scheduled' })
    if (error) return toast.error(error.message)
    toast.success('Agendamento criado!')
    setOpen(false); setForm({ client_id: '', pet_id: '', service_id: '', scheduled_at: '', notes: '' }); load()
  }

  const updateStatus = async (id, status) => {
    const sb = createClient()
    await sb.from('appointments').update({ status }).eq('id', id)
    toast.success('Atualizado!'); load()
  }

  const filteredPets = pets.filter(p => p.client_id === form.client_id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold">Agendamentos</h1><p className="text-gray-500">Banho, tosa e consultas</p></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="bg-orange-500 hover:bg-orange-600"><Plus className="w-4 h-4 mr-2" />Novo</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo Agendamento</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Cliente</Label>
                <Select value={form.client_id} onValueChange={(v) => setForm({ ...form, client_id: v, pet_id: '' })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Pet</Label>
                <Select value={form.pet_id} onValueChange={(v) => setForm({ ...form, pet_id: v })} disabled={!form.client_id}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{filteredPets.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Serviço</Label>
                <Select value={form.service_id} onValueChange={(v) => setForm({ ...form, service_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{services.map(s => <SelectItem key={s.id} value={s.id}>{s.name} - {formatBRL(s.price)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Data e Hora</Label><Input type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} /></div>
              <div><Label>Observações</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              <Button onClick={save} className="w-full bg-orange-500 hover:bg-orange-600">Agendar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-3">
        <CalIcon className="w-4 h-4 text-gray-500" />
        <Input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="max-w-[200px]" />
        {filterDate && <Button variant="ghost" onClick={() => setFilterDate('')}>Limpar</Button>}
      </div>

      <div className="grid gap-3">
        {items.map(a => (
          <Card key={a.id} className="p-4 flex items-center justify-between">
            <div>
              <div className="font-bold">{a.client?.name} • {a.pet?.name}</div>
              <div className="text-sm text-gray-500">{a.service?.name} • {formatBRL(a.service?.price)}</div>
              <div className="text-sm text-orange-600 mt-1">📅 {formatDateTime(a.scheduled_at)}</div>
              {a.notes && <div className="text-xs text-gray-400 mt-1">{a.notes}</div>}
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                a.status === 'completed' ? 'bg-green-100 text-green-700' :
                a.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                'bg-blue-100 text-blue-700'}`}>{a.status}</span>
              {a.status === 'scheduled' && <>
                <Button size="sm" variant="outline" onClick={() => updateStatus(a.id, 'completed')}>Concluír</Button>
                <Button size="sm" variant="ghost" onClick={() => updateStatus(a.id, 'cancelled')}>Cancelar</Button>
              </>}
            </div>
          </Card>
        ))}
        {items.length === 0 && <p className="text-gray-500 text-center py-10">Nenhum agendamento</p>}
      </div>
    </div>
  )
}
