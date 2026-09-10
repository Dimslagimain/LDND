import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireRole } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const records = await prisma.rawmatQty.findMany()
        const result: Record<string, { qty: number; unit: string }> = {
            GA: { qty: 0, unit: 'YD' },
            QG: { qty: 0, unit: 'YD' },
        }
        for (const r of records) {
            result[r.airline] = { qty: r.qty, unit: r.unit }
        }
        return NextResponse.json(result)
    } catch (err) {
        console.error('Rawmat GET error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function PUT(req: Request) {
    try {
        if (!await requireRole('ADMIN')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
        const body = await req.json()
        const { airline, qty, unit } = body as { airline: string; qty: number; unit: string }

        if (!airline || qty === undefined) {
            return NextResponse.json({ error: 'airline and qty are required' }, { status: 400 })
        }

        const record = await prisma.rawmatQty.upsert({
            where: { airline },
            update: { qty, unit: unit || 'YD' },
            create: { airline, qty, unit: unit || 'YD' },
        })

        return NextResponse.json(record)
    } catch (err) {
        console.error('Rawmat PUT error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
