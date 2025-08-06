export const DEFAULTS = {
  TIMEOUT_MS: 15_000,
  MAX_RETRIES: 3,
  BACKOFF_BASE_MS: 250,
  BACKOFF_MAX_MS: 5_000,
  USER_AGENT: 'xoxa-msg/0.1.0',
};

export const CHANNELS = ['sms', 'whatsapp', 'telegram'] as const;