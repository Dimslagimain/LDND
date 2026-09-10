import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireRole } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET — Retrieve all interval master config
export async function GET() {
    try {
        const intervals = await prisma.carpetIntervalMaster.findMany({
            orderBy: [{ acTypeGroup: 'asc' }, { carpetType: 'asc' }]
        })
        return NextResponse.json(intervals)
    } catch (err) {
        console.error('GET /api/intervals error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST — Update interval master & cascade changes to all affected aircraft
export async function POST(req: Request) {
    try {
        if (!await requireRole('ADMIN')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
        const body = await req.json()
        const { acTypeGroup, carpetType, interval } = body

        if (!acTypeGroup || !carpetType || interval === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        if (interval < 1) {
            return NextResponse.json({ error: 'Interval must be at least 1 month' }, { status: 400 })
        }

        // 1. Find all specific carpet items for all aircraft of this group
        const items = await prisma.carpetItem.findMany({
            where: {
                carpetType: carpetType,
                aircraft: {
                    acTypeGroup: acTypeGroup,
                }
            }
        })

        // 2. Prepare transaction queries
        const queries = []

        // A. Update the master rules
        queries.push(
            prisma.carpetIntervalMaster.upsert({
                where: {
                    acTypeGroup_carpetType: {
                        acTypeGroup,
                        carpetType,
                    }
                },
                update: { interval },
                create: { acTypeGroup, carpetType, interval },
            })
        )

        // B. Update each individual aircraft's carpet item and retro-calculate nextDue
        for (const item of items) {
            let nextDue = null

            // If the carpet has been replaced before, calculate new Next Due
            if (item.lastDone) {
                nextDue = new Date(item.lastDone)
                nextDue.setMonth(nextDue.getMonth() + interval)
            }

            queries.push(
                prisma.carpetItem.update({
                    where: { id: item.id },
                    data: {
                        intervalMonths: interval,
                        nextDue: nextDue,
                    }
                })
            )
        }

        // 3. Execute all queries atomically
        await prisma.$transaction(queries)

        return NextResponse.json({
            message: 'Interval updated successfully',
            affectedAircraft: items.length
        }, { status: 200 })

    } catch (err) {
        console.error('POST /api/intervals error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
