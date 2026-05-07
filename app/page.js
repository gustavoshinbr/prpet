import Link from 'next/link'
import { PawPrint, Calendar, ShoppingCart, BarChart3, Users, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      <header className="container mx-auto py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
            <PawPrint className="text-white w-6 h-6" />
          </div>
          <span className="text-2xl font-bold">PR PET</span>
        </div>
        <div className="flex gap-3">
          <Link href="/login"><Button variant="ghost">Entrar</Button></Link>
          <Link href="/signup"><Button className="bg-orange-500 hover:bg-orange-600">Criar conta</Button></Link>
        </div>
      </header>

      <main className="container mx-auto py-20 text-center">
        <div className="inline-block px-4 py-2 bg-orange-100 text-orange-700 rounded-full text-sm font-medium mb-6">
          R$ 80,00/mês • Sem fidelidade
        </div>
        <h1 className="text-5xl md:text-6xl font-bold mb-6 text-gray-900">
          Gerencie seu petshop<br /><span className="text-orange-500">com simplicidade</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
          Sistema completo: agendamentos, vendas, estoque, fluxo de caixa e relatórios. Tudo em um só lugar.
        </p>
        <Link href="/signup">
          <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-lg px-8 h-14">
            Começar agora
          </Button>
        </Link>

        <div className="grid md:grid-cols-3 gap-6 mt-20 text-left">
          {[
            { icon: Calendar, title: 'Agendamentos', desc: 'Calendário dinâmico para banho, tosa e consultas' },
            { icon: ShoppingCart, title: 'PDV Completo', desc: 'Checkout com cupom não-fiscal 58/80mm' },
            { icon: Package, title: 'Estoque', desc: 'Controle com leitura de código de barras' },
            { icon: Users, title: 'Multi-usuário', desc: 'Convide funcionários com permissões' },
            { icon: BarChart3, title: 'Relatórios', desc: 'KPIs diários e análise por período' },
            { icon: PawPrint, title: 'Cadastro de Pets', desc: 'Clientes vinculados aos seus pets' },
          ].map((f, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border">
              <f.icon className="w-10 h-10 text-orange-500 mb-3" />
              <h3 className="font-bold text-lg mb-1">{f.title}</h3>
              <p className="text-gray-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
