'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Trash2, Search } from 'lucide-react'
import { formatBRL } from '@/lib/utils'
import { toast } from 'sonner'

export default function ServicosPage() {
  const [items, setItems] = useState([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', price: '' })
  const [search, setSearch] = useState('')

  useEffect(() => { load() }, [])
  const load = async () => {
    const sb = createClient()
    const { data } = await sb.from('services').select('*').order('name')
    setItems(data || [])
  }

  const save = async () => {
    const sb = createClient()
    const { data: { user } } = await sb.auth.getUser()
    const { data: prof } = await sb.from('profiles').select('business_id').eq('id', user.id).single()
    const { error } = await sb.from('services').insert({ name: form.name, price: parseFloat(form.price), business_id: prof.business_id })
    if (error) return toast.error(error.message)
    toast.success('Serviço cadastrado!')
    setOpen(false); setForm({ name: '', price: '' }); load()
  }

  const remove = async (id) => {
    if (!confirm('Excluir?')) return
    const sb = createClient()
    await sb.from('services').delete().eq('id', id)
    load()
  }

  const filtered = items.filter(s => s.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold">Serviços</h1><p className="text-gray-500">Banho, tosa, consultas, vacinas...</p></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="bg-orange-500 hover:bg-orange-600"><Plus className="w-4 h-4 mr-2" />Novo</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo Serviço</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Preço (R$)</Label><Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
              <Button onClick={save} className="w-full bg-orange-500 hover:bg-orange-600">Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(s => (
          <Card key={s.id} className="p-4 flex items-center justify-between">
            <div>
              <div className="font-bold">{s.name}</div>
              <div className="text-orange-600 font-bold text-lg">{formatBRL(s.price)}</div>
            </div>
            <button onClick={() => remove(s.id)} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 className="w-4 h-4" /></button>
          </Card>
        ))}
      </div>
    </div>
  )
}
