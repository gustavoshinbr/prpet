'use client'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Minus, Trash2, Barcode, Search, Printer, ShoppingCart } from 'lucide-react'
import { useReactToPrint } from 'react-to-print'
import { formatBRL } from '@/lib/utils'
import { toast } from 'sonner'
import Receipt from '@/components/receipt'

export default function PDVPage() {
  const [products, setProducts] = useState([])
  const [services, setServices] = useState([])
  const [clients, setClients] = useState([])
  const [cart, setCart] = useState([])
  const [search, setSearch] = useState('')
  const [barcode, setBarcode] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('Dinheiro')
  const [printerWidth, setPrinterWidth] = useState('80')
  const [clientId, setClientId] = useState('')
  const [lastSale, setLastSale] = useState(null)
  const [business, setBusiness] = useState(null)
  const receiptRef = useRef(null)

  const handlePrint = useReactToPrint({ contentRef: receiptRef, documentTitle: 'Cupom-PRPET' })

  useEffect(() => { load() }, [])
  const load = async () => {
    const sb = createClient()
    const { data: { user } } = await sb.auth.getUser()
    const { data: prof } = await sb.from('profiles').select('*, establishment:establishments(*)').eq('id', user.id).single()
    setBusiness(prof?.establishment)
    const [{ data: p }, { data: s }, { data: c }] = await Promise.all([
      sb.from('products').select('*'), sb.from('services').select('*'), sb.from('clients').select('id, name'),
    ])
    setProducts(p || []); setServices(s || []); setClients(c || [])
  }

  const addToCart = (item, type) => {
    const exist = cart.find(c => c.id === item.id && c.type === type)
    if (exist) setCart(cart.map(c => c.id === item.id && c.type === type ? { ...c, qty: c.qty + 1 } : c))
    else setCart([...cart, { id: item.id, name: item.name, price: Number(item.price), qty: 1, type }])
  }

  const onBarcode = (e) => {
    if (e.key !== 'Enter') return
    const p = products.find(x => x.barcode === barcode.trim())
    if (p) { addToCart(p, 'product'); setBarcode(''); toast.success(`+ ${p.name}`) }
    else toast.error('Produto não encontrado')
  }

  const total = cart.reduce((s, it) => s + it.qty * it.price, 0)
  const filteredP = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
  const filteredS = services.filter(s => s.name.toLowerCase().includes(search.toLowerCase()))

  const finalize = async () => {
    if (cart.length === 0) return toast.error('Carrinho vazio')
    if (paymentMethod === 'A Prazo' && !clientId) return toast.error('Selecione cliente para venda a prazo')
    const sb = createClient()
    const { data: { user } } = await sb.auth.getUser()
    const { data: prof } = await sb.from('profiles').select('business_id').eq('id', user.id).single()

    const { data: sale, error } = await sb.from('sales').insert({
      business_id: prof.business_id, total, payment_method: paymentMethod,
      client_id: clientId || null, status: paymentMethod === 'A Prazo' ? 'pending' : 'paid',
      operator_id: user.id,
    }).select().single()
    if (error) { toast.error(error.message); return }

    const items = cart.map(c => ({
      sale_id: sale.id, business_id: prof.business_id,
      product_id: c.type === 'product' ? c.id : null,
      service_id: c.type === 'service' ? c.id : null,
      name: c.name, quantity: c.qty, unit_price: c.price, total: c.qty * c.price,
    }))
    await sb.from('sale_items').insert(items)

    if (paymentMethod !== 'A Prazo') {
      await sb.from('financial_transactions').insert({
        business_id: prof.business_id, type: 'income', amount: total,
        payment_method: paymentMethod, sale_id: sale.id, description: `Venda #${sale.id.slice(0,8)}`,
      })
    }

    // decrement stock
    for (const c of cart.filter(x => x.type === 'product')) {
      const p = products.find(p => p.id === c.id)
      if (p) await sb.from('products').update({ stock: Math.max(0, p.stock - c.qty) }).eq('id', c.id)
    }

    toast.success('Venda finalizada!')
    setLastSale(sale)
    setTimeout(() => handlePrint(), 300)
    setCart([]); setClientId(''); load()
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-3rem)]">
      <div className="lg:col-span-2 space-y-4 overflow-auto">
        <h1 className="text-3xl font-bold">PDV — Checkout</h1>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input className="pl-10" placeholder="Escanear código de barras + Enter" value={barcode} onChange={(e) => setBarcode(e.target.value)} onKeyDown={onBarcode} autoFocus />
          </div>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input className="pl-10" placeholder="Buscar produto/serviço" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        <div>
          <h2 className="font-semibold mb-2">Produtos</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {filteredP.map(p => (
              <Card key={p.id} onClick={() => addToCart(p, 'product')} className="p-3 cursor-pointer hover:border-orange-500">
                <div className="font-medium text-sm">{p.name}</div>
                <div className="text-orange-600 font-bold">{formatBRL(p.price)}</div>
                <div className="text-xs text-gray-500">Estoque: {p.stock}</div>
              </Card>
            ))}
          </div>
        </div>
        <div>
          <h2 className="font-semibold mb-2">Serviços</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {filteredS.map(s => (
              <Card key={s.id} onClick={() => addToCart(s, 'service')} className="p-3 cursor-pointer hover:border-orange-500 bg-blue-50">
                <div className="font-medium text-sm">{s.name}</div>
                <div className="text-blue-600 font-bold">{formatBRL(s.price)}</div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <Card className="p-4 flex flex-col h-full">
        <div className="flex items-center gap-2 font-bold mb-3"><ShoppingCart className="w-5 h-5" /> Carrinho ({cart.length})</div>
        <div className="flex-1 overflow-auto space-y-2">
          {cart.map((it, i) => (
            <div key={i} className="flex items-center gap-2 text-sm border-b pb-2">
              <div className="flex-1">
                <div className="font-medium">{it.name}</div>
                <div className="text-xs text-gray-500">{formatBRL(it.price)} x {it.qty} = {formatBRL(it.qty * it.price)}</div>
              </div>
              <button onClick={() => setCart(cart.map((c, j) => i === j ? { ...c, qty: Math.max(1, c.qty - 1) } : c))} className="p-1 bg-gray-100 rounded"><Minus className="w-3 h-3" /></button>
              <button onClick={() => setCart(cart.map((c, j) => i === j ? { ...c, qty: c.qty + 1 } : c))} className="p-1 bg-gray-100 rounded"><Plus className="w-3 h-3" /></button>
              <button onClick={() => setCart(cart.filter((_, j) => j !== i))} className="p-1 text-red-500"><Trash2 className="w-3 h-3" /></button>
            </div>
          ))}
          {cart.length === 0 && <p className="text-center text-gray-400 py-6 text-sm">Carrinho vazio</p>}
        </div>

        <div className="border-t pt-3 space-y-3">
          <div className="flex justify-between text-2xl font-bold"><span>Total</span><span className="text-orange-600">{formatBRL(total)}</span></div>
          <div>
            <Label className="text-xs">Forma de Pagamento</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                <SelectItem value="PIX">PIX</SelectItem>
                <SelectItem value="Cartão">Cartão</SelectItem>
                <SelectItem value="A Prazo">A Prazo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {paymentMethod === 'A Prazo' && (
            <div>
              <Label className="text-xs">Cliente</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          <div>
            <Label className="text-xs">Impressora</Label>
            <Select value={printerWidth} onValueChange={setPrinterWidth}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="58">Térmica 58mm</SelectItem>
                <SelectItem value="80">Térmica 80mm</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={finalize} className="w-full bg-orange-500 hover:bg-orange-600 h-12 text-lg">
            Finalizar Venda
          </Button>
          {lastSale && (
            <Button onClick={handlePrint} variant="outline" className="w-full">
              <Printer className="w-4 h-4 mr-2" /> Reimprimir cupom
            </Button>
          )}
        </div>
      </Card>

      <div style={{ display: 'none' }}>
        <Receipt ref={receiptRef} sale={lastSale} items={cart.length ? cart.map(c => ({ name: c.name, qty: c.qty, price: c.price })) : []} business={business} width={parseInt(printerWidth)} />
      </div>
    </div>
  )
}
