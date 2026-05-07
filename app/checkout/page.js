'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PawPrint, Loader2, CheckCircle2, RefreshCw, PlayCircle } from 'lucide-react'
import { toast } from 'sonner'
import { canAccessApp } from '@/lib/subscription'

export default function CheckoutPage() {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(null)
  const [paymentLink, setPaymentLink] = useState(null)
  const router = useRouter()

  useEffect(() => { checkStatus() }, [])

  const checkStatus = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data: est } = await supabase.from('establishments').select('*').eq('owner_id', user.id).single()
    if (canAccessApp(est)) {
      router.push('/dashboard')
    }
    setStatus(est?.subscription_status)
    setPaymentLink(est?.payment_link)
  }

  const createSubscription = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/asaas/create-subscription', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPaymentLink(data.invoiceUrl)
      setStatus('PENDING')
      toast.success('Assinatura criada! Realize o pagamento.')
    } catch (e) { toast.error(e.message) } finally { setLoading(false) }
  }

  const startTrial = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/subscription/start-trial', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Teste gratis liberado por 7 dias.')
      router.push('/dashboard')
      router.refresh()
    } catch (e) { toast.error(e.message) } finally { setLoading(false) }
  }

  const refresh = async () => {
    setLoading(true)
    await fetch('/api/asaas/sync-status', { method: 'POST' })
    await checkStatus()
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center mb-3">
            <PawPrint className="text-white w-8 h-8" />
          </div>
          <CardTitle className="text-2xl">Ative sua assinatura</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-orange-600">R$ 80,00<span className="text-base font-normal">/mês</span></div>
            <div className="text-sm text-gray-600">Teste gratis por 7 dias ou assinatura mensal</div>
          </div>

          {status && (
            <div className="text-sm bg-gray-50 rounded p-3">
              <strong>Status atual:</strong> {status || 'PENDING'}
            </div>
          )}

          {status !== 'TRIAL' && (
            <Button onClick={startTrial} disabled={loading} className="w-full bg-orange-500 hover:bg-orange-600 h-12">
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <PlayCircle className="w-4 h-4 mr-2" />}
              Testar sistema
            </Button>
          )}

          {!paymentLink ? (
            <Button onClick={createSubscription} disabled={loading} variant="outline" className="w-full h-12">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Gerar cobranca no Asaas
            </Button>
          ) : (
            <>
              <a href={paymentLink} target="_blank" rel="noopener" className="block">
                <Button className="w-full bg-orange-500 hover:bg-orange-600 h-12">
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Ir para pagamento
                </Button>
              </a>
              <Button variant="outline" onClick={refresh} disabled={loading} className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" /> Já paguei — atualizar status
              </Button>
            </>
          )}

          <Button variant="ghost" onClick={async () => { const sb = createClient(); await sb.auth.signOut(); router.push('/login') }} className="w-full">
            Sair
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
