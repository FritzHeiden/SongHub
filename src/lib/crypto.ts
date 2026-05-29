import crypto from 'crypto'

const SESSION_SECRET = process.env.SONGHUB_SESSION_SECRET || process.env.SONGHUB_LOGIN_PASSWORD || 'songhub-dev-secret'

function base64UrlEncode(input: Buffer | string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function base64UrlDecode(input: string): Buffer {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/')
  const padding = (4 - (normalized.length % 4)) % 4
  return Buffer.from(normalized + '='.repeat(padding), 'base64')
}

export function createSessionToken(sessionId: string): string {
  const payload = base64UrlEncode(sessionId)
  const signature = base64UrlEncode(
    crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest(),
  )
  return `${payload}.${signature}`
}

export function verifySessionToken(token?: string): string | null {
  if (!token || !token.includes('.')) return null
  const [payload, signature] = token.split('.')
  if (!payload || !signature) return null

  const expected = base64UrlEncode(
    crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest(),
  )

  const left = Buffer.from(signature)
  const right = Buffer.from(expected)
  if (left.length !== right.length || !crypto.timingSafeEqual(left, right)) {
    return null
  }

  try {
    return base64UrlDecode(payload).toString('utf-8')
  } catch {
    return null
  }
}

export function randomSessionId(): string {
  return crypto.randomUUID()
}
