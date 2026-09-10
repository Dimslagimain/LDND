import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireRole } from '@/lib/auth'

// DELETE: Remove user (superadmin only, cannot delete self)
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireRole('SUPERADMIN')
  if (!session) {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
  }

  const { id } = await params

  if (session.id === id) {
    return NextResponse.json({ error: 'Tidak bisa menghapus akun sendiri' }, { status: 400 })
  }

  try {
    await prisma.user.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })
  }
}
