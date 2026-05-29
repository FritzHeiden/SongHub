import type { NextApiRequest, NextApiResponse } from 'next'
import {
} from '../../../lib/auth'
import { AUTH_COOKIE_NAME } from '../../../lib/auth-constants'
import { verifySessionToken } from '../../../lib/crypto'
import { deleteSession } from '../../../lib/sessions'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const forwardedProto = req.headers['x-forwarded-proto']
  const isHttps =
    (Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto) === 'https'
  const secure = isHttps ? '; Secure' : ''

  const token = req.cookies?.[AUTH_COOKIE_NAME]
  const sessionId = verifySessionToken(token)
  if (sessionId) {
    await deleteSession(sessionId)
  }

  res.setHeader(
    'Set-Cookie',
    `${AUTH_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`,
  )

  return res.status(200).json({ success: true })
}
