'use client'
import { forwardRef } from 'react'
import { formatBRL, formatDateTime } from '@/lib/utils'

const Receipt = forwardRef(function Receipt({ sale, items, business, width = 80 }, ref) {
  // 80mm ≈ 302px @ 96dpi, 58mm ≈ 219px - we use 'mm' for print
  const w = width === 58 ? '58mm' : '80mm'
  const fontSize = width === 58 ? '10px' : '12px'

  return (
    <div ref={ref} style={{ width: w, padding: '4mm', fontFamily: 'monospace', fontSize, color: '#000', background: '#fff' }}>
      <style>{`@media print { @page { size: ${w} auto; margin: 0; } body { margin: 0; } }`}</style>
      <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: width === 58 ? '12px' : '14px' }}>{business?.name || 'PR PET'}</div>
      <div style={{ textAlign: 'center', fontSize: '10px' }}>CUPOM NÃO FISCAL</div>
      <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />
      <div>Data: {formatDateTime(sale?.created_at || new Date())}</div>
      <div>Venda #{(sale?.id || '').toString().slice(0,8)}</div>
      <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />
      {items.map((it, i) => (
        <div key={i} style={{ marginBottom: '2px' }}>
          <div>{it.name}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>{it.qty} x {formatBRL(it.price)}</span>
            <span>{formatBRL(it.qty * it.price)}</span>
          </div>
        </div>
      ))}
      <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: width === 58 ? '12px' : '14px' }}>
        <span>TOTAL</span><span>{formatBRL(sale?.total || 0)}</span>
      </div>
      <div>Pagamento: {sale?.payment_method}</div>
      <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />
      <div style={{ textAlign: 'center', fontSize: '10px' }}>Obrigado pela preferência!</div>
      <div style={{ height: '20mm' }} />
    </div>
  )
})

export default Receipt
