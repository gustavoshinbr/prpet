import { z } from 'zod'

export const clientSchema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  phone: z.string().min(8, 'Telefone obrigatório'),
  address: z.string().optional().default(''),
})

export const petSchema = z.object({
  name: z.string().min(1, 'Nome do pet obrigatório'),
  breed: z.string().optional().default(''),
  client_id: z.string().uuid(),
})

export const serviceSchema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  price: z.coerce.number().positive('Preço deve ser positivo'),
})

export const productSchema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  price: z.coerce.number().positive('Preço deve ser positivo'),
  barcode: z.string().optional().default(''),
  stock: z.coerce.number().int().nonnegative().default(0),
})

export const appointmentSchema = z.object({
  client_id: z.string().uuid(),
  pet_id: z.string().uuid(),
  service_id: z.string().uuid(),
  scheduled_at: z.string().min(1),
  notes: z.string().optional().default(''),
})

export const inviteSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  full_name: z.string().min(2),
})
