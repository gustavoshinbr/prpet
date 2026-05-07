// Cliente Asaas - gerencia assinaturas e clientes
// Documentação: https://docs.asaas.com

const ASAAS_URL = process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3'
const ASAAS_KEY = process.env.ASAAS_API_KEY  || "$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OjY4YTcyODg5LTMzZjYtNDcwZS1hMjgzLTVjYTc4NzJmMmE1Njo6JGFhY2hfYWYxZDk4OWYtMWQ4Mi00Mzg4LWFlNTAtMmMxNTRmY2M2Y2Iy"
  const res = await fetch(`${ASAAS_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'access_token': ASAAS_KEY,
      ...(options.headers || {}),
    },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data?.errors?.[0]?.description || `Asaas error ${res.status}`)
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
