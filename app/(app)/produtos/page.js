'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Trash2, Search, Barcode } from 'lucide-react'
import { formatBRL } from '@/lib/utils'
import { toast } from 'sonner'

export default function ProdutosPage() {
  const [items, setItems] = useState([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', price: '', barcode: '', stock: '0' })
  const [search, setSearch] = useState('')

  useEffect(() => { load() }, [])
  const load = async () => {
    const sb = createClient()
    const { data } = await sb.from('products').select('*').order('name')
    setItems(data || [])
  }

  const save = async () => {
    const sb = createClient()
    const { data: { user } } = await sb.auth.getUser()
    const { data: prof } = await sb.from('profiles').select('business_id').eq('id', user.id).single()
    const { error } = await sb.from('products').insert({
      name: form.name, price: parseFloat(form.price), barcode: form.barcode || null,
      stock: parseInt(form.stock || '0'), business_id: prof.business_id,
    })
    if (error) return toast.error(error.message)
    toast.success('Produto cadastrado!')
    setOpen(false); setForm({ name: '', price: '', barcode: '', stock: '0' }); load()
  }

  const remove = async (id) => {
    if (!confirm('Excluir?')) return
    const sb = createClient()
    await sb.from('products').delete().eq('id', id)
    load()
  }

  const filtered = items.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode?.includes(search))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold">Produtos / Estoque</h1><p className="text-gray-500">Cadastre produtos com código de barras</p></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="bg-orange-500 hover:bg-orange-600"><Plus className="w-4 h-4 mr-2" />Novo</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo Produto</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Código de Barras (escaneie ou digite)</Label>
                <div className="relative"><Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input className="pl-10" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} autoFocus placeholder="Pode usar leitor de código de barras" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Preço (R$)</Label><Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
                <div><Label>Estoque</Label><Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></div>
              </div>
              <Button onClick={save} className="w-full bg-orange-500 hover:bg-orange-600">Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input placeholder="Buscar por nome ou código..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(p => (
          <Card key={p.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="font-bold">{p.name}</div>
                {p.barcode && <div className="text-xs text-gray-500 font-mono">{p.barcode}</div>}
                <div className="text-orange-600 font-bold text-lg mt-1">{formatBRL(p.price)}</div>
                <div className="text-sm text-gray-500">Estoque: {p.stock}</div>
              </div>
              <button onClick={() => remove(p.id)} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 className="w-4 h-4" /></button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
