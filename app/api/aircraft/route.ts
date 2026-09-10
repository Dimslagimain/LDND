import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth, requireRole } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET — List all aircraft with carpet items & replacement history
export async function GET() {
    try {
        if (!await requireAuth()) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        const aircraft = await prisma.aircraft.findMany({
            include: {
                carpetItems: {
                    include: {
                        replacementHistory: { orderBy: { doneNumber: 'asc' } },
                    },
                    orderBy: { carpetType: 'asc' },
                },
            },
            orderBy: [{ airline: 'asc' }, { acTypeGroup: 'asc' }, { registration: 'asc' }],
        })
        return NextResponse.json(aircraft)
    } catch (err) {
        console.error('GET /api/aircraft error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST — Create new aircraft with auto-generated carpet items
export async function POST(req: Request) {
    try {
        if (!await requireRole('ADMIN')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
        const body = await req.json()
        const { acType, acTypeGroup, registration, airline } = body

        if (!acType || !acTypeGroup || !registration || !airline) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Get intervals for this aircraft type from DB
        const dbIntervals = await prisma.carpetIntervalMaster.findMany({
            where: { acTypeGroup }
        })

        // Convert to a map: { Aisle: 8, Underseat: 12 }
        const intervalMap: Record<string, number> = {}
        for (const record of dbIntervals) {
            intervalMap[record.carpetType] = record.interval
        }

        const aircraft = await prisma.aircraft.create({
            data: {
                acType,
                acTypeGroup,
                registration: registration.toUpperCase(),
                airline,
                carpetItems: {
                    create: [
                        ...(intervalMap['Aisle'] !== undefined ? [{
                            carpetType: 'Aisle',
                            intervalMonths: intervalMap['Aisle'],
                        }] : []),
                        ...(intervalMap['Underseat'] !== undefined ? [{
                            carpetType: 'Underseat',
                            intervalMonths: intervalMap['Underseat'],
                        }] : []),
                    ],
                },
            },
            include: {
                carpetItems: {
                    include: { replacementHistory: true },
                    orderBy: { carpetType: 'asc' },
                },
            },
        })

        return NextResponse.json(aircraft, { status: 201 })
    } catch (err: unknown) {
        console.error('POST /api/aircraft error:', err)
        if (err && typeof err === 'object' && 'code' in err && err.code === 'P2002') {
            return NextResponse.json({ error: 'Registrasi sudah ada' }, { status: 409 })
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
