import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatBRL(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0))
}

export function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('pt-BR')
}

export function formatDateTime(d) {
  if (!d) return ''
  return new Date(d).toLocaleString('pt-BR')
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10)
}
