import type { NextApiRequest, NextApiResponse } from 'next'
import {
  resolveCredentials,
} from '../../../lib/auth'
import { AUTH_COOKIE_NAME } from '../../../lib/auth-constants'
import { appendAccessLog, getClientIp } from '../../../lib/audit'
import { ensureUser } from '../../../lib/users'
import { createSession } from '../../../lib/sessions'
import { createSessionToken } from '../../../lib/crypto'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { username, password } = req.body ?? {}
  const resolved = resolveCredentials(username, password)

  if (!resolved.valid) {
    appendAccessLog({
      timestamp: new Date().toISOString(),
      username: username || 'unknown',
      role: 'user',
      ip: getClientIp(req),
      success: false,
      event: 'login_failed',
    })

    return res.status(401).json({ error: 'Ungültige Zugangsdaten' })
  }

  const forwardedProto = req.headers['x-forwarded-proto']
  const isHttps =
    (Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto) === 'https'

  // Secure-Cookie nur auf HTTPS setzen (sonst funktioniert Login auf http:// nicht)
  const secure = isHttps ? '; Secure' : ''
  const maxAge = 60 * 60 * 24 * 7

  const user = await ensureUser(resolved.username, resolved.role)
  const session = await createSession(user.id)
  const token = createSessionToken(session.id)

  res.setHeader('Set-Cookie', `${AUTH_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`)

  appendAccessLog({
    timestamp: new Date().toISOString(),
    username: resolved.username,
    role: resolved.role,
    ip: getClientIp(req),
    success: true,
    event: 'login_success',
  })

  return res.status(200).json({ success: true, role: user.role })
}
