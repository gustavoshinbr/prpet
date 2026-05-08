// Cliente Asaas - gerencia assinaturas e clientes
// Documentação: https://docs.asaas.com

const ASAAS_URL = (process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3').replace(/\/$/, '')
const ASAAS_KEY = process.env.ASAAS_API_KEY?.trim()

async function asaasFetch(path, options = {}) {
  if (!ASAAS_KEY) {
    throw new Error('ASAAS_API_KEY nao configurada no ambiente do servidor')
  }

  const res = await fetch(`${ASAAS_URL}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      'access_token': ASAAS_KEY,
      ...(options.headers || {}),
    },
  })
  const text = await res.text()
  let data = {}
  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    data = {}
  }

  if (!res.ok) {
    const message = data?.errors?.[0]?.description || data?.message || text || `Asaas error ${res.status}`
    throw new Error(`Asaas ${res.status}: ${message}`)
  }

  return data
}

export async function createCustomer({ name, email, cpfCnpj, phone }) {
  return asaasFetch('/customers', {
    method: 'POST',
    body: JSON.stringify({ name, email, cpfCnpj, phone }),
  })
}

export async function createSubscription({ customer, value, nextDueDate, billingType = 'PIX', cycle = 'MONTHLY', description = 'PR PET - Assinatura Mensal' }) {
  return asaasFetch('/subscriptions', {
    method: 'POST',
    body: JSON.stringify({ customer, billingType, value, nextDueDate, cycle, description }),
  })
}

export async function getSubscription(id) {
  return asaasFetch(`/subscriptions/${id}`)
}

export async function getLatestPayment(subscriptionId) {
  const data = await asaasFetch(`/subscriptions/${subscriptionId}/payments?limit=1`)
  return data?.data?.[0]
}

export async function getPaymentLink(paymentId) {
  return asaasFetch(`/payments/${paymentId}/identificationField`)
}
