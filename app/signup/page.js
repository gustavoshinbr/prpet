'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PawPrint, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function SignupPage() {
  const [form, setForm] = useState({ email: '', password: '', full_name: '', business_name: '', phone: '', cpf_cnpj: '' })
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSignup = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.full_name,
            business_name: form.business_name,
            phone: form.phone,
            cpf_cnpj: form.cpf_cnpj,
          },
        },
      })
      if (error) throw error
      toast.success('Conta criada! Vamos para o pagamento...')
      router.push('/checkout')
      router.refresh()
    } catch (err) {
      toast.error(err.message || 'Erro ao criar conta')
    } finally {
      setLoading(false)
    }
  }

  const handle = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center mb-3">
            <PawPrint className="text-white w-8 h-8" />
          </div>
          <CardTitle className="text-2xl">Crie sua conta</CardTitle>
          <p className="text-sm text-gray-500">R$ 80,00/mês • Cancele quando quiser</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-3">
            <div><Label>Nome do Petshop</Label><Input value={form.business_name} onChange={handle('business_name')} required /></div>
            <div><Label>Seu nome completo</Label><Input value={form.full_name} onChange={handle('full_name')} required /></div>
            <div><Label>CPF/CNPJ</Label><Input value={form.cpf_cnpj} onChange={handle('cpf_cnpj')} required /></div>
            <div><Label>Telefone</Label><Input value={form.phone} onChange={handle('phone')} required /></div>
            <div><Label>E-mail</Label><Input type="email" value={form.email} onChange={handle('email')} required /></div>
            <div><Label>Senha</Label><Input type="password" value={form.password} onChange={handle('password')} required minLength={6} /></div>
            <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Criar conta
            </Button>
            <p className="text-center text-sm text-gray-600">
              Já tem conta? <Link href="/login" className="text-orange-500 font-medium">Entrar</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
