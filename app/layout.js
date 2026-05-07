import './globals.css'
import { Toaster } from 'sonner'

export const metadata = {
  title: 'PR PET - Gestão de Petshop',
  description: 'Sistema completo de gestão para petshops',
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
