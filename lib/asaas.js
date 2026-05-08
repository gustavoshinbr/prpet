// Cliente Asaas via SDK oficial usado apenas no servidor.
import asaasSDK from 'asaas-sdk'

delete process.env.HTTP_PROXY
delete process.env.HTTPS_PROXY
delete process.env.http_proxy
delete process.env.https_proxy

const ASAAS_URL = (process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3').toLowerCase()
const ASAAS_KEY = process.env.ASAAS_API_KEY?.trim()

function getEnvironment() {
  const env = process.env.ASAAS_ENVIRONMENT?.toLowerCase()
  if (env === 'production' || env === 'producao') return asaasSDK.PRODUCTION
  if (env === 'sandbox') return asaasSDK.SANDBOX

  return ASAAS_URL.includes('sandbox') ? asaasSDK.SANDBOX : asaasSDK.PRODUCTION
}

function configureAsaas() {
  if (!ASAAS_KEY) {
    throw new Error('ASAAS_API_KEY nao configurada no ambiente do servidor')
  }

  asaasSDK.config({
    environment: getEnvironment(),
    apiKey: ASAAS_KEY,
    version: 'v3',
    debug: process.env.ASAAS_DEBUG === 'true',
  })
}

function getErrorMessage(error) {
  const data = error?.response?.data
  return (
    data?.errors?.[0]?.description ||
    data?.message ||
    error?.message ||
    'Erro ao chamar o Asaas'
  )
}

async function callAsaas(request) {
  try {
    configureAsaas()
    const response = await request()
    return response?.data
  } catch (error) {
    const status = error?.response?.status
    const prefix = status ? `Asaas ${status}` : 'Asaas'
    throw new Error(`${prefix}: ${getErrorMessage(error)}`)
  }
}

export async function createCustomer({ name, email, cpfCnpj, phone }) {
  return callAsaas(() => asaasSDK.customers.post({ name, email, cpfCnpj, phone }))
}

export async function createSubscription({
  customer,
  value,
  nextDueDate,
  billingType = 'PIX',
  cycle = 'MONTHLY',
  description = 'PR PET - Assinatura Mensal',
}) {
  return callAsaas(() => asaasSDK.subscriptions.post({
    customer,
    billingType,
    value,
    nextDueDate,
    cycle,
    description,
  }))
}

export async function getSubscription(id) {
  return callAsaas(() => asaasSDK.subscriptions.get(id))
}

export async function getLatestPayment(subscriptionId) {
  const data = await callAsaas(() => asaasSDK.payments.list({ subscription: subscriptionId, limit: 1 }))
  return data?.data?.[0]
}

export async function getPaymentLink(paymentId) {
  return callAsaas(() => asaasSDK.payments.get(paymentId))
}
