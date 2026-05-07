export const TRIAL_DAYS = 7

export const ACTIVE_SUBSCRIPTION_STATUSES = ['CONFIRMED', 'RECEIVED', 'ACTIVE']

export function getTrialEndsAt(establishment) {
  const trialStartedAtValue = establishment?.trial_started_at || establishment?.created_at
  if (!trialStartedAtValue) return null

  const trialStartedAt = new Date(trialStartedAtValue)
  if (Number.isNaN(trialStartedAt.getTime())) return null

  const trialEndsAt = new Date(trialStartedAt)
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
