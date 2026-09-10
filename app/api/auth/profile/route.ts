import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createSession, getSession, hashPassword, setSessionCookie, verifyPassword, type UserRole } from '@/lib/auth'

export async function PUT(request: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Sesi tidak ditemukan' }, { status: 401 })
  }

  try {
    const body = await request.json() as {
      username?: string
      currentPassword?: string
      newPassword?: string
    }
    const username = body.username?.trim()
    const currentPassword = body.currentPassword ?? ''
    const newPassword = body.newPassword?.trim() ?? ''

    if (!username || username.length < 3) {
      return NextResponse.json({ error: 'Username minimal 3 karakter' }, { status: 400 })
    }
    if (!currentPassword) {
      return NextResponse.json({ error: 'Password saat ini wajib diisi' }, { status: 400 })
    }
    if (newPassword && newPassword.length < 6) {
      return NextResponse.json({ error: 'Password baru minimal 6 karakter' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { id: session.id } })
    if (!existing || !await verifyPassword(currentPassword, existing.password)) {
      return NextResponse.json({ error: 'Password saat ini salah' }, { status: 400 })
    }

    const updated = await prisma.user.update({
      where: { id: session.id },
      data: {
        username,
        ...(newPassword ? { password: await hashPassword(newPassword) } : {}),
      },
      select: { id: true, username: true, role: true },
    })

    const response = NextResponse.json({ user: updated })
    const sessionUser = {
     id: updated.id,
     username: updated.username,
     role: updated.role as UserRole,
    }

response.cookies.set(setSessionCookie(await createSession(sessionUser)))
    return response
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json({ error: 'Username sudah digunakan' }, { status: 409 })
    }
    console.error('PUT /api/auth/profile error:', error)
    return NextResponse.json({ error: 'Gagal memperbarui akun' }, { status: 500 })
  }
}
