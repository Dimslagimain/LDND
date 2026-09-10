import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { PREMATURE_GRACE_DAYS } from '@/lib/constants'
import { requireRole } from '@/lib/auth'

// POST — Record a new Done (replacement) for a carpet item
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        if (!await requireRole('ADMIN')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
        const { id } = await params
        const body = await req.json()
        const { doneDate } = body

        if (!doneDate) {
            return NextResponse.json({ error: 'doneDate is required' }, { status: 400 })
        }

        // Get the carpet item with its interval and existing history
        const carpetItem = await prisma.carpetItem.findUnique({
            where: { id },
            include: {
                replacementHistory: { orderBy: { doneNumber: 'desc' }, take: 1 },
            },
        })

        if (!carpetItem) {
            return NextResponse.json({ error: 'Carpet item not found' }, { status: 404 })
        }

        // Calculate new done number
        const lastDoneNumber = carpetItem.replacementHistory[0]?.doneNumber ?? 0
        const newDoneNumber = lastDoneNumber + 1

        // Check if premature (replaced before next due date)
        const doneDateObj = new Date(doneDate)
        let isPremature = false
        if (carpetItem.nextDue) {
            const threshold = new Date(carpetItem.nextDue)
            threshold.setDate(threshold.getDate() - PREMATURE_GRACE_DAYS)
            if (doneDateObj < threshold) {
                isPremature = true
            }
        }

        // Calculate new next due date: doneDate + intervalMonths
        const nextDue = new Date(doneDateObj)
        nextDue.setMonth(nextDue.getMonth() + carpetItem.intervalMonths)

        // Create replacement history & update carpet item in one transaction
        await prisma.$transaction([
            prisma.replacementHistory.create({
                data: {
                    carpetItemId: id,
                    doneNumber: newDoneNumber,
                    doneDate: doneDateObj,
                    isPremature,
                },
            }),
            prisma.carpetItem.update({
                where: { id },
                data: {
                    lastDone: doneDateObj,
                    nextDue: nextDue,
                },
            }),
        ])

        // Return updated carpet item
        const updated = await prisma.carpetItem.findUnique({
            where: { id },
            include: {
                replacementHistory: { orderBy: { doneNumber: 'asc' } },
                aircraft: true,
            },
        })

        return NextResponse.json(updated, { status: 201 })
    } catch (err) {
        console.error('POST /api/carpet-items/[id]/done error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
