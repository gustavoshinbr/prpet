export const TRIAL_DAYS = 7

export const ACTIVE_SUBSCRIPTION_STATUSES = ['CONFIRMED', 'RECEIVED', 'ACTIVE']

export function getTrialEndsAt(establishment) {
  if (!establishment?.created_at) return null

  const createdAt = new Date(establishment.created_at)
  if (Number.isNaN(createdAt.getTime())) return null

  const trialEndsAt = new Date(createdAt)
  trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DAYS)
  return trialEndsAt
}

export function isTrialActive(establishment, now = new Date()) {
  if (establishment?.subscription_status !== 'TRIAL') return false

  const trialEndsAt = getTrialEndsAt(establishment)
  return Boolean(trialEndsAt && trialEndsAt > now)
}

export function hasActiveSubscription(establishment) {
  return ACTIVE_SUBSCRIPTION_STATUSES.includes(establishment?.subscription_status)
}

export function canAccessApp(establishment, now = new Date()) {
  return hasActiveSubscription(establishment) || isTrialActive(establishment, now)
}
