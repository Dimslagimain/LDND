import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireRole } from '@/lib/auth'

// PUT — Update carpet item fields (remark, vendor, coatroom)
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        if (!await requireRole('ADMIN')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
        const { id } = await params
        const body = await req.json()
        const { remark, acStatus, vendor, coatroom } = body

        const updated = await prisma.carpetItem.update({
            where: { id },
            data: {
                ...(remark !== undefined && { remark }),
                ...(acStatus !== undefined && { acStatus }),
                ...(vendor !== undefined && { vendor }),
                ...(coatroom !== undefined && { coatroom }),
            },
        })

        return NextResponse.json(updated)
    } catch (err) {
        console.error('PUT /api/carpet-items/[id] error:', err)
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
    }
}
