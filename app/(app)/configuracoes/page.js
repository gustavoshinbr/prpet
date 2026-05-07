'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Trash2, UserPlus } from 'lucide-react'
import { toast } from 'sonner'

export default function ConfiguracoesPage() {
  const [users, setUsers] = useState([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', full_name: '' })
  const [loading, setLoading] = useState(false)
  const [est, setEst] = useState(null)

  useEffect(() => { load() }, [])
  const load = async () => {
    const sb = createClient()
    const { data: { user } } = await sb.auth.getUser()
    const { data: prof } = await sb.from('profiles').select('*, establishment:establishments(*)').eq('id', user.id).single()
    setEst(prof?.establishment)
    const { data } = await sb.from('profiles').select('*').eq('business_id', prof.business_id)
    setUsers(data || [])
  }

  const invite = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/invite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Operador convidado!')
      setOpen(false); setForm({ email: '', password: '', full_name: '' }); load()
    } catch (e) { toast.error(e.message) } finally { setLoading(false) }
  }

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold">Configurações</h1><p className="text-gray-500">Estabelecimento e usuários</p></div>

      <Card className="p-5">
        <h2 className="font-bold mb-3">Estabelecimento</h2>
        <div className="space-y-2 text-sm">
          <div><strong>Nome:</strong> {est?.name}</div>
          <div><strong>Status assinatura:</strong> <span className="text-green-600">{est?.subscription_status}</span></div>
          <div><strong>ID Asaas:</strong> {est?.asaas_customer_id || '—'}</div>
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold">Funcionários (Operadores)</h2>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button className="bg-orange-500 hover:bg-orange-600"><UserPlus className="w-4 h-4 mr-2" />Convidar</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Convidar Operador</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Nome</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
                <div><Label>E-mail</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                <div><Label>Senha temporária</Label><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} minLength={6} /></div>
                <Button onClick={invite} disabled={loading} className="w-full bg-orange-500 hover:bg-orange-600">Convidar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div className="space-y-2">
          {users.map(u => (
            <div key={u.id} className="flex items-center justify-between border-b pb-2">
              <div>
                <div className="font-medium">{u.full_name}</div>
                <div className="text-sm text-gray-500">{u.email}</div>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-medium ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                {u.role === 'admin' ? 'Admin' : 'Operador'}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
