import { cookies } from 'next/headers'

export type UserRole = 'SUPERADMIN' | 'ADMIN' | 'USER'

export interface SessionUser {
  id: string
  username: string
  role: UserRole
}

const JWT_SECRET = process.env.JWT_SECRET || 'ldnd-carpet-monitor-secret-key-2024'

// ── Password Hashing (SHA-256 + salt via Web Crypto) ──

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomUUID()
  const encoder = new TextEncoder()
  const data = encoder.encode(salt + password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return `${salt}:${hashHex}`
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [salt, hash] = storedHash.split(':')
  if (!salt || !hash) return false
  const encoder = new TextEncoder()
  const data = encoder.encode(salt + password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return hashHex === hash
}

// ── Session Token (HMAC-SHA256 signed JSON) ──

async function sign(payload: string): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(JWT_SECRET),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))
  const sigHex = Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('')
  return `${btoa(payload)}.${sigHex}`
}

async function verify(token: string): Promise<string | null> {
  try {
    const [payloadB64, sigHex] = token.split('.')
    if (!payloadB64 || !sigHex) return null
    const payload = atob(payloadB64)
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw', encoder.encode(JWT_SECRET),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
    )
    const sigBytes = new Uint8Array(sigHex.match(/.{2}/g)!.map(h => parseInt(h, 16)))
    const valid = await crypto.subtle.verify('HMAC', key, sigBytes, encoder.encode(payload))
    return valid ? payload : null
  } catch {
    return null
  }
}

// ── Session Cookie Management ──

const COOKIE_NAME = 'ldnd_session'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export async function createSession(user: SessionUser): Promise<string> {
  const payload = JSON.stringify({ id: user.id, username: user.username, role: user.role, exp: Date.now() + COOKIE_MAX_AGE * 1000 })
  return sign(payload)
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null

  const payload = await verify(token)
  if (!payload) return null

  try {
    const data = JSON.parse(payload)
    if (data.exp && data.exp < Date.now()) return null
    return { id: data.id, username: data.username, role: data.role }
  } catch {
    return null
  }
}

export function setSessionCookie(token: string) {
  // Return cookie options for the response
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  }
}

export function deleteSessionCookie() {
  return {
    name: COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 0,
    path: '/',
  }
}

// ── Role Checking ──

const ROLE_HIERARCHY: Record<UserRole, number> = {
  USER: 0,
  ADMIN: 1,
  SUPERADMIN: 2,
}

export function hasMinRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]
}

export async function requireAuth(): Promise<SessionUser | null> {
  return getSession()
}

export async function requireRole(role: UserRole): Promise<SessionUser | null> {
  const user = await getSession()
  if (!user) return null
  if (!hasMinRole(user.role, role)) return null
  return user
}
