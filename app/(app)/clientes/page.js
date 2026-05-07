'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Search, Trash2, PawPrint } from 'lucide-react'
import { toast } from 'sonner'

export default function ClientesPage() {
  const [clients, setClients] = useState([])
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [petOpen, setPetOpen] = useState(null)
  const [form, setForm] = useState({ name: '', phone: '', address: '' })
  const [petForm, setPetForm] = useState({ name: '', breed: '' })

  useEffect(() => { load() }, [])
  const load = async () => {
    const sb = createClient()
    const { data } = await sb.from('clients').select('*, pets(*)').order('created_at', { ascending: false })
    setClients(data || [])
  }

  const save = async () => {
    const sb = createClient()
    const { data: { user } } = await sb.auth.getUser()
    const { data: prof } = await sb.from('profiles').select('business_id').eq('id', user.id).single()
    const { error } = await sb.from('clients').insert({ ...form, business_id: prof.business_id })
    if (error) return toast.error(error.message)
    toast.success('Cliente cadastrado!')
    setOpen(false); setForm({ name: '', phone: '', address: '' }); load()
  }

  const addPet = async (clientId) => {
    const sb = createClient()
    const { data: { user } } = await sb.auth.getUser()
    const { data: prof } = await sb.from('profiles').select('business_id').eq('id', user.id).single()
    const { error } = await sb.from('pets').insert({ ...petForm, client_id: clientId, business_id: prof.business_id })
    if (error) return toast.error(error.message)
    toast.success('Pet adicionado!')
    setPetOpen(null); setPetForm({ name: '', breed: '' }); load()
  }

  const remove = async (id) => {
    if (!confirm('Excluir cliente?')) return
    const sb = createClient()
    await sb.from('clients').delete().eq('id', id)
    load()
  }

  const filtered = clients.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold">Clientes & Pets</h1><p className="text-gray-500">Gerencie seus clientes e os pets</p></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="bg-orange-500 hover:bg-orange-600"><Plus className="w-4 h-4 mr-2" />Novo Cliente</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Cadastrar Cliente</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Telefone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div><Label>Endereço</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
              <Button onClick={save} className="w-full bg-orange-500 hover:bg-orange-600">Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input placeholder="Buscar por nome ou telefone..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      <div className="grid gap-4">
        {filtered.map(c => (
          <Card key={c.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="font-bold text-lg">{c.name}</div>
                <div className="text-sm text-gray-500">{c.phone} • {c.address}</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(c.pets || []).map(p => (
                    <div key={p.id} className="px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-sm flex items-center gap-1">
                      <PawPrint className="w-3 h-3" /> {p.name} {p.breed && `(${p.breed})`}
                    </div>
                  ))}
                  <Dialog open={petOpen === c.id} onOpenChange={(v) => setPetOpen(v ? c.id : null)}>
                    <DialogTrigger asChild><button className="px-3 py-1 border border-dashed rounded-full text-sm text-gray-500 hover:bg-gray-50">+ Pet</button></DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Novo Pet de {c.name}</DialogTitle></DialogHeader>
                      <div className="space-y-3">
                        <div><Label>Nome</Label><Input value={petForm.name} onChange={(e) => setPetForm({ ...petForm, name: e.target.value })} /></div>
                        <div><Label>Raça</Label><Input value={petForm.breed} onChange={(e) => setPetForm({ ...petForm, breed: e.target.value })} /></div>
                        <Button onClick={() => addPet(c.id)} className="w-full bg-orange-500 hover:bg-orange-600">Adicionar Pet</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              <button onClick={() => remove(c.id)} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 className="w-4 h-4" /></button>
            </div>
          </Card>
        ))}
        {filtered.length === 0 && <p className="text-gray-500 text-center py-10">Nenhum cliente encontrado</p>}
      </div>
    </div>
  )
}
