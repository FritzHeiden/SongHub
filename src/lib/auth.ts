import type { NextApiRequest } from 'next'
import { verifySessionToken } from './crypto'
import { getSession } from './sessions'
import { findUserById } from './users'
import { AUTH_COOKIE_NAME } from './auth-constants'

export type UserRole = 'user' | 'admin'

export const LOGIN_USERNAME = process.env.SONGHUB_LOGIN_USERNAME ?? ''
export const LOGIN_PASSWORD = process.env.SONGHUB_LOGIN_PASSWORD ?? ''

export const ADMIN_USERNAME = process.env.SONGHUB_ADMIN_USERNAME ?? ''
export const ADMIN_PASSWORD = process.env.SONGHUB_ADMIN_PASSWORD ?? ''

export interface AuthResult {
  valid: boolean
  role: UserRole
  username: string
}

export const resolveCredentials = (
  username?: string,
  password?: string,
): AuthResult => {
  if (!username || !password) {
    return { valid: false, role: 'user', username: username || '' }
  }

  // Admin credentials win if both usernames are equal but passwords differ.
  if (
    ADMIN_USERNAME &&
    ADMIN_PASSWORD &&
    username === ADMIN_USERNAME &&
    password === ADMIN_PASSWORD
  ) {
    return { valid: true, role: 'admin', username }
  }

  if (
    LOGIN_USERNAME &&
    LOGIN_PASSWORD &&
    username === LOGIN_USERNAME &&
    password === LOGIN_PASSWORD
  ) {
    return { valid: true, role: 'user', username }
  }

  return { valid: false, role: 'user', username }
}

export const isValidCredentials = (username?: string, password?: string): boolean => {
  return resolveCredentials(username, password).valid
}

export const getAuthFromRequestAsync = async (req: NextApiRequest): Promise<{
  isAuthed: boolean
  role: UserRole
  username: string
  userId: number | null
}> => {
  const token = req.cookies?.[AUTH_COOKIE_NAME]
  const sessionId = verifySessionToken(token)
  if (!sessionId) {
    return {
      isAuthed: false,
      role: 'user',
      username: '',
      userId: null,
    }
  }

  const session = await getSession(sessionId)
  if (!session) {
    return {
      isAuthed: false,
      role: 'user',
      username: '',
      userId: null,
    }
  }

  const user = await findUserById(session.user_id)
  if (!user) {
    return {
      isAuthed: false,
      role: 'user',
      username: '',
      userId: null,
    }
  }

  return {
    isAuthed: true,
    role: user.role,
    username: user.username,
    userId: user.id,
  }
}
