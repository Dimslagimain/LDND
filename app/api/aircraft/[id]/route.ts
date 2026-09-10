import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireRole } from '@/lib/auth'

// DELETE — Delete aircraft (cascades to carpet items & history)
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        if (!await requireRole('ADMIN')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
        const { id } = await params
        await prisma.aircraft.delete({ where: { id } })
        return NextResponse.json({ success: true })
    } catch (err) {
        console.error('DELETE /api/aircraft/[id] error:', err)
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
    }
}
