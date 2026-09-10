import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireRole, hashPassword } from '@/lib/auth'

// GET: List all users (superadmin only)
export async function GET() {
  const session = await requireRole('SUPERADMIN')
  if (!session) {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
  }

const users = await prisma.user.findMany({
  select: {
    id: true,
    username: true,
    role: true,
  },
})

const roleOrder: Record<string, number> = {
  SUPERADMIN: 1,
  ADMIN: 2,
  USER: 3,
}

users.sort((a, b) => {
  return (roleOrder[a.role] ?? 99) - (roleOrder[b.role] ?? 99)
})

  return NextResponse.json(users)
}

// POST: Create new user (superadmin only)
export async function POST(request: NextRequest) {
  const session = await requireRole('SUPERADMIN')
  if (!session) {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
  }

  try {
    const { username, password, role } = await request.json()

    if (!username || !password || !role) {
      return NextResponse.json({ error: 'Semua field diperlukan' }, { status: 400 })
    }

    if (!['SUPERADMIN', 'ADMIN', 'USER'].includes(role)) {
      return NextResponse.json({ error: 'Role tidak valid' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { username } })
    if (existing) {
      return NextResponse.json({ error: 'Username sudah digunakan' }, { status: 409 })
    }

    const hashedPassword = await hashPassword(password)
    const user = await prisma.user.create({
    data: { username, password: hashedPassword, role },
    select: {
    id: true,
    username: true,
    role: true,
  },
})

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error('Create user error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
