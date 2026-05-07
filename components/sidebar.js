'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LayoutDashboard, Users, Calendar, Wrench, Package, ShoppingCart, Wallet, BarChart3, Settings, LogOut, PawPrint, Receipt } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Sidebar({ profile }) {
  const pathname = usePathname()
  const router = useRouter()
  const isAdmin = profile?.role === 'admin'

  const items = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/clientes', label: 'Clientes & Pets', icon: Users },
    { href: '/agendamentos', label: 'Agendamentos', icon: Calendar },
    { href: '/servicos', label: 'Serviços', icon: Wrench },
    { href: '/produtos', label: 'Produtos', icon: Package },
    { href: '/pdv', label: 'PDV / Checkout', icon: ShoppingCart },
    { href: '/contas-a-receber', label: 'Contas a Receber', icon: Receipt },
    ...(isAdmin ? [
      { href: '/fechamento', label: 'Fechamento de Caixa', icon: Wallet },
      { href: '/relatorios', label: 'Relatórios', icon: BarChart3 },
      { href: '/configuracoes', label: 'Configurações', icon: Settings },
    ] : []),
  ]

  const logout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="w-64 bg-white border-r min-h-screen flex flex-col">
      <div className="p-5 border-b">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center">
            <PawPrint className="text-white w-5 h-5" />
          </div>
          <div>
            <div className="font-bold leading-none">PR PET</div>
            <div className="text-xs text-gray-500">{profile?.business_name || 'Petshop'}</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {items.map((item) => {
          const active = pathname === item.href
          return (
            <Link key={item.href} href={item.href}
              className={cn('flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition',
                active ? 'bg-orange-50 text-orange-700 font-medium' : 'text-gray-600 hover:bg-gray-50')}>
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="p-3 border-t">
        <div className="px-3 py-2 text-xs text-gray-500">{profile?.full_name} • {profile?.role === 'admin' ? 'Admin' : 'Operador'}</div>
        <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
          <LogOut className="w-4 h-4" /> Sair
        </button>
      </div>
    </aside>
  )
}
